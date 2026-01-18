"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ErrorCode, errorMessages } from "@salonko/auth";
import { Button, Card, CardContent, Input, Label } from "@salonko/ui";
import { Calendar } from "lucide-react";
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
                <svg
                  className="flex-shrink-0 w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
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
                <svg
                  className="flex-shrink-0 w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
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
                type="text"
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
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
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
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
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
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
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
            <svg className="mr-3 w-5 h-5" viewBox="0 0 24 24" role="img" aria-label="Google logo">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Prijavite se sa Google
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
