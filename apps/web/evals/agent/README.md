# Agent evals

Regression harness for the Viber/WhatsApp booking agent.

## Running

### Local stdout runner (no account needed)

```bash
# from repo root
yarn workspace @salonko/web agent:eval           # both suites
yarn workspace @salonko/web agent:eval:single    # single-turn only
yarn workspace @salonko/web agent:eval:multi     # multi-turn only
```

Requires `ANTHROPIC_API_KEY` in your environment (reads from `.env` via `dotenv`).

### Laminar dashboard runner

```bash
yarn workspace @salonko/web agent:eval:lmnr:single
yarn workspace @salonko/web agent:eval:lmnr:multi
```

Environment (also loaded from `.env` via `dotenv`, same as the stdout runner):

- **`LMNR_PROJECT_API_KEY`** — authenticates uploads to Laminar; both `agent:eval:lmnr:single` and `agent:eval:lmnr:multi` pass this to `evaluate()`.
- **`ANTHROPIC_API_KEY`** — required for Claude when running those commands: the executor calls the model for every scenario, and `agent:eval:lmnr:multi` also uses Claude for the `outputQuality` (LLM judge) evaluator.

Scenarios are uploaded as a Laminar evaluation run and scored by the same evaluators as the stdout runner. Group names: `agent-single-turn`, `agent-multi-turn`.

## Suites

- **single-turn** (`data/single-turn.ts`): fires one user message at the model
  with tools available but *not* executed. Checks which tools the model picks.
  Good for catching "we stopped calling `get_salon_info`" regressions.
- **multi-turn** (`data/multi-turn.ts`): runs the full `runAgentLoop` with
  mocked tool results. Verifies tool-call order, forbidden-tool avoidance,
  and asks Claude to grade the final reply.

## How it stays in lock-step with prod

Both suites import `agentTools`, `buildSystemPrompt`, and `runAgentLoop` from
`apps/web/lib/agent/loop.ts` — the same code the production route uses. The
only thing the evals swap in is the `toolExecutor`: instead of hitting Prisma
and tRPC, it returns fixed JSON from `mocks/tools.ts`.

## Adding a scenario

### Single-turn
Append to `data/single-turn.ts`:

```ts
{
  id: "golden-...",
  category: "golden",        // golden | secondary | negative
  prompt: "...",
  expectedTools: ["get_salon_info"],
  forbiddenTools: ["create_booking"],
}
```

### Multi-turn
Append to `data/multi-turn.ts`. Either set `prompt` (fresh conversation) or
`messages` (mid-conversation). Use `defaultMockedTools` from `mocks/tools.ts`
or define your own.

## Runners

- `runEvals.ts` — stdout table, zero external deps beyond Claude.
- `single-turn.eval.ts` / `multi-turn.eval.ts` — Laminar `evaluate()` entrypoints
  that push results to the Laminar dashboard.

Both share the same scenarios, executors, and evaluators.
