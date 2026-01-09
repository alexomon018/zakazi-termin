"use client";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@salonko/ui";
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
      setError("Došlo je do greške. Pokušajte ponovo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Proverite email
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Ako nalog sa email adresom{" "}
            <strong className="text-gray-900 dark:text-white">{email}</strong> postoji, poslaćemo
            vam link za resetovanje lozinke.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Nazad na prijavu
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
          Zaboravljena lozinka
        </CardTitle>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Unesite vašu email adresu i poslaćemo vam link za resetovanje lozinke
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md dark:text-red-400 dark:bg-red-900/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-900 dark:text-white">
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
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Slanje..." : "Pošaljite link za resetovanje"}
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
