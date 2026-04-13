import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email je obavezan").email("Nevazeca email adresa"),
  password: z.string().min(1, "Lozinka je obavezna"),
});

export const signupSchema = z
  .object({
    // Salon basic info
    salonName: z
      .string()
      .min(3, "Naziv salona mora imati najmanje 3 karaktera")
      .max(50, "Naziv salona moze imati najvise 50 karaktera"),
    salonTypes: z.array(z.string()).min(1, "Izaberite bar jedan tip salona"),
    salonPhone: z.string().min(1, "Telefon salona je obavezan"),
    salonEmail: z.string().email("Nevazeca email adresa").optional().or(z.literal("")),
    salonCity: z.string().min(1, "Grad je obavezan"),
    salonAddress: z.string().min(1, "Adresa je obavezna"),
    googlePlaceId: z.string().optional(),

    // Owner info
    ownerFirstName: z.string().min(2, "Ime mora imati najmanje 2 karaktera"),
    ownerLastName: z.string().min(2, "Prezime mora imati najmanje 2 karaktera"),
    email: z.string().min(1, "Email je obavezan").email("Nevazeca email adresa"),
    ownerPhone: z.string().min(1, "Telefon je obavezan"),
    password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera"),
    confirmPassword: z.string().min(1, "Potvrdite lozinku"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Lozinke se ne poklapaju",
    path: ["confirmPassword"],
  });

// Onboarding schema for Google OAuth users (no password fields)
export const onboardingSchema = z.object({
  // Salon basic info
  salonName: z
    .string()
    .min(3, "Naziv salona mora imati najmanje 3 karaktera")
    .max(50, "Naziv salona moze imati najvise 50 karaktera"),
  salonTypes: z.array(z.string()).min(1, "Izaberite bar jedan tip salona"),
  salonPhone: z.string().min(1, "Telefon salona je obavezan"),
  salonEmail: z.string().email("Nevazeca email adresa").optional().or(z.literal("")),
  salonCity: z.string().min(1, "Grad je obavezan"),
  salonAddress: z.string().min(1, "Adresa je obavezna"),
  googlePlaceId: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type OnboardingFormData = z.infer<typeof onboardingSchema>;
