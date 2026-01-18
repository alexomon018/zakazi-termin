export const SALON_TYPES = [
  { id: "frizerski_salon", label: "Frizerski salon" },
  { id: "barber_shop", label: "Barber shop" },
  { id: "salon_za_nokte", label: "Salon za nokte" },
  { id: "masaza", label: "Masaza" },
  { id: "spa_centar", label: "Spa centar" },
  { id: "obrve_i_trepavice", label: "Obrve i trepavice" },
  { id: "sminkanje", label: "Sminkanje" },
  { id: "salon_za_kucne_ljubimce", label: "Salon za kucne ljubimce" },
  { id: "kozmeticki_salon", label: "Kozmeticki salon" },
  { id: "tetoviraliste", label: "Tetoviraliste" },
  { id: "studio_za_pirsing", label: "Studio za pirsing" },
  { id: "depilacija", label: "Depilacija" },
] as const;

export type SalonTypeId = (typeof SALON_TYPES)[number]["id"];

export function getSalonTypeLabel(id: SalonTypeId): string {
  const salonType = SALON_TYPES.find((type) => type.id === id);
  return salonType?.label ?? id;
}

export function getSalonTypeLabels(ids: SalonTypeId[]): string[] {
  return ids.map(getSalonTypeLabel);
}
