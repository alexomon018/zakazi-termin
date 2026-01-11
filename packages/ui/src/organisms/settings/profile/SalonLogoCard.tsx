"use client";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@salonko/ui";
import { Loader2, Trash2, Upload, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { User } from "./types";

type SalonLogoCardProps = {
  user: User;
  onUploadSuccess: () => void;
};

export function SalonLogoCard({ user, onUploadSuccess }: SalonLogoCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveAvatarUrl = user?.salonIconUrl || user?.avatarUrl;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Dozvoljeni formati: JPEG, PNG, WebP");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Maksimalna veličina je 5MB");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/salon-icon", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Upload failed";
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch {
          const textError = await response.text();
          if (textError) errorMessage = textError;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || "Upload failed");
      }

      onUploadSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Greška pri uploadu";
      setUploadError(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveIcon = async () => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await fetch("/api/upload/salon-icon", {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMessage = "Delete failed";
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch {
          const textError = await response.text();
          if (textError) errorMessage = textError;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || "Delete failed");
      }

      onUploadSuccess();
      setConfirmDeleteOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Greška pri brisanju";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Logo salona</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex overflow-hidden flex-shrink-0 justify-center items-center w-20 h-20 bg-gray-200 rounded-full dark:bg-gray-700">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            ) : effectiveAvatarUrl ? (
              <Image
                src={effectiveAvatarUrl}
                alt={user?.salonName || user?.name || "Logo"}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <UserIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Logo vašeg salona će se prikazivati na stranici za zakazivanje.
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Preporučena veličina: 256x256 piksela. Max: 5MB. Formati: JPEG, PNG, WebP
            </p>
            {uploadError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{uploadError}</p>
            )}
            <div className="flex gap-2 mt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="mr-2 w-4 h-4" />
                {user?.salonIconKey ? "Promeni logo" : "Dodaj logo"}
              </Button>
              {user?.salonIconKey && (
                <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDeleteOpen(true)}
                    disabled={isUploading}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="mr-2 w-4 h-4" />
                    Ukloni
                  </Button>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Obriši logo?</DialogTitle>
                      <DialogDescription>
                        Ova akcija uklanja logo salona. Možete ga ponovo dodati kasnije.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setConfirmDeleteOpen(false)}
                        disabled={isUploading}
                      >
                        Otkaži
                      </Button>
                      <Button
                        type="button"
                        onClick={handleRemoveIcon}
                        disabled={isUploading}
                        className="text-white bg-red-600 hover:bg-red-700"
                      >
                        {isUploading ? "Brisanje..." : "Obriši"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
