/**
 * Laminar multi-turn evaluation.
 * Usage: yarn workspace @salonko/web agent:eval:lmnr:multi
 * Requires LMNR_PROJECT_API_KEY and ANTHROPIC_API_KEY in env.
 */

import "dotenv/config";

import { evaluate } from "@lmnr-ai/lmnr";
import { multiTurnScenarios } from "./data/multi-turn";
import { llmJudge, toolOrderCorrect, toolsAvoided, toolsSelected } from "./evaluators";
import { runMultiTurn } from "./executors";
import type { MultiTurnScenario } from "./types";

type Target = Pick<
  MultiTurnScenario,
  "expectedToolOrder" | "forbiddenTools" | "category" | "originalTask"
>;

evaluate<MultiTurnScenario, Target, Awaited<ReturnType<typeof runMultiTurn>>>({
  data: multiTurnScenarios.map((s) => ({
    data: s,
    target: {
      expectedToolOrder: s.expectedToolOrder,
      forbiddenTools: s.forbiddenTools,
      category: s.category,
      originalTask: s.originalTask,
    },
  })),
  executor: (data) => runMultiTurn(data),
  evaluators: {
    toolsSelected: (output, target) => toolsSelected(output, target?.expectedToolOrder),
    toolsAvoided: (output, target) => toolsAvoided(output, target?.forbiddenTools),
    toolOrder: (output, target) => toolOrderCorrect(output, target?.expectedToolOrder),
    outputQuality: async (output, _target, data) => (data ? llmJudge(output, data) : 1),
  },
  config: {
    projectApiKey: process.env.LMNR_PROJECT_API_KEY,
  },
  groupName: "agent-multi-turn",
});
