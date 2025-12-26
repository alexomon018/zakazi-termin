"use client";

import { type SignupFormData, signupSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@salonko/ui";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const username = watch("username", "");

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email.toLowerCase(),
          username: data.username.toLowerCase(),
          password: data.password,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setServerError(responseData.message || "Greška pri registraciji");
        return;
      }

      // Auto sign in after successful registration
      const result = await signIn("credentials", {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setServerError("Došlo je do greške. Pokušajte ponovo.");
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle
          data-testid="signup-title"
          className="text-2xl font-bold text-gray-900 dark:text-white"
        >
          Salonko
        </CardTitle>
        <p data-testid="signup-subtitle" className="text-gray-600 dark:text-gray-400 mt-2">
          Kreirajte vaš nalog
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div
              data-testid="signup-error-message"
              className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md"
            >
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-900 dark:text-white">
              Ime i prezime
            </Label>
            <Input
              id="name"
              data-testid="signup-name-input"
              type="text"
              placeholder="Marko Marković"
              disabled={isSubmitting}
              {...register("name")}
            />
            {errors.name && (
              <p data-testid="signup-name-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-900 dark:text-white">
              Email
            </Label>
            <Input
              id="email"
              data-testid="signup-email-input"
              type="text"
              placeholder="vas@email.com"
              disabled={isSubmitting}
              {...register("email")}
            />
            {errors.email && (
              <p
                data-testid="signup-email-error"
                className="text-sm text-red-600 dark:text-red-400"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-900 dark:text-white">
              Korisničko ime
            </Label>
            <Input
              id="username"
              data-testid="signup-username-input"
              type="text"
              placeholder="marko"
              disabled={isSubmitting}
              {...register("username")}
            />
            {errors.username ? (
              <p
                data-testid="signup-username-error"
                className="text-sm text-red-600 dark:text-red-400"
              >
                {errors.username.message}
              </p>
            ) : (
              <p
                data-testid="signup-username-preview"
                className="text-xs text-gray-500 dark:text-gray-400"
              >
                Vaš profil: salonko.rs/{username || "korisnickoime"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-900 dark:text-white">
              Lozinka
            </Label>
            <Input
              id="password"
              data-testid="signup-password-input"
              type="password"
              placeholder="Najmanje 8 karaktera"
              disabled={isSubmitting}
              {...register("password")}
            />
            {errors.password && (
              <p
                data-testid="signup-password-error"
                className="text-sm text-red-600 dark:text-red-400"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-900 dark:text-white">
              Potvrdite lozinku
            </Label>
            <Input
              id="confirmPassword"
              data-testid="signup-confirm-password-input"
              type="password"
              placeholder="Ponovite lozinku"
              disabled={isSubmitting}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p
                data-testid="signup-confirmPassword-error"
                className="text-sm text-red-600 dark:text-red-400"
              >
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            data-testid="signup-submit-button"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Kreiranje naloga..." : "Registrujte se"}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-gray-500 dark:text-gray-400">ili</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          data-testid="signup-google-button"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" role="img" aria-label="Google logo">
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
          Nastavite sa Google
        </Button>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Već imate nalog?{" "}
          <Link
            href="/login"
            data-testid="signup-login-link"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Prijavite se
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
