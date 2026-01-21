"use client";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@salonko/ui";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { trpc } from "@/lib/trpc/client";

type AcceptState = "loading" | "accepting" | "success" | "error" | "invalid";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<AcceptState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("");

  const acceptMutation = trpc.team.acceptInvitation.useMutation({
    onSuccess: (data) => {
      setOrganizationName(data.organizationName);
      setState("success");
    },
    onError: (error) => {
      setErrorMessage(error.message);
      setState("error");
    },
  });

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    // Automatically attempt to accept the invitation
    setState("accepting");
    acceptMutation.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, acceptMutation.mutate]);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  const handleGoToLogin = () => {
    router.push("/login");
  };

  if (state === "loading" || state === "accepting") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader2 className="mx-auto w-12 h-12 text-blue-600 animate-spin" />
            <CardTitle className="mt-4">Prihvatanje pozivnice...</CardTitle>
            <CardDescription>Molimo sačekajte dok obrađujemo vašu pozivnicu.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="mx-auto w-12 h-12 text-red-500" />
            <CardTitle className="mt-4">Nevažeća pozivnica</CardTitle>
            <CardDescription>
              Link za pozivnicu nije validan. Molimo proverite da li ste ispravno kopirali link.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleGoToLogin}>Nazad na prijavu</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="mx-auto w-12 h-12 text-red-500" />
            <CardTitle className="mt-4">Greška</CardTitle>
            <CardDescription>
              {errorMessage || "Došlo je do greške prilikom prihvatanja pozivnice."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleGoToLogin}>
              Nazad na prijavu
            </Button>
            <Button onClick={handleGoToDashboard}>Idi na dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="mx-auto w-12 h-12 text-green-500" />
          <CardTitle className="mt-4">Uspešno ste se pridružili!</CardTitle>
          <CardDescription>
            Sada ste član tima <strong>{organizationName}</strong>. Možete pristupiti dashboard-u i
            početi sa radom.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={handleGoToDashboard}>Idi na dashboard</Button>
        </CardContent>
      </Card>
    </div>
  );
}
