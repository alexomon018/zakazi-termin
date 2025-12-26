"use client";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@salonko/ui";
import Link from "next/link";
import { useState } from "react";

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
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Greška pri slanju emaila");
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
          <p className="text-gray-600 dark:text-gray-400 mb-6">
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
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Unesite vašu email adresu i poslaćemo vam link za resetovanje lozinke
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
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

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Setili ste se lozinke?{" "}
          <Link
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Prijavite se
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
