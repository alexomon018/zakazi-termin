"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Label,
} from "@salonko/ui";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { resendVerificationAction, verifyEmailAction } from "../actions";

const verifySchema = z.object({
  code: z
    .string()
    .length(6, "Kod mora imati 6 cifara")
    .regex(/^\d+$/, "Kod mora sadržati samo cifre"),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to signup if no email
  useEffect(() => {
    if (!email) {
      router.push("/signup");
    }
  }, [email, router]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (data: VerifyFormData) => {
    if (!email) return;

    setServerError(null);
    setResendMessage(null);
    setIsLoading(true);

    try {
      // Create FormData for server action
      const formData = new FormData();
      formData.append("email", email);
      formData.append("code", data.code);

      const result = await verifyEmailAction(formData);

      if (!result.success) {
        setServerError(result.error);
        setIsLoading(false);
        return;
      }

      // Auto-login using the one-time token
      const signInResult = await signIn("credentials", {
        email: result.data.email,
        autoLoginToken: result.data.autoLoginToken,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (signInResult?.error) {
        // Fallback to login page if auto-login fails
        router.push("/login?verified=true");
        return;
      }

      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch {
      setIsLoading(false);
      setServerError("Došlo je do greške. Pokušajte ponovo.");
    }
  };

  const handleResend = async () => {
    if (!email) return;

    setIsResending(true);
    setResendMessage(null);
    setServerError(null);

    try {
      // Create FormData for server action
      const formData = new FormData();
      formData.append("email", email);

      const result = await resendVerificationAction(formData);

      if (result.success) {
        setResendMessage(result.data.message);
      } else {
        setServerError(result.error);
      }
    } catch {
      setServerError("Došlo je do greške pri slanju koda.");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle
          data-testid="verify-email-title"
          className="text-2xl font-bold text-gray-900 dark:text-white"
        >
          <Link href="/" className="transition-opacity hover:opacity-80">
            Salonko
          </Link>
        </CardTitle>
        <p data-testid="verify-email-subtitle" className="mt-2 text-gray-600 dark:text-gray-400">
          Verifikujte vaš email
        </p>
      </CardHeader>
      <CardContent>
        <p className="mb-6 text-sm text-center text-gray-600 dark:text-gray-400">
          Unesite 6-cifreni kod koji smo poslali na vašu email adresu
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {serverError && (
            <div
              data-testid="verify-email-error-message"
              className="p-3 text-sm text-red-600 bg-red-50 rounded-md dark:text-red-400 dark:bg-red-900/20"
            >
              {serverError}
            </div>
          )}
          {resendMessage && (
            <div
              data-testid="verify-email-success-message"
              className="p-3 text-sm text-green-600 bg-green-50 rounded-md dark:text-green-400 dark:bg-green-900/20"
            >
              {resendMessage}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="code" className="text-gray-900 sr-only dark:text-white">
              Verifikacioni kod
            </Label>
            <div className="flex justify-center">
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <InputOTP
                    maxLength={6}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isLoading}
                    data-testid="verify-email-code-input"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
            </div>
            {errors.code && (
              <p
                data-testid="verify-email-code-error"
                className="text-sm text-center text-red-600 dark:text-red-400"
              >
                {errors.code.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            data-testid="verify-email-submit-button"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Provera..." : "Verifikuj"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Niste primili kod?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || isLoading}
              data-testid="verify-email-resend-button"
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? "Slanje..." : "Pošalji ponovo"}
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
