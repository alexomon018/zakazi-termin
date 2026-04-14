/**
 * Laminar single-turn evaluation.
 * Usage: yarn workspace @salonko/web agent:eval:lmnr:single
 * Requires LMNR_PROJECT_API_KEY and ANTHROPIC_API_KEY in env.
 */

import "dotenv/config";

import { evaluate } from "@lmnr-ai/lmnr";
import { singleTurnScenarios } from "./data/single-turn";
import { toolsAvoided, toolsSelected } from "./evaluators";
import { runSingleTurn } from "./executors";
import type { SingleTurnScenario } from "./types";

type Target = Pick<SingleTurnScenario, "expectedTools" | "forbiddenTools" | "category">;

evaluate<SingleTurnScenario, Target, Awaited<ReturnType<typeof runSingleTurn>>>({
  data: singleTurnScenarios.map((s) => ({
    data: s,
    target: {
      expectedTools: s.expectedTools,
      forbiddenTools: s.forbiddenTools,
      category: s.category,
    },
  })),
  executor: (data) => runSingleTurn(data),
  evaluators: {
    toolsSelected: (output, target) => toolsSelected(output, target?.expectedTools),
    toolsAvoided: (output, target) => toolsAvoided(output, target?.forbiddenTools),
  },
  config: {
    projectApiKey: process.env.LMNR_PROJECT_API_KEY,
  },
  groupName: "agent-single-turn",
});
