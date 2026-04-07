"use client";

import { SALON_TYPES } from "@salonko/config";
import { TabFilter } from "@salonko/ui";

interface SalonTypeFilterProps {
  selected: string | null;
  onChange: (typeId: string | null) => void;
}

export function SalonTypeFilter({ selected, onChange }: SalonTypeFilterProps) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
        <TabFilter label="Svi" isActive={selected === null} onClick={() => onChange(null)} />
        {SALON_TYPES.map((type) => (
          <TabFilter
            key={type.id}
            label={type.label}
            isActive={selected === type.id}
            onClick={() => onChange(type.id)}
          />
        ))}
      </div>
    </div>
  );
}
