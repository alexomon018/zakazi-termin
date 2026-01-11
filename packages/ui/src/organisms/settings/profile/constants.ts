import type { Timezone } from "./types";

export const TIMEZONES: Timezone[] = [
  // NOTE: Avoid hardcoded GMT offsets in labels because DST makes them misleading.
  { value: "Europe/Belgrade", label: "Beograd" },
  { value: "Europe/Zagreb", label: "Zagreb" },
  { value: "Europe/Sarajevo", label: "Sarajevo" },
  { value: "Europe/Podgorica", label: "Podgorica" },
  { value: "Europe/Skopje", label: "Skoplje" },
  { value: "Europe/Ljubljana", label: "Ljubljana" },
  { value: "Europe/Vienna", label: "Beč" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Europe/London", label: "London" },
  { value: "America/New_York", label: "Njujork" },
];
