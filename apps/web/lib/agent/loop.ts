import type Anthropic from "@anthropic-ai/sdk";

export const MAX_TOOL_ROUNDS = 5;
export const MAX_HISTORY_MESSAGES = 40;
export const DEFAULT_ERROR_REPLY = "Žao mi je, došlo je do greške. Pokušajte ponovo.";
export const MODEL = "claude-sonnet-4-6";

export const agentTools: Anthropic.Tool[] = [
  {
    name: "get_salon_info",
    description:
      "Vraća informacije o salonu i listi dostupnih usluga (naziv, grad, adresa, trajanje i opis svake usluge). Uvek pozovi ovo prvo pre nego što odgovoriš na pitanja o uslugama.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "check_availability",
    description:
      "Proverava slobodne termine za određenu uslugu u datom vremenskom periodu. Vraća listu slobodnih termina kao ISO 8601 timestamps.",
    input_schema: {
      type: "object",
      properties: {
        eventTypeSlug: {
          type: "string",
          description: "Slug usluge (npr. 'sisanje', 'manikir'). Dobij ga iz get_salon_info.",
        },
        dateFrom: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
          description: "Početak perioda pretrage u formatu YYYY-MM-DD",
        },
        dateTo: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
          description: "Kraj perioda pretrage u formatu YYYY-MM-DD",
        },
        timeZone: {
          type: "string",
          description: "Vremenski pojas korisnika. Podrazumevano: Europe/Belgrade",
        },
      },
      required: ["eventTypeSlug", "dateFrom", "dateTo"],
    },
  },
  {
    name: "propose_booking",
    description:
      "Pripremi predlog termina za korisnika. Obavezno pozovi ovo PRE create_booking. Vraća proposalId koji se kasnije koristi za potvrdu. Nakon što dobiješ proposalId, prikaži korisniku sve detalje i pitaj ga eksplicitno za potvrdu.",
    input_schema: {
      type: "object",
      properties: {
        eventTypeSlug: { type: "string", description: "Slug usluge" },
        startTime: {
          type: "string",
          description: "Početak termina u ISO 8601 formatu (npr. '2026-04-15T14:00:00+02:00')",
        },
        endTime: {
          type: "string",
          description: "Kraj termina u ISO 8601 formatu",
        },
        name: { type: "string", description: "Ime i prezime korisnika" },
        email: { type: "string", description: "Email adresa korisnika" },
        phone: { type: "string", description: "Broj telefona korisnika (opciono)" },
        notes: { type: "string", description: "Napomena za salon (opciono)" },
        timeZone: {
          type: "string",
          description: "Vremenski pojas. Podrazumevano: Europe/Belgrade",
        },
      },
      required: ["eventTypeSlug", "startTime", "endTime", "name", "email"],
    },
  },
  {
    name: "create_booking",
    description:
      "Potvrđuje i kreira termin koji je prethodno pripremljen kroz propose_booking. Pozivaj ISKLJUČIVO kada je korisnik eksplicitno potvrdio (rekao 'da', 'potvrđujem', 'ok'). Server odbacuje poziv ako proposalId nije validan ili je istekao.",
    input_schema: {
      type: "object",
      properties: {
        proposalId: {
          type: "string",
          description: "ID predloga dobijen iz propose_booking",
        },
        confirmed: {
          type: "boolean",
          description: "Mora biti true. Postavi tek nakon eksplicitne potvrde korisnika.",
        },
      },
      required: ["proposalId", "confirmed"],
    },
  },
];

export function buildSystemPrompt(salonName: string): string {
  return `Ti si asistent za zakazivanje termina u salonu "${salonName}". Komunikacija je isključivo na srpskom jeziku, neformalan ton (ti forma).

## Pravila ponašanja

1. **Dvostepeno zakazivanje**: Prvo pozovi propose_booking sa svim podacima — dobićeš proposalId. Zatim prikaži korisniku sažetak (uslugu, datum/vreme, ime, email) i pitaj eksplicitno: "Da li potvrđujete?". Tek kada korisnik kaže "da", "potvrđujem" ili "ok", pozovi create_booking sa proposalId i confirmed=true. NIKADA ne pozivaj create_booking bez prethodnog propose_booking i bez eksplicitne korisničke potvrde.

2. **Obavezni podaci za zakazivanje**: ime, email i željeni termin. Telefon je opciono ali preporučeno.

3. **Informišu te alati**: Koristi get_salon_info za informacije o uslugama. Koristi check_availability za slobodne termine. Ne izmišljaj termine.

4. **Alternativni termini**: Ako željeno vreme nije slobodno, odmah ponudi 2-3 alternative iz rezultata check_availability.

5. **Van opsega**: Ako korisnik pita nešto što nije vezano za zakazivanje (cene, posebne ponude, pitanja o osoblju itd.), reci: "Za ovo pitanje kontaktirajte salon direktno."

6. **Status termina**: Nakon uspešnog create_booking, obavesti korisnika da termin čeka potvrdu salona i da će dobiti email potvrdu. Ako predlog istekne ili je nevažeći, ponovo pripremi novi propose_booking.

7. **Format vremena**: Kada prikazuješ termine korisniku, koristi format "ponedeljak, 15. april u 14:00" — nikada ISO format.`;
}

export type ToolExecutor = (
  toolName: string,
  toolInput: Record<string, unknown>
) => Promise<string>;

export interface RunAgentLoopOptions {
  client: Anthropic;
  messages: Anthropic.MessageParam[];
  salonName: string;
  toolExecutor: ToolExecutor;
  maxRounds?: number;
  onToolError?: (toolName: string, error: unknown) => void;
}

export interface RunAgentLoopResult {
  reply: string;
  messages: Anthropic.MessageParam[];
  toolCallOrder: string[];
}

function extractText(content: Anthropic.ContentBlock[]): string | null {
  const textBlock = content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : null;
}

export async function runAgentLoop({
  client,
  messages,
  salonName,
  toolExecutor,
  maxRounds = MAX_TOOL_ROUNDS,
  onToolError,
}: RunAgentLoopOptions): Promise<RunAgentLoopResult> {
  const working: Anthropic.MessageParam[] = [...messages];
  const toolCallOrder: string[] = [];
  let reply = DEFAULT_ERROR_REPLY;
  let exhaustedRounds = false;

  for (let round = 0; round < maxRounds; round++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(salonName),
      tools: agentTools,
      messages: working,
    });

    working.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      const text = extractText(response.content);
      if (text) reply = text;
      break;
    }

    if (response.stop_reason === "tool_use") {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        toolCallOrder.push(block.name);
        let result: string;
        try {
          result = await toolExecutor(block.name, block.input as Record<string, unknown>);
        } catch (err) {
          onToolError?.(block.name, err);
          result = JSON.stringify({ error: "Alat nije dostupan. Pokušajte ponovo." });
        }
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }
      working.push({ role: "user", content: toolResults });

      if (round === maxRounds - 1) exhaustedRounds = true;
      continue;
    }

    break;
  }

  if (exhaustedRounds && reply === DEFAULT_ERROR_REPLY) {
    const final = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: `${buildSystemPrompt(salonName)}\n\nNapomena: Sumiraj trenutno stanje korisniku bez korišćenja alata.`,
      messages: working,
    });
    working.push({ role: "assistant", content: final.content });
    const text = extractText(final.content);
    if (text) reply = text;
  }

  return { reply, messages: working, toolCallOrder };
}

export function compactHistory(
  messages: Anthropic.MessageParam[],
  maxMessages = MAX_HISTORY_MESSAGES
): Anthropic.MessageParam[] {
  const sliced = messages.slice(-maxMessages);

  const liveToolUseIds = new Set<string>();
  const liveToolResultIds = new Set<string>();
  for (const m of sliced) {
    if (typeof m.content === "string") continue;
    for (const b of m.content) {
      if (b.type === "tool_use") liveToolUseIds.add(b.id);
      if (b.type === "tool_result") liveToolResultIds.add(b.tool_use_id);
    }
  }

  return sliced.filter((m) => {
    if (typeof m.content === "string") return true;
    if (m.role === "user") {
      const toolResults = m.content.filter((b) => b.type === "tool_result");
      if (toolResults.length === 0) return true;
      return toolResults.every(
        (b) => b.type === "tool_result" && liveToolUseIds.has(b.tool_use_id)
      );
    }
    if (m.role === "assistant") {
      const toolUses = m.content.filter((b) => b.type === "tool_use");
      if (toolUses.length === 0) return true;
      return toolUses.every((b) => b.type === "tool_use" && liveToolResultIds.has(b.id));
    }
    return true;
  });
}
