"use client";

import { trpc } from "@/lib/trpc/client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@salonko/ui";
import { ArrowLeft, Calendar, Clock, Eye, EyeOff, MapPin, Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type LocationType = "inPerson" | "phone" | "link";

interface Location {
  type: LocationType;
  address?: string;
  phone?: string;
  link?: string;
}

type Schedule = {
  id: number;
  name: string;
};

type EventType = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  length: number;
  hidden: boolean;
  requiresConfirmation: boolean;
  minimumBookingNotice: number;
  beforeEventBuffer: number;
  afterEventBuffer: number;
  slotInterval: number | null;
  scheduleId: number | null;
  locations: unknown;
};

type EditEventTypeClientProps = {
  eventType: EventType;
  schedules: Schedule[];
};

export function EditEventTypeClient({ eventType, schedules }: EditEventTypeClientProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const locations = eventType.locations as Location[] | null;
  const firstLocation = locations?.[0];

  const [formData, setFormData] = useState({
    title: eventType.title,
    slug: eventType.slug,
    description: eventType.description || "",
    length: eventType.length,
    hidden: eventType.hidden,
    locationType: (firstLocation?.type as LocationType) || "inPerson",
    locationAddress: firstLocation?.address || "",
    minimumBookingNotice: eventType.minimumBookingNotice,
    beforeEventBuffer: eventType.beforeEventBuffer,
    afterEventBuffer: eventType.afterEventBuffer,
    slotInterval: eventType.slotInterval,
    requiresConfirmation: eventType.requiresConfirmation,
    scheduleId: eventType.scheduleId,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateEventType = trpc.eventType.update.useMutation({
    onSuccess: () => {
      utils.eventType.list.invalidate();
      utils.eventType.byId.invalidate({ id: eventType.id });
      router.push("/dashboard/event-types");
    },
    onError: (error: { message: string }) => {
      if (error.message.includes("Unique constraint")) {
        setErrors({ slug: "Ovaj slug već postoji. Izaberite drugi." });
      } else {
        setErrors({ form: error.message });
      }
    },
  });

  const deleteEventType = trpc.eventType.delete.useMutation({
    onSuccess: () => {
      utils.eventType.list.invalidate();
      router.push("/dashboard/event-types");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Naziv je obavezan";
    if (!formData.slug.trim()) newErrors.slug = "Slug je obavezan";
    if (formData.length < 5) newErrors.length = "Trajanje mora biti najmanje 5 minuta";
    if (formData.locationType === "inPerson" && !formData.locationAddress.trim()) {
      newErrors.locationAddress = "Adresa je obavezna za termine uživo";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build locations array
    const newLocations: Location[] = [];
    if (formData.locationType === "inPerson" && formData.locationAddress) {
      newLocations.push({ type: "inPerson", address: formData.locationAddress });
    }

    updateEventType.mutate({
      id: eventType.id,
      title: formData.title,
      slug: formData.slug,
      description: formData.description || undefined,
      length: formData.length,
      hidden: formData.hidden,
      locations: newLocations.length > 0 ? newLocations : undefined,
      minimumBookingNotice: formData.minimumBookingNotice,
      beforeEventBuffer: formData.beforeEventBuffer,
      afterEventBuffer: formData.afterEventBuffer,
      slotInterval: formData.slotInterval || undefined,
      requiresConfirmation: formData.requiresConfirmation,
      scheduleId: formData.scheduleId || undefined,
    });
  };

  const handleDelete = () => {
    if (
      confirm("Da li ste sigurni da želite da obrišete ovaj tip termina? Ova akcija je nepovratna.")
    ) {
      deleteEventType.mutate({ id: eventType.id });
    }
  };

  const durationOptions = [15, 30, 45, 60, 90, 120];
  const noticeOptions = [
    { value: 0, label: "Bez ograničenja" },
    { value: 60, label: "1 sat" },
    { value: 120, label: "2 sata" },
    { value: 240, label: "4 sata" },
    { value: 480, label: "8 sati" },
    { value: 1440, label: "1 dan" },
    { value: 2880, label: "2 dana" },
    { value: 10080, label: "1 nedelja" },
  ];
  const bufferOptions = [
    { value: 0, label: "Bez pauze" },
    { value: 5, label: "5 min" },
    { value: 10, label: "10 min" },
    { value: 15, label: "15 min" },
    { value: 30, label: "30 min" },
    { value: 60, label: "1 sat" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/event-types">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Nazad
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Izmeni tip termina</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Ažurirajte podešavanja za "{eventType.title}"
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Obriši
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.form && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
            {errors.form}
          </div>
        )}

        {/* Visibility toggle */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {formData.hidden ? (
                  <EyeOff className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                ) : (
                  <Eye className="w-5 h-5 text-green-500" />
                )}
                <div>
                  <Label className="text-base text-gray-900 dark:text-white">Vidljivost</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formData.hidden
                      ? "Ovaj tip termina je skriven i klijenti ga ne mogu videti"
                      : "Ovaj tip termina je aktivan i vidljiv klijentima"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, hidden: !prev.hidden }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  !formData.hidden ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    !formData.hidden ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Osnovne informacije
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-900 dark:text-white">
                  Naziv
                </Label>
                <Input
                  id="title"
                  placeholder="npr. Konsultacija"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-gray-900 dark:text-white">
                  URL slug
                </Label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">/</span>
                  <Input
                    id="slug"
                    placeholder="konsultacija"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    className={errors.slug ? "border-red-500" : ""}
                  />
                </div>
                {errors.slug && <p className="text-sm text-red-500">{errors.slug}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-900 dark:text-white">
                Opis (opciono)
              </Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Opišite šta klijent može očekivati od ovog termina..."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">Trajanje</Label>
              <div className="flex flex-wrap gap-2">
                {durationOptions.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, length: duration }))}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      formData.length === duration
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {duration < 60 ? `${duration} min` : `${duration / 60}h`}
                  </button>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="5"
                    max="480"
                    value={formData.length}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        length: Number.parseInt(e.target.value) || 30,
                      }))
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">min</span>
                </div>
              </div>
              {errors.length && <p className="text-sm text-red-500">{errors.length}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Lokacija
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locationAddress" className="text-gray-900 dark:text-white">
                Adresa
              </Label>
              <Input
                id="locationAddress"
                placeholder="npr. Knez Mihailova 10, Beograd"
                value={formData.locationAddress}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, locationAddress: e.target.value }))
                }
                className={errors.locationAddress ? "border-red-500" : ""}
              />
              {errors.locationAddress && (
                <p className="text-sm text-red-500">{errors.locationAddress}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ova adresa će biti prikazana klijentima prilikom zakazivanja
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Raspored
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">Koristi raspored</Label>
              <select
                value={formData.scheduleId || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    scheduleId: e.target.value ? Number.parseInt(e.target.value) : null,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Podrazumevani raspored</option>
                {schedules?.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Izaberite koji raspored radnog vremena da koristite za ovaj tip termina
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Napredna podešavanja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">
                Minimalno vreme unapred za zakazivanje
              </Label>
              <select
                value={formData.minimumBookingNotice}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minimumBookingNotice: Number.parseInt(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {noticeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Koliko ranije klijent mora zakazati termin
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-white">Pauza pre termina</Label>
                <select
                  value={formData.beforeEventBuffer}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      beforeEventBuffer: Number.parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {bufferOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-white">Pauza posle termina</Label>
                <select
                  value={formData.afterEventBuffer}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      afterEventBuffer: Number.parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {bufferOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-900 dark:text-white">Zahtevaj ručnu potvrdu</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Termini neće biti automatski potvrđeni dok ih ne odobrite
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    requiresConfirmation: !prev.requiresConfirmation,
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.requiresConfirmation ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.requiresConfirmation ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/dashboard/event-types">
            <Button variant="outline" type="button">
              Otkaži
            </Button>
          </Link>
          <Button type="submit" disabled={updateEventType.isPending}>
            {updateEventType.isPending ? "Čuvanje..." : "Sačuvaj izmene"}
          </Button>
        </div>
      </form>
    </div>
  );
}
