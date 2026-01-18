"use client";

import { Button, Card, CardContent, Input, Label } from "@salonko/ui";
import { AlertTriangle, Calendar, CheckCircle, KeyRound } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { resetPasswordAction } from "../actions";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const hasRequiredParams = useMemo(() => Boolean(token && email), [token, email]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasRequiredParams) {
      setError("Link za resetovanje lozinke je nevažeći ili je istekao.");
      return;
    }

    if (password.length < 8) {
      setError("Lozinka mora imati najmanje 8 karaktera.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Lozinke se ne poklapaju.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", email.toLowerCase());
      formData.append("token", token);
      formData.append("password", password);

      const result = await resetPasswordAction(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      setError("Doslo je do greske. Pokusajte ponovo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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
                Lozinka je resetovana
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sada se mozete prijaviti sa novom lozinkom.
              </p>
            </div>

            <Link href="/login" className="block">
              <Button className="w-full h-12 text-base font-medium transition-all duration-300 shadow-glow hover:shadow-lg">
                Prijavite se
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
            <p className="text-sm text-gray-500 dark:text-gray-400">Unesite novu lozinku</p>
          </div>

          {!hasRequiredParams && (
            <div className="p-4 mb-6 text-sm bg-amber-50 rounded-lg border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50 animate-fade-in">
              <div className="flex gap-3 items-start text-amber-700 dark:text-amber-400">
                <AlertTriangle className="flex-shrink-0 mt-0.5 w-5 h-5" />
                <div>
                  <p className="font-medium">Link je nevazeci</p>
                  <p className="mt-1 text-amber-600 dark:text-amber-500">
                    Link za resetovanje lozinke je nevazeci ili je istekao.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 mb-6 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800/50 animate-fade-in">
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
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Nova lozinka
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 w-5 h-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Najmanje 8 karaktera"
                  required
                  disabled={isLoading || !hasRequiredParams}
                  className="pl-10 h-12 transition-colors bg-background/50 border-border/50 focus:border-primary focus:bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Potvrdite lozinku
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 w-5 h-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ponovite lozinku"
                  required
                  disabled={isLoading || !hasRequiredParams}
                  className="pl-10 h-12 transition-colors bg-background/50 border-border/50 focus:border-primary focus:bg-background"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium transition-all duration-300 shadow-glow hover:shadow-lg"
              disabled={isLoading || !hasRequiredParams}
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
                  Cuvanje...
                </span>
              ) : (
                "Sacuvaj novu lozinku"
              )}
            </Button>
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
