"use client";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@salonko/ui";
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
      setError("Došlo je do greške. Pokušajte ponovo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Lozinka je resetovana
          </CardTitle>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sada se možete prijaviti sa novom lozinkom.
          </p>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button className="w-full">Prijavite se</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
          Resetovanje lozinke
        </CardTitle>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Unesite novu lozinku</p>
      </CardHeader>
      <CardContent>
        {!hasRequiredParams && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-md dark:text-red-400 dark:bg-red-900/20">
            Link za resetovanje lozinke je nevažeći ili je istekao.
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-md dark:text-red-400 dark:bg-red-900/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-900 dark:text-white">
              Nova lozinka
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Najmanje 8 karaktera"
              required
              disabled={isLoading || !hasRequiredParams}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-900 dark:text-white">
              Potvrdite lozinku
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ponovite lozinku"
              required
              disabled={isLoading || !hasRequiredParams}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !hasRequiredParams}>
            {isLoading ? "Čuvanje..." : "Sačuvaj novu lozinku"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600 dark:text-gray-400">
          Setili ste se lozinke?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Prijavite se
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
