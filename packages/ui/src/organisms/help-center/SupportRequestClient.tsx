"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@salonko/ui/atoms/Button";
import { Card, CardContent } from "@salonko/ui/atoms/Card";
import { FormErrorMessage } from "@salonko/ui/atoms/FormErrorMessage";
import { Input } from "@salonko/ui/atoms/Input";
import { Label } from "@salonko/ui/atoms/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@salonko/ui/atoms/Select";
import { Textarea } from "@salonko/ui/atoms/Textarea";
import { cn } from "@salonko/ui/utils";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Mail, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { supportCategories } from "./help-center-data";

const supportRequestSchema = z.object({
  email: z.string().min(1, "Email je obavezan").email("Nevažeća email adresa"),
  subject: z
    .string()
    .min(3, "Naslov mora imati najmanje 3 karaktera")
    .max(100, "Naslov može imati najviše 100 karaktera"),
  salonName: z.string().optional(),
  category: z.string().min(1, "Izaberi kategoriju"),
  description: z
    .string()
    .min(10, "Opis mora imati najmanje 10 karaktera")
    .max(2000, "Opis može imati najviše 2000 karaktera"),
});

export type SupportRequestFormData = z.infer<typeof supportRequestSchema>;

interface SupportRequestClientProps {
  onSubmit?: (data: SupportRequestFormData) => Promise<{ success: boolean; error?: string }>;
}

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {error && <FormErrorMessage message={error} />}
    </div>
  );
}

export function SupportRequestClient({ onSubmit: onSubmitProp }: SupportRequestClientProps = {}) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SupportRequestFormData>({
    resolver: zodResolver(supportRequestSchema),
    defaultValues: {
      email: "",
      subject: "",
      salonName: "",
      category: "",
      description: "",
    },
  });

  const onSubmit = async (data: SupportRequestFormData) => {
    setSubmitError(null);

    if (!onSubmitProp) {
      setIsSubmitted(true);
      return;
    }

    const result = await onSubmitProp(data);

    if (!result.success) {
      setSubmitError(result.error ?? "Došlo je do greške. Pokušaj ponovo.");
      return;
    }

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="px-4 pt-16 pb-16 lg:pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <div className="flex justify-center items-center mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full dark:bg-green-900/30">
            <CheckCircle2
              className="w-8 h-8 text-green-600 dark:text-green-400"
              aria-hidden="true"
            />
          </div>
          <h1 className="mb-3 text-2xl font-bold text-foreground">Zahtev je uspešno poslat!</h1>
          <p className="mb-8 text-muted-foreground">
            Primili smo tvoju poruku i javićemo ti se u roku od 24 sata na email adresu koju si
            uneo/la.
          </p>
          <Button asChild variant="outline">
            <Link href="/help">
              <ArrowLeft className="mr-2 w-4 h-4" aria-hidden="true" />
              Nazad na centar za pomoć
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-16 pb-16 lg:pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Back link */}
        <Link
          href="/help"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Nazad na centar za pomoć
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-3 text-3xl font-bold text-foreground">Pošalji zahtev za podršku</h1>
          <p className="leading-relaxed text-muted-foreground">
            Opiši nam sa čime ti možemo pomoći i javićemo ti se što pre. Većina zahteva bude
            obrađena u roku od 24 sata.
          </p>
        </div>

        {/* Response time info */}
        <div className="flex gap-3 items-center p-4 mb-8 rounded-lg border bg-primary/5 border-primary/10">
          <Clock className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <p className="text-sm text-foreground">
            <span className="font-medium">Prosečno vreme odgovora:</span>{" "}
            <span className="text-muted-foreground">do 24 sata radnim danima</span>
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-6 sm:p-8">
            {submitError && (
              <div className="flex gap-3 items-start p-4 mb-6 rounded-lg border bg-destructive/5 border-destructive/20">
                <AlertCircle
                  className="w-5 h-5 text-destructive shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-sm text-destructive">{submitError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <FormField label="Tvoj email" error={errors.email?.message} required>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="email"
                    placeholder="ime@primer.com"
                    className={cn("pl-10", errors.email && "border-destructive")}
                    {...register("email")}
                  />
                </div>
              </FormField>

              {/* Subject */}
              <FormField label="Naslov" error={errors.subject?.message} required>
                <Input
                  placeholder="Kratak opis problema ili pitanja"
                  className={cn(errors.subject && "border-destructive")}
                  {...register("subject")}
                />
              </FormField>

              {/* Salon Name */}
              <FormField label="Naziv salona" error={errors.salonName?.message}>
                <Input placeholder="Naziv tvog salona (opciono)" {...register("salonName")} />
              </FormField>

              {/* Category */}
              <FormField label="Kategorija" error={errors.category?.message} required>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={cn(errors.category && "border-destructive")}>
                        <SelectValue placeholder="Izaberi kategoriju" />
                      </SelectTrigger>
                      <SelectContent>
                        {supportCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              {/* Description */}
              <FormField label="Opis" error={errors.description?.message} required>
                <Textarea
                  placeholder="Opiši detaljno šta se dešava, koje korake si preduzeo/la, i šta očekuješ da se desi..."
                  rows={6}
                  className={cn("resize-none", errors.description && "border-destructive")}
                  {...register("description")}
                />
                <p className="text-xs text-muted-foreground">
                  Što detaljniji opis nam pomogne da brže rešimo problem.
                </p>
              </FormField>

              {/* Submit */}
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Šalje se..."
                ) : (
                  <>
                    Pošalji zahtev
                    <Send className="ml-2 w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
