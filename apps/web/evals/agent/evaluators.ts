import { MODEL } from "@/lib/agent/loop";
import Anthropic from "@anthropic-ai/sdk";
import type {
  MultiTurnResult,
  MultiTurnScenario,
  SingleTurnResult,
  SingleTurnScenario,
} from "./types";

function toolNameSequence(output: SingleTurnResult | MultiTurnResult): string[] {
  return "toolCallOrder" in output ? output.toolCallOrder : output.toolNames;
}

/** If `expected` is set, the first tool in the recorded sequence must equal it. */
export function firstToolIs(output: SingleTurnResult | MultiTurnResult, expected?: string): number {
  if (!expected) return 1;
  const seq = toolNameSequence(output);
  return seq.length > 0 && seq[0] === expected ? 1 : 0;
}

export function toolsSelected(
  output: SingleTurnResult | MultiTurnResult,
  expected?: string[]
): number {
  if (!expected?.length) return 1;
  const selected = new Set("toolNames" in output ? output.toolNames : output.toolsUsed);
  return expected.every((t) => selected.has(t)) ? 1 : 0;
}

export function toolsAvoided(
  output: SingleTurnResult | MultiTurnResult,
  forbidden?: string[]
): number {
  if (!forbidden?.length) return 1;
  const selected = new Set("toolNames" in output ? output.toolNames : output.toolsUsed);
  return forbidden.some((t) => selected.has(t)) ? 0 : 1;
}

/**
 * Returns the fraction of expected tools found in the right relative order.
 * Tools don't have to be consecutive but must appear in the expected sequence.
 */
export function toolOrderCorrect(output: MultiTurnResult, expectedOrder?: string[]): number {
  if (!expectedOrder?.length) return 1;
  let idx = 0;
  for (const name of output.toolCallOrder) {
    if (name === expectedOrder[idx]) {
      idx++;
      if (idx === expectedOrder.length) break;
    }
  }
  return idx / expectedOrder.length;
}

const judgeSystem = `You are an evaluation judge for a Serbian-language booking assistant.
Score the agent's final reply on a scale of 1-10.

Scoring criteria:
- 10: Fully addresses the task, uses tool results correctly, natural Serbian
- 7-9: Mostly correct with minor issues
- 4-6: Partially addresses the task
- 1-3: Mostly incorrect or irrelevant

Reply ONLY with compact JSON: {"score": <int 1-10>, "reason": "<brief>"}.`;

/**
 * Claude-as-judge. Returns score in 0..1.
 */
export async function llmJudge(
  output: MultiTurnResult,
  scenario: MultiTurnScenario
): Promise<number> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return 0;
  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: judgeSystem,
      messages: [
        {
          role: "user",
          content: `Task: ${scenario.originalTask}

Tools called (in order): ${JSON.stringify(output.toolCallOrder)}
Expected tool order: ${JSON.stringify(scenario.expectedToolOrder ?? [])}
Forbidden tools: ${JSON.stringify(scenario.forbiddenTools ?? [])}

Agent final reply:
"""
${output.reply}
"""

Return JSON only.`,
        },
      ],
    });

    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return 0;
    const match = text.text.match(/\{[\s\S]*\}/);
    if (!match) return 0;
    const parsed = JSON.parse(match[0]) as { score?: number };
    if (typeof parsed.score !== "number") return 0;
    return Math.max(0, Math.min(1, parsed.score / 10));
  } catch (err) {
    console.error("[llmJudge] judge call or parse failed", {
      originalTask: scenario.originalTask,
      toolCallOrder: output.toolCallOrder,
      error: err,
    });
    return 0;
  }
}

export function scoreSingleTurn(scenario: SingleTurnScenario, output: SingleTurnResult) {
  const selected = toolsSelected(output, scenario.expectedTools);
  const avoided = toolsAvoided(output, scenario.forbiddenTools);
  const firstTool = firstToolIs(output, scenario.expectedFirstTool);
  const passed = selected === 1 && avoided === 1 && firstTool === 1;
  return { toolsSelected: selected, toolsAvoided: avoided, firstTool, passed };
}
