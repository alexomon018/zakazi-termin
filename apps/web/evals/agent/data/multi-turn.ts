import { defaultMockedTools, emptyAvailabilityMock } from "../mocks/tools";
import type { MultiTurnScenario } from "../types";

export const multiTurnScenarios: MultiTurnScenario[] = [
  {
    id: "task-list-services",
    category: "task-completion",
    description: "User asks for services; agent should call get_salon_info and reply.",
    prompt: "Zdravo! Koje usluge imate?",
    mockTools: defaultMockedTools,
    expectedToolOrder: ["get_salon_info"],
    forbiddenTools: ["create_booking"],
    originalTask: "List available salon services in Serbian.",
  },
  {
    id: "task-find-slots",
    category: "task-completion",
    description: "User wants a haircut slot — agent should check availability after salon info.",
    prompt: "Hoću da zakažem šišanje za sutra.",
    mockTools: defaultMockedTools,
    expectedToolOrder: ["get_salon_info", "check_availability"],
    forbiddenTools: ["create_booking"],
    originalTask: "Offer available haircut slots for tomorrow.",
  },
  {
    id: "task-no-slots-alternatives",
    category: "task-completion",
    description: "No slots available — agent must not book and should offer alternatives.",
    prompt: "Treba mi termin za šišanje sutra.",
    mockTools: emptyAvailabilityMock,
    expectedToolOrder: ["get_salon_info", "check_availability"],
    forbiddenTools: ["create_booking"],
    originalTask: "Handle a no-availability case gracefully, offer alternatives.",
  },
  {
    id: "negative-user-refuses",
    category: "negative",
    description: "Mid-conversation: user rejects proposed slot — must NOT call create_booking.",
    messages: [
      { role: "user", content: "Hoću termin za šišanje sutra." },
      {
        role: "assistant",
        content:
          "Naravno. Imam slobodno sutra u 09:00, 10:00 i 11:00. Koji termin ti odgovara? Reci mi takođe ime i email.",
      },
      { role: "user", content: "Ne, ne odgovara mi nijedan. Daj mi druge termine." },
    ],
    mockTools: defaultMockedTools,
    forbiddenTools: ["create_booking"],
    originalTask: "User refused proposed slots. Agent must re-query availability, not book.",
  },
];
