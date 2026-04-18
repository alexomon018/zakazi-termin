/**
 * Minimal eval runner. Prints a per-scenario pass/fail table to stdout.
 *
 * Usage:
 *   yarn workspace @salonko/web agent:eval
 *   yarn workspace @salonko/web agent:eval:single
 *   yarn workspace @salonko/web agent:eval:multi
 */

import "dotenv/config";

import { multiTurnScenarios } from "./data/multi-turn";
import { singleTurnScenarios } from "./data/single-turn";
import {
  llmJudge,
  scoreSingleTurn,
  toolOrderCorrect,
  toolsAvoided,
  toolsSelected,
} from "./evaluators";
import { runMultiTurn, runSingleTurn } from "./executors";

const MIN_JUDGE_SCORE = 0.7;

type SuiteName = "single-turn" | "multi-turn" | "all";

function parseSuite(argv: string[]): SuiteName {
  const idx = argv.indexOf("--suite");
  if (idx === -1) return "all";
  const value = argv[idx + 1];
  if (value === "single-turn" || value === "multi-turn" || value === "all") {
    return value;
  }
  throw new Error(
    `Invalid --suite value: ${value ?? "<missing>"}. Allowed: single-turn, multi-turn, all`
  );
}

function fmt(n: number): string {
  return n.toFixed(2);
}

function errorMessage(err: unknown): string {
  try {
    if (err instanceof Error) {
      return err.message + (err.stack ? `\n${err.stack}` : "");
    }
    if (typeof err === "string") {
      return err;
    }
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

async function runSingleTurnSuite() {
  console.log("\n=== Single-turn suite ===");
  let passed = 0;
  for (const scenario of singleTurnScenarios) {
    try {
      const output = await runSingleTurn(scenario);
      const score = scoreSingleTurn(scenario, output);
      const marker = score.passed ? "PASS" : "FAIL";
      if (score.passed) passed++;
      console.log(
        `[${marker}] ${scenario.id} (${scenario.category}) tools=${JSON.stringify(
          output.toolNames
        )} selected=${score.toolsSelected} avoided=${score.toolsAvoided} firstTool=${score.firstTool}`
      );
    } catch (err) {
      console.log(`[ERROR] ${scenario.id}: ${errorMessage(err)}`);
    }
  }
  const safeRatio = singleTurnScenarios.length ? passed / singleTurnScenarios.length : 0;
  console.log(`\nSingle-turn: ${passed}/${singleTurnScenarios.length} passed (${fmt(safeRatio)})`);
  return { passed, total: singleTurnScenarios.length };
}

async function runMultiTurnSuite() {
  console.log("\n=== Multi-turn suite ===");
  let passed = 0;
  for (const scenario of multiTurnScenarios) {
    try {
      const output = await runMultiTurn(scenario);
      const selected = toolsSelected(output, scenario.expectedToolOrder);
      const avoided = toolsAvoided(output, scenario.forbiddenTools);
      const order = toolOrderCorrect(output, scenario.expectedToolOrder);
      const judge = await llmJudge(output, scenario);
      const scenarioPassed =
        judge >= MIN_JUDGE_SCORE &&
        avoided === 1 &&
        order >= 0.99 &&
        (scenario.expectedToolOrder ? selected === 1 : true);
      if (scenarioPassed) passed++;
      const marker = scenarioPassed ? "PASS" : "FAIL";
      console.log(
        `[${marker}] ${scenario.id} (${scenario.category}) tools=${JSON.stringify(
          output.toolCallOrder
        )} selected=${selected} avoided=${avoided} order=${fmt(order)} judge=${fmt(judge)}`
      );
      if (!scenarioPassed) {
        console.log(`       reply: ${output.reply.slice(0, 160).replace(/\n/g, " ")}`);
      }
    } catch (err) {
      console.log(`[ERROR] ${scenario.id}: ${errorMessage(err)}`);
    }
  }
  const safeRatio = multiTurnScenarios.length ? passed / multiTurnScenarios.length : 0;
  console.log(`\nMulti-turn: ${passed}/${multiTurnScenarios.length} passed (${fmt(safeRatio)})`);
  return { passed, total: multiTurnScenarios.length };
}

async function main() {
  const suite = parseSuite(process.argv.slice(2));
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set — cannot run evals.");
    process.exit(1);
  }

  let totalPassed = 0;
  let total = 0;

  if (suite === "single-turn" || suite === "all") {
    const r = await runSingleTurnSuite();
    totalPassed += r.passed;
    total += r.total;
  }
  if (suite === "multi-turn" || suite === "all") {
    const r = await runMultiTurnSuite();
    totalPassed += r.passed;
    total += r.total;
  }

  console.log(`\n=== Overall: ${totalPassed}/${total} ===`);
  process.exit(totalPassed === total ? 0 : 1);
}

main().catch((err) => {
  console.error(errorMessage(err));
  process.exit(1);
});
