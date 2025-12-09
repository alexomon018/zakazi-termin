"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@zakazi-termin/ui";
import { ArrowLeft, Clock, MapPin, Settings, Calendar, Trash2, Eye, EyeOff } from "lucide-react";

type LocationType = "inPerson" | "phone" | "link";

interface Location {
  type: LocationType;
  address?: string;
  phone?: string;
  link?: string;
}

export default function EditEventTypePage() {
  const router = useRouter();
  const params = useParams();
  const eventTypeId = parseInt(params.id as string);
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    length: 30,
    hidden: false,
    locationType: "inPerson" as LocationType,
    locationAddress: "",
    minimumBookingNotice: 120,
    beforeEventBuffer: 0,
    afterEventBuffer: 0,
    slotInterval: null as number | null,
    requiresConfirmation: false,
    scheduleId: null as number | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const { data: eventType, isLoading } = trpc.eventType.byId.useQuery({ id: eventTypeId });
  const { data: schedules } = trpc.availability.listSchedules.useQuery();

  // Load event type data into form
  useEffect(() => {
    if (eventType && !isLoaded) {
      const locations = eventType.locations as Location[] | null;
      const firstLocation = locations?.[0];

      setFormData({
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
      setIsLoaded(true);
    }
  }, [eventType, isLoaded]);

  const updateEventType = trpc.eventType.update.useMutation({
    onSuccess: () => {
      utils.eventType.list.invalidate();
      utils.eventType.byId.invalidate({ id: eventTypeId });
      router.push("/dashboard/event-types");
    },
    onError: (error) => {
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
    const locations: Location[] = [];
    if (formData.locationType === "inPerson" && formData.locationAddress) {
      locations.push({ type: "inPerson", address: formData.locationAddress });
    }

    updateEventType.mutate({
      id: eventTypeId,
      title: formData.title,
      slug: formData.slug,
      description: formData.description || undefined,
      length: formData.length,
      hidden: formData.hidden,
      locations: locations.length > 0 ? locations : undefined,
      minimumBookingNotice: formData.minimumBookingNotice,
      beforeEventBuffer: formData.beforeEventBuffer,
      afterEventBuffer: formData.afterEventBuffer,
      slotInterval: formData.slotInterval || undefined,
      requiresConfirmation: formData.requiresConfirmation,
      scheduleId: formData.scheduleId || undefined,
    });
  };

  const handleDelete = () => {
    if (confirm("Da li ste sigurni da želite da obrišete ovaj tip termina? Ova akcija je nepovratna.")) {
      deleteEventType.mutate({ id: eventTypeId });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Učitavanje...</div>
      </div>
    );
  }

  if (!eventType) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Tip termina nije pronađen</h2>
        <p className="text-gray-500 mt-2">Ovaj tip termina ne postoji ili nemate pristup.</p>
        <Link href="/dashboard/event-types">
          <Button className="mt-4">Nazad na tipove termina</Button>
        </Link>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Izmeni tip termina</h1>
            <p className="text-gray-600 mt-1">Ažurirajte podešavanja za "{eventType.title}"</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="w-4 h-4 mr-2" />
          Obriši
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.form && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {errors.form}
          </div>
        )}

        {/* Visibility toggle */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {formData.hidden ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-green-500" />
                )}
                <div>
                  <Label className="text-base">Vidljivost</Label>
                  <p className="text-sm text-gray-500">
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
                  !formData.hidden ? "bg-green-500" : "bg-gray-200"
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
                <Label htmlFor="title">Naziv</Label>
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
                <Label htmlFor="slug">URL slug</Label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-1">/</span>
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
              <Label htmlFor="description">Opis (opciono)</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Opišite šta klijent može očekivati od ovog termina..."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <Label>Trajanje</Label>
              <div className="flex flex-wrap gap-2">
                {durationOptions.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, length: duration }))}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      formData.length === duration
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, length: parseInt(e.target.value) || 30 }))}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-500">min</span>
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
              <Label htmlFor="locationAddress">Adresa</Label>
              <Input
                id="locationAddress"
                placeholder="npr. Knez Mihailova 10, Beograd"
                value={formData.locationAddress}
                onChange={(e) => setFormData((prev) => ({ ...prev, locationAddress: e.target.value }))}
                className={errors.locationAddress ? "border-red-500" : ""}
              />
              {errors.locationAddress && (
                <p className="text-sm text-red-500">{errors.locationAddress}</p>
              )}
              <p className="text-xs text-gray-500">
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
              <Label>Koristi raspored</Label>
              <select
                value={formData.scheduleId || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    scheduleId: e.target.value ? parseInt(e.target.value) : null,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Podrazumevani raspored</option>
                {schedules?.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
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
              <Label>Minimalno vreme unapred za zakazivanje</Label>
              <select
                value={formData.minimumBookingNotice}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minimumBookingNotice: parseInt(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {noticeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Koliko ranije klijent mora zakazati termin
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pauza pre termina</Label>
                <select
                  value={formData.beforeEventBuffer}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      beforeEventBuffer: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {bufferOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Pauza posle termina</Label>
                <select
                  value={formData.afterEventBuffer}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      afterEventBuffer: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <Label>Zahtevaj ručnu potvrdu</Label>
                <p className="text-xs text-gray-500 mt-0.5">
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
                  formData.requiresConfirmation ? "bg-blue-500" : "bg-gray-200"
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
