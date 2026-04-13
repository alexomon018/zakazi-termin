"use client";

import { type SignupFormData, signupSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignupForm, SignupHeader } from "@salonko/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { signupAction } from "../actions";

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      salonTypes: [],
      salonEmail: "",
      googlePlaceId: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("salonName", data.salonName);
      formData.append("salonTypes", JSON.stringify(data.salonTypes));
      formData.append("salonPhone", data.salonPhone);
      formData.append("salonEmail", data.salonEmail || "");
      formData.append("salonCity", data.salonCity);
      formData.append("salonAddress", data.salonAddress);
      formData.append("googlePlaceId", data.googlePlaceId || "");
      formData.append("ownerFirstName", data.ownerFirstName);
      formData.append("ownerLastName", data.ownerLastName);
      formData.append("email", data.email.toLowerCase());
      formData.append("ownerPhone", data.ownerPhone);
      formData.append("password", data.password);

      const result = await signupAction(formData);

      if (!result.success) {
        setServerError(result.error);
        setIsLoading(false);
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(result.data.email)}`);
    } catch {
      setServerError("Doslo je do greske. Pokusajte ponovo.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <SignupHeader />
      <SignupForm
        control={control}
        register={register}
        handleSubmit={handleSubmit}
        watch={watch}
        setValue={setValue}
        errors={errors}
        isLoading={isLoading}
        serverError={serverError}
        googlePlacesApiKey={GOOGLE_PLACES_API_KEY}
        onSubmit={onSubmit}
      />
    </>
  );
}
