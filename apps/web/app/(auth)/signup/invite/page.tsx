"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@salonko/ui";
import { Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { inviteSignupAction, validateInviteTokenAction } from "../../actions/invite-signup";

const inviteSignupSchema = z
  .object({
    firstName: z.string().min(2, "Ime mora imati najmanje 2 karaktera"),
    lastName: z.string().min(2, "Prezime mora imati najmanje 2 karaktera"),
    email: z.string().email("Nevažeća email adresa"),
    password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Lozinke se ne poklapaju",
    path: ["confirmPassword"],
  });

type InviteSignupFormData = z.infer<typeof inviteSignupSchema>;

type TokenValidation = {
  valid: boolean;
  organizationName?: string;
  invitedEmail?: string;
  error?: string;
};

export default function InviteSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [tokenValidation, setTokenValidation] = useState<TokenValidation | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<InviteSignupFormData>({
    resolver: zodResolver(inviteSignupSchema),
  });

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setTokenValidation({ valid: false, error: "Nedostaje token pozivnice" });
        setIsValidating(false);
        return;
      }

      const result = await validateInviteTokenAction(token);
      setTokenValidation(result);

      // Pre-fill email if it's an email-specific invite
      if (result.valid && result.invitedEmail) {
        setValue("email", result.invitedEmail);
      }

      setIsValidating(false);
    }

    validateToken();
  }, [token, setValue]);

  const onSubmit = async (data: InviteSignupFormData) => {
    if (!token) return;

    setServerError(null);
    setIsLoading(true);

    try {
      const result = await inviteSignupAction({
        token,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        password: data.password,
      });

      if (!result.success) {
        setServerError(result.error);
        setIsLoading(false);
        return;
      }

      // Redirect to email verification
      router.push(`/verify-email?email=${encodeURIComponent(result.data.email)}&token=${token}`);
    } catch {
      setServerError("Došlo je do greške. Pokušajte ponovo.");
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!tokenValidation?.valid) {
    return (
      <div className="flex justify-center items-center px-4 min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Nevažeća pozivnica</CardTitle>
            <CardDescription>
              {tokenValidation?.error || "Link za pozivnicu nije validan ili je istekao."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/login">Nazad na prijavu</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center px-4 py-8 min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <CardTitle>Pridružite se timu</CardTitle>
          <CardDescription>
            Pozvani ste da se pridružite timu <strong>{tokenValidation.organizationName}</strong>.
            Kreirajte nalog da biste prihvatili pozivnicu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ime</Label>
                <Input id="firstName" placeholder="Vaše ime" {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Prezime</Label>
                <Input id="lastName" placeholder="Vaše prezime" {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vas@email.com"
                {...register("email")}
                disabled={!!tokenValidation.invitedEmail}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              {tokenValidation.invitedEmail && (
                <p className="text-xs text-muted-foreground">
                  Email je određen pozivnicom i ne može se promeniti.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Lozinka</Label>
              <Input
                id="password"
                type="password"
                placeholder="Najmanje 8 karaktera"
                {...register("password")}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potvrdite lozinku</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ponovite lozinku"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {serverError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{serverError}</div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Kreiranje naloga...
                </>
              ) : (
                "Kreiraj nalog i pridruži se"
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Već imate nalog?{" "}
              <Link
                href={`/login?callbackUrl=/teams/accept?token=${token}`}
                className="text-blue-600 hover:underline"
              >
                Prijavite se
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
