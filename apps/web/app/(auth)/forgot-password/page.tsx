"use client";

import { Button, Card, CardContent, Input, Label, LoadingButton } from "@salonko/ui";
import { AlertCircle, Calendar, CheckCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { forgotPasswordAction } from "../actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("email", email.toLowerCase());

      const result = await forgotPasswordAction(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError("Doslo je do greske. Pokusajte ponovo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="mx-auto w-full max-w-md animate-fade-in-up">
        <Card className="border-0 backdrop-blur-sm shadow-elevated-lg bg-card/80">
          <CardContent className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="inline-flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full dark:bg-green-900/30">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                Proverite email
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ako nalog sa email adresom{" "}
                <strong className="text-gray-900 dark:text-white">{email}</strong> postoji,
                poslacemo vam link za resetovanje lozinke.
              </p>
            </div>

            <div className="p-4 mb-6 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50">
              <div className="flex gap-3 items-start">
                <Mail className="flex-shrink-0 mt-0.5 w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Proverite inbox</p>
                  <p className="mt-1 text-blue-600 dark:text-blue-400">
                    Link za resetovanje lozinke istice za 1 sat.
                  </p>
                </div>
              </div>
            </div>

            <Link href="/login" className="block">
              <Button
                variant="outline"
                className="w-full h-12 text-base font-medium transition-all duration-200 border-border/50 hover:bg-accent hover:border-border"
              >
                Nazad na prijavu
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
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
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                Salonko
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Unesite vasu email adresu i poslacemo vam link za resetovanje lozinke
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800/50 animate-fade-in">
                <div className="flex gap-2 items-center">
                  <AlertCircle className="flex-shrink-0 w-4 h-4" aria-hidden="true" />
                  {error}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.com"
                required
                disabled={isLoading}
                className="px-4 h-12 transition-colors bg-background/50 border-border/50 focus:border-primary focus:bg-background"
              />
            </div>

            <LoadingButton
              type="submit"
              className="w-full h-12 text-base font-medium transition-all duration-300 shadow-glow hover:shadow-lg"
              isLoading={isLoading}
              loadingText="Slanje..."
            >
              Posaljite link za resetovanje
            </LoadingButton>
          </form>

          <p className="mt-8 text-sm text-center text-muted-foreground">
            Setili ste se lozinke?{" "}
            <Link
              href="/login"
              className="font-semibold transition-colors text-primary hover:text-primary/80"
            >
              Prijavite se
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
