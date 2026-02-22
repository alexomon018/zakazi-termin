"use server";

import { logger } from "@salonko/config";
import { SUPPORT_EMAIL, emailService } from "@salonko/emails";
import { supportCategories, supportRequestSchema } from "@salonko/ui";

export async function submitSupportRequest(data: {
  email: string;
  subject: string;
  salonName?: string;
  category: string;
  description: string;
}): Promise<{ success: boolean; error?: string }> {
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
        subject,
      });
      return {
        success: false,
        error: `Slanje zahteva nije uspelo. Pokušaj ponovo ili nas kontaktiraj direktno na ${SUPPORT_EMAIL}.`,
      };
    }

    return { success: true };
  } catch (error) {
    logger.error("Support request submission error", { error, subject });
    return {
      success: false,
      error: `Došlo je do greške. Pokušaj ponovo ili nas kontaktiraj direktno na ${SUPPORT_EMAIL}.`,
    };
  }
}
