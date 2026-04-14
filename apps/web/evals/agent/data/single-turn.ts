import type { SingleTurnScenario } from "../types";

export const singleTurnScenarios: SingleTurnScenario[] = [
  {
    id: "golden-services-list",
    category: "golden",
    description: "Ask for services — should call get_salon_info",
    prompt: "Ćao, koje usluge nudite?",
    expectedTools: ["get_salon_info"],
  },
  {
    id: "golden-availability-tomorrow",
    category: "golden",
    description: "Ask for a slot tomorrow — must start with get_salon_info (needs slug first)",
    prompt: "Hoću termin za šišanje sutra ujutro.",
    expectedTools: ["get_salon_info"],
  },
  {
    id: "golden-salon-address",
    category: "golden",
    description: "Ask where the salon is — get_salon_info covers address",
    prompt: "Gde se nalazi salon?",
    expectedTools: ["get_salon_info"],
  },
  {
    id: "negative-pricing",
    category: "negative",
    description: "Pricing is out of scope per system prompt",
    prompt: "Koliko košta šišanje?",
    forbiddenTools: ["create_booking", "check_availability"],
  },
  {
    id: "negative-staff-question",
    category: "negative",
    description: "Off-topic question — should not call booking tools",
    prompt: "Ko je vlasnik salona?",
    forbiddenTools: ["create_booking", "check_availability"],
  },
  {
    id: "negative-direct-booking-no-confirm",
    category: "negative",
    description: "User demands immediate booking — must not call create_booking on first turn",
    prompt: "Rezerviši mi odmah termin za šišanje za sutra u 10h.",
    forbiddenTools: ["create_booking"],
  },
];
