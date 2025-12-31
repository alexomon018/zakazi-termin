import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email je obavezan").email("Nevažeća email adresa"),
  password: z.string().min(1, "Lozinka je obavezna"),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, "Ime mora imati najmanje 2 karaktera"),
    email: z.string().min(1, "Email je obavezan").email("Nevažeća email adresa"),
    salonName: z
      .string()
      .min(3, "Naziv salona mora imati najmanje 3 karaktera")
      .max(30, "Naziv salona može imati najviše 30 karaktera")
      .regex(/^[a-zA-Z0-9\s_-]+$/, "Naziv salona može sadržati samo slova, brojeve, razmake, _ i -")
      .transform((val) => val.toLowerCase().replace(/\s+/g, "-")),
    password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera"),
    confirmPassword: z.string().min(1, "Potvrdite lozinku"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Lozinke se ne poklapaju",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
