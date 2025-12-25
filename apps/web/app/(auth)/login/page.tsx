"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ErrorCode, errorMessages } from "@zakazi-termin/auth";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@zakazi-termin/ui";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { type LoginFormData, loginSchema } from "@/lib/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const errorParam = searchParams.get("error");

  const [serverError, setServerError] = useState<string | null>(
    errorParam ? errorMessages[errorParam as ErrorCode] || "Greška pri prijavi" : null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setServerError(errorMessages[result.error as ErrorCode] || "Greška pri prijavi");
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setServerError("Došlo je do greške. Pokušajte ponovo.");
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle
          data-testid="login-title"
          className="text-2xl font-bold text-gray-900 dark:text-white"
        >
          Zakazi Termin
        </CardTitle>
        <p data-testid="login-subtitle" className="mt-2 text-gray-600 dark:text-gray-400">
          Prijavite se na vaš nalog
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div
              data-testid="login-error-message"
              className="p-3 text-sm text-red-600 bg-red-50 rounded-md dark:text-red-400 dark:bg-red-900/20"
            >
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-900 dark:text-white">
              Email
            </Label>
            <Input
              id="email"
              data-testid="login-email-input"
              type="text"
              placeholder="vas@email.com"
              disabled={isSubmitting}
              {...register("email")}
            />
            {errors.email && (
              <p data-testid="login-email-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-900 dark:text-white">
              Lozinka
            </Label>
            <Input
              id="password"
              data-testid="login-password-input"
              type="password"
              placeholder="Vaša lozinka"
              disabled={isSubmitting}
              {...register("password")}
            />
            {errors.password && (
              <p
                data-testid="login-password-error"
                className="text-sm text-red-600 dark:text-red-400"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              data-testid="login-forgot-password-link"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Zaboravili ste lozinku?
            </Link>
          </div>

          <Button
            type="submit"
            data-testid="login-submit-button"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Prijavljivanje..." : "Prijavite se"}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="flex absolute inset-0 items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="flex relative justify-center text-sm">
            <span className="px-2 text-gray-500 bg-card dark:text-gray-400">ili</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          data-testid="login-google-button"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
        >
          <svg className="mr-2 w-5 h-5" viewBox="0 0 24 24" role="img" aria-label="Google logo">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Prijavite se sa Google
        </Button>

        <p className="mt-6 text-sm text-center text-gray-600 dark:text-gray-400">
          Nemate nalog?{" "}
          <Link
            href="/signup"
            data-testid="login-signup-link"
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Registrujte se
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
