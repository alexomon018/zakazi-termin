/**
 * Laminar single-turn evaluation.
 * Usage: yarn workspace @salonko/web agent:eval:lmnr:single
 * Requires LMNR_PROJECT_API_KEY and ANTHROPIC_API_KEY in env.
 */

import "dotenv/config";

import { evaluate } from "@lmnr-ai/lmnr";

const LMNR_PROJECT_API_KEY = process.env.LMNR_PROJECT_API_KEY;
if (!LMNR_PROJECT_API_KEY) {
  console.error(
    "LMNR_PROJECT_API_KEY is required to run Laminar evals. Set it in your environment or .env file."
  );
  process.exit(1);
}
import { singleTurnScenarios } from "./data/single-turn";
import { firstToolIs, toolsAvoided, toolsSelected } from "./evaluators";
import { runSingleTurn } from "./executors";
import type { SingleTurnScenario } from "./types";

type Target = Pick<
  SingleTurnScenario,
  "expectedTools" | "expectedFirstTool" | "forbiddenTools" | "category"
>;

evaluate<SingleTurnScenario, Target, Awaited<ReturnType<typeof runSingleTurn>>>({
  data: singleTurnScenarios.map((s) => ({
    data: s,
    target: {
      expectedTools: s.expectedTools,
      expectedFirstTool: s.expectedFirstTool,
      forbiddenTools: s.forbiddenTools,
      category: s.category,
    },
  })),
  executor: (data) => runSingleTurn(data),
  evaluators: {
    toolsSelected: (output, target) => toolsSelected(output, target?.expectedTools),
    toolsAvoided: (output, target) => toolsAvoided(output, target?.forbiddenTools),
    firstTool: (output, target) => firstToolIs(output, target?.expectedFirstTool),
  },
  config: {
    projectApiKey: LMNR_PROJECT_API_KEY,
  },
  groupName: "agent-single-turn",
});
