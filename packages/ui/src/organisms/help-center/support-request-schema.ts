import { z } from "zod";

export const supportRequestSchema = z.object({
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
