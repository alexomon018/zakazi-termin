"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Label,
  LoadingButton,
} from "@salonko/ui";
import { AlertCircle, Calendar, CheckCircle, Loader2, Mail, XCircle } from "lucide-react";
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
    .regex(/^\d+$/, "Kod mora sadrzati samo cifre"),
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
      setServerError("Doslo je do greske. Pokusajte ponovo.");
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
      setServerError("Doslo je do greske pri slanju koda.");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

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
                data-testid="verify-email-title"
                className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300"
              >
                Salonko
              </span>
            </Link>
            <p
              data-testid="verify-email-subtitle"
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              Verifikujte vas email
            </p>
          </div>

          {/* Email info box */}
          <div className="p-4 mb-6 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50">
            <div className="flex gap-3 items-start">
              <Mail className="flex-shrink-0 mt-0.5 w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p>
                  Unesite 6-cifreni kod koji smo poslali na{" "}
                  <strong className="font-semibold">{email}</strong>
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div
                data-testid="verify-email-error-message"
                className="p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800/50 animate-fade-in"
              >
                <div className="flex gap-2 items-center">
                  <XCircle className="flex-shrink-0 w-4 h-4" aria-hidden="true" />
                  {serverError}
                </div>
              </div>
            )}

            {resendMessage && (
              <div
                data-testid="verify-email-success-message"
                className="p-4 text-sm text-green-700 bg-green-50 rounded-lg border border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800/50 animate-fade-in"
              >
                <div className="flex gap-2 items-center">
                  <CheckCircle className="flex-shrink-0 w-4 h-4" aria-hidden="true" />
                  {resendMessage}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium sr-only">
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
                  className="flex gap-1 justify-center items-center mt-2 text-xs text-destructive"
                >
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />
                  {errors.code.message}
                </p>
              )}
            </div>

            <LoadingButton
              type="submit"
              data-testid="verify-email-submit-button"
              className="w-full h-12 text-base font-medium transition-all duration-300 shadow-glow hover:shadow-lg"
              disabled={isLoading}
              isLoading={isLoading}
              loadingText="Verifikovanje..."
            >
              Verifikovanje...
            </LoadingButton>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Niste primili kod?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || isLoading}
                data-testid="verify-email-resend-button"
                className="font-semibold transition-colors text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <span className="flex gap-2 items-center">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Slanje...
                  </span>
                ) : (
                  "Posalji ponovo"
                )}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
