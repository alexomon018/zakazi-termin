import { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";

export const bookingDetailsSchema = z.object({
  name: z.string().min(1, "Ime je obavezno").min(2, "Ime mora imati najmanje 2 karaktera"),
  email: z.string().min(1, "Email je obavezan").email("Unesite ispravnu email adresu"),
  phoneNumber: z
    .string()
    .optional()
    .refine((val) => !val || isValidPhoneNumber(val), {
      message: "Unesite ispravan broj telefona",
    }),
  notes: z.string().optional(),
});

export type BookingDetailsFormData = z.infer<typeof bookingDetailsSchema>;
