"use server";

import { logger } from "@salonko/config";
import { emailService } from "@salonko/emails";
import { supportCategories } from "@salonko/ui";
import { z } from "zod";

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

export type SupportRequestData = z.infer<typeof supportRequestSchema>;

export async function submitSupportRequest(
  data: SupportRequestData
): Promise<{ success: boolean; error?: string }> {
  const parsed = supportRequestSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { email, subject, salonName, category, description } = parsed.data;

  const categoryLabel = supportCategories.find((c) => c.value === category)?.label ?? category;

  try {
    const result = await emailService.sendSupportRequestEmail({
      email,
      subject,
      salonName: salonName || undefined,
      category,
      categoryLabel,
      description,
    });

    if (!result.success) {
      logger.error("Failed to send support request email", {
        error: result.error,
        email,
        subject,
      });
      return {
        success: false,
        error:
          "Slanje zahteva nije uspelo. Pokušaj ponovo ili nas kontaktiraj direktno na salonko.rs@gmail.com.",
      };
    }

    return { success: true };
  } catch (error) {
    logger.error("Support request submission error", { error, email, subject });
    return {
      success: false,
      error:
        "Došlo je do greške. Pokušaj ponovo ili nas kontaktiraj direktno na salonko.rs@gmail.com.",
    };
  }
}
