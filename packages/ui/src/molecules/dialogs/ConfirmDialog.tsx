"use client";

import { Button } from "@salonko/ui/atoms/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@salonko/ui/atoms/Dialog";
import { Input } from "@salonko/ui/atoms/Input";
import { Label } from "@salonko/ui/atoms/Label";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

interface InputConfig {
  /** Label text for the input field */
  label: string;
  /** Placeholder text for the input field */
  placeholder: string;
  /** Whether the input is required */
  required?: boolean;
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with input value when input is configured, otherwise called without arguments */
  onConfirm: (inputValue?: string) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  /** Text shown on confirm button while loading */
  loadingText?: string;
  isLoading?: boolean;
  variant?: "default" | "destructive";
  /** Optional input field configuration */
  inputConfig?: InputConfig;
  /** Shown under the description (e.g. mutation error message) */
  errorMessage?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Potvrdi",
  cancelText = "Otkaži",
  loadingText = "Učitavanje...",
  isLoading = false,
  variant = "destructive",
  inputConfig,
  errorMessage,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState("");

  const handleConfirm = () => {
    if (inputConfig) {
      onConfirm(inputValue || undefined);
    } else {
      onConfirm();
    }
    setInputValue("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setInputValue("");
  };

  const isConfirmDisabled = isLoading || (inputConfig?.required && !inputValue.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {errorMessage ? (
          <div
            role="alert"
            className="flex gap-2 items-center p-3 rounded-md bg-destructive/10 border border-destructive/20"
          >
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" aria-hidden="true" />
            <span className="text-sm text-destructive">{errorMessage}</span>
          </div>
        ) : null}
        {inputConfig && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-dialog-input">{inputConfig.label}</Label>
              <Input
                id="confirm-dialog-input"
                placeholder={inputConfig.placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={
              variant === "destructive" ? "bg-red-600 hover:bg-red-700 text-white" : undefined
            }
          >
            {isLoading ? loadingText : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
