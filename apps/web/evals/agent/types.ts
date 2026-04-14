import type Anthropic from "@anthropic-ai/sdk";

export type MockToolResult = string | ((args: Record<string, unknown>) => string);

export type MockedTools = Record<string, MockToolResult>;

export interface SingleTurnScenario {
  id: string;
  description?: string;
  category: "golden" | "secondary" | "negative";
  prompt: string;
  expectedTools?: string[];
  forbiddenTools?: string[];
  salonName?: string;
}

export interface MultiTurnScenario {
  id: string;
  description?: string;
  category: "task-completion" | "conversation-continuation" | "negative";
  prompt?: string;
  messages?: Anthropic.MessageParam[];
  mockTools: MockedTools;
  expectedToolOrder?: string[];
  forbiddenTools?: string[];
  originalTask: string;
  salonName?: string;
  maxRounds?: number;
}

export interface SingleTurnResult {
  toolCalls: Array<{ name: string; input: unknown }>;
  toolNames: string[];
  selectedAny: boolean;
  text: string | null;
}

export interface MultiTurnResult {
  reply: string;
  toolCallOrder: string[];
  toolsUsed: string[];
  messages: Anthropic.MessageParam[];
}

export interface EvalScoreRow {
  id: string;
  category: string;
  toolsSelected: number;
  toolsAvoided: number;
  toolOrder?: number;
  judge?: number;
  passed: boolean;
  notes?: string;
}
