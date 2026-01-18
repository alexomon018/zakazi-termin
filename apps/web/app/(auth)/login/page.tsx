"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ErrorCode, errorMessages } from "@salonko/auth";
import { Button, Card, CardContent, GoogleIcon, Input, Label } from "@salonko/ui";
import { AlertCircle, Calendar, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";

import { type LoginFormData, loginSchema } from "@/lib/validations/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardContent className="p-8">
        <div className="space-y-6 animate-pulse">
          <div className="space-y-2 text-center">
            <div className="mx-auto w-32 h-8 rounded bg-muted" />
            <div className="mx-auto w-48 h-4 rounded bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-12 rounded-lg bg-muted" />
            <div className="h-12 rounded-lg bg-muted" />
            <div className="h-12 rounded-lg bg-muted" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const errorParam = searchParams.get("error");
  const verified = searchParams.get("verified") === "true";

  const [serverError, setServerError] = useState<string | null>(
    errorParam ? errorMessages[errorParam as ErrorCode] || "Greška pri prijavi" : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(
    verified ? "Email je uspešno verifikovan. Prijavite se." : null
  );
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setServerError(errorMessages[result.error as ErrorCode] || "Greška pri prijavi");
        setIsLoading(false);
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setServerError("Došlo je do greške. Pokušajte ponovo.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="mx-auto w-full max-w-md animate-fade-in-up">
      <Card className="border-0 backdrop-blur-sm shadow-elevated-lg bg-card/80">
        <CardContent className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="inline-flex gap-2 justify-center items-center mb-3 transition-transform hover:scale-105"
            >
              <div className="flex justify-center items-center w-10 h-10 bg-gradient-to-br rounded-xl shadow-lg from-primary to-primary/70 shadow-primary/20">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span
                data-testid="login-title"
                className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300"
              >
                Salonko
              </span>
            </Link>
            <p data-testid="login-subtitle" className="text-sm text-gray-500 dark:text-gray-400">
              Prijavite se na vaš nalog
            </p>
          </div>

          {/* Messages */}
          {successMessage && (
            <div
              data-testid="login-success-message"
              className="p-4 mb-6 text-sm text-green-700 bg-green-50 rounded-lg border border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800/50 animate-fade-in"
            >
              <div className="flex gap-2 items-center">
                <CheckCircle2 className="flex-shrink-0 w-4 h-4" aria-hidden="true" />
                {successMessage}
              </div>
            </div>
          )}

          {serverError && (
            <div
              data-testid="login-error-message"
              className="p-4 mb-6 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800/50 animate-fade-in"
            >
              <div className="flex gap-2 items-center">
                <XCircle className="flex-shrink-0 w-4 h-4" aria-hidden="true" />
                {serverError}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                data-testid="login-email-input"
                type="email"
                placeholder="vas@email.com"
                disabled={isLoading}
                className="px-4 h-12 transition-colors bg-background/50 border-border/50 focus:border-primary focus:bg-background"
                {...register("email")}
              />
              {errors.email && (
                <p
                  data-testid="login-email-error"
                  className="flex gap-1 items-center mt-1 text-xs text-destructive"
                >
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Lozinka
              </Label>
              <Input
                id="password"
                data-testid="login-password-input"
                type="password"
                placeholder="Vaša lozinka"
                disabled={isLoading}
                className="px-4 h-12 transition-colors bg-background/50 border-border/50 focus:border-primary focus:bg-background"
                {...register("password")}
              />
              {errors.password && (
                <p
                  data-testid="login-password-error"
                  className="flex gap-1 items-center mt-1 text-xs text-destructive"
                >
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                data-testid="login-forgot-password-link"
                className="text-sm transition-colors text-primary hover:text-primary/80"
              >
                Zaboravili ste lozinku?
              </Link>
            </div>

            <Button
              type="submit"
              data-testid="login-submit-button"
              className="w-full h-12 text-base font-medium transition-all duration-300 shadow-glow hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex gap-2 items-center">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Prijavljivanje...
                </span>
              ) : (
                "Prijavite se"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="flex absolute inset-0 items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="flex relative justify-center">
              <span className="px-4 text-sm text-muted-foreground bg-card">ili</span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            data-testid="login-google-button"
            className="w-full h-12 text-base font-medium transition-all duration-200 border-border/50 hover:bg-accent hover:border-border"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <GoogleIcon className="mr-3 w-5 h-5" />
            Nastavite sa Google
          </Button>

          {/* Sign Up Link */}
          <p className="mt-8 text-sm text-center text-muted-foreground">
            Nemate nalog?{" "}
            <Link
              href="/signup"
              data-testid="login-signup-link"
              className="font-semibold transition-colors text-primary hover:text-primary/80"
            >
              Registrujte se
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
