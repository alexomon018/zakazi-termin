"use client";

import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { useContext } from "react";

import { cn } from "@salonko/ui/utils";

const InputOTP = ({
  className,
  containerClassName,
  ...props
}: ComponentPropsWithoutRef<typeof OTPInput>) => (
  <OTPInput
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
);
InputOTP.displayName = "InputOTP";

const InputOTPGroup = ({ className, ...props }: ComponentPropsWithoutRef<"div">) => (
  <div className={cn("flex items-center", className)} {...props} />
);
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = ({
  index,
  className,
  ...props
}: ComponentPropsWithoutRef<"div"> & { index: number }) => {
  const inputOTPContext = useContext(OTPInputContext);
  const slot = inputOTPContext.slots[index];
  if (!slot) {
    return null;
  }
  const { char, hasFakeCaret, isActive } = slot;

  return (
    <div
      className={cn(
        "relative flex h-14 w-12 items-center justify-center border-y border-r border-input text-2xl font-medium shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
};
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = ({ ...props }: ComponentPropsWithoutRef<"div">) => (
  // biome-ignore lint/a11y/useFocusableInteractive: Separator is decorative only
  // biome-ignore lint/a11y/useSemanticElements: Using div with icon for visual consistency
  <div role="separator" aria-hidden="true" {...props}>
    <MinusIcon className="h-4 w-4 text-muted-foreground" />
  </div>
);
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
