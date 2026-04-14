import { MODEL, agentTools, buildSystemPrompt, runAgentLoop } from "@/lib/agent/loop";
import Anthropic from "@anthropic-ai/sdk";
import type {
  MockedTools,
  MultiTurnResult,
  MultiTurnScenario,
  SingleTurnResult,
  SingleTurnScenario,
} from "./types";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required to run evals");
  }
  return new Anthropic({ apiKey });
}

function buildMockExecutor(mocks: MockedTools) {
  return async (name: string, input: Record<string, unknown>): Promise<string> => {
    const mock = mocks[name];
    if (mock === undefined) {
      return JSON.stringify({ error: `No mock for tool ${name}` });
    }
    return typeof mock === "function" ? mock(input) : mock;
  };
}

/**
 * Single-turn: one Claude call with tools available but no execution loop.
 * We want to observe which tools the model *chooses* on the first turn.
 */
export async function runSingleTurn(scenario: SingleTurnScenario): Promise<SingleTurnResult> {
  const client = getClient();
  const salonName = scenario.salonName ?? "Test Salon";
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: buildSystemPrompt(salonName),
    tools: agentTools,
    messages: [{ role: "user", content: scenario.prompt }],
  });

  const toolCalls = response.content
    .filter((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use")
    .map((b) => ({ name: b.name, input: b.input }));

  const textBlock = response.content.find(
    (b): b is Anthropic.Messages.TextBlock => b.type === "text"
  );
  const text = textBlock?.text ?? null;

  return {
    toolCalls,
    toolNames: toolCalls.map((t) => t.name),
    selectedAny: toolCalls.length > 0,
    text,
  };
}

/**
 * Multi-turn: run the full agent loop with mocked tool execution.
 */
export async function runMultiTurn(scenario: MultiTurnScenario): Promise<MultiTurnResult> {
  const client = getClient();
  const salonName = scenario.salonName ?? "Test Salon";

  const initialMessages: Anthropic.MessageParam[] = scenario.messages ? [...scenario.messages] : [];
  if (scenario.prompt) {
    initialMessages.push({ role: "user", content: scenario.prompt });
  }

  const result = await runAgentLoop({
    client,
    messages: initialMessages,
    salonName,
    toolExecutor: buildMockExecutor(scenario.mockTools),
    maxRounds: scenario.maxRounds,
  });

  return {
    reply: result.reply,
    toolCallOrder: result.toolCallOrder,
    toolsUsed: Array.from(new Set(result.toolCallOrder)),
    messages: result.messages,
  };
}
