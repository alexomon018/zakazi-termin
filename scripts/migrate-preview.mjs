#!/usr/bin/env node
/**
 * Create (or reuse) a Neon preview branch for the current git branch, based off develop,
 * then (by default) push the Prisma schema to it.
 *
 * Requires:
 *   - Node 18+ (repo uses Node 22), git, yarn
 *   - env: NEON_API_KEY, NEON_PROJECT_ID
 * Optional:
 *   - env: NEON_DB_PASSWORD (required for schema apply / DATABASE_URL output)
 *   - env: NEON_PARENT_BRANCH (default: preview/develop, fallback: develop)
 *
 * Examples:
 *   NEON_API_KEY=... NEON_PROJECT_ID=... NEON_DB_PASSWORD=... yarn migrate
 *   yarn migrate --no-apply
 *   yarn migrate --branch feature/email-verification
 *   yarn migrate --parent develop
 *   yarn migrate --write-env .env.preview.local
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

function usage(exitCode = 0) {
  // eslint-disable-next-line no-console
  console.log(
    `
Usage:
  yarn migrate [--branch <name>] [--parent <name>] [--no-apply] [--write-env <path>]

Behavior:
  - Resolves <name> from the current git branch (unless --branch is provided)
  - Ensures Neon branch name is prefixed with "preview/"
  - Creates the branch on Neon from parent "preview/develop" (fallback: "develop")
  - Waits for an endpoint host + role, prints a masked DATABASE_URL (never the password)
  - By default, runs:
      - yarn db:generate
      - yarn workspace @salonko/prisma prisma db push --skip-generate --accept-data-loss

Required env:
  NEON_API_KEY, NEON_PROJECT_ID

For schema apply / DATABASE_URL:
  NEON_DB_PASSWORD
`.trim()
  );
  process.exit(exitCode);
}

function fail(msg) {
  // eslint-disable-next-line no-console
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function info(msg) {
  // eslint-disable-next-line no-console
  console.log(msg);
}

function maskDatabaseUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.password) u.password = "****";
    return u.toString();
  } catch {
    // Fallback masking for non-standard URLs or unexpected parsing failures.
    return rawUrl.replace(/:\/\/([^:/?#]+):([^@]+)@/u, "://$1:****@");
  }
}

function requireEnv(name) {
  if (!process.env[name]) fail(`Missing required env var: ${name}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const args = {
    apply: true,
    branchOverride: "",
    parentOverride: process.env.NEON_PARENT_BRANCH ?? "",
    writeEnv: "",
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") usage(0);
    if (a === "--no-apply") {
      args.apply = false;
      continue;
    }
    if (a === "--branch") {
      args.branchOverride = argv[++i] ?? "";
      if (!args.branchOverride) fail("--branch requires a value");
      continue;
    }
    if (a === "--parent") {
      args.parentOverride = argv[++i] ?? "";
      if (!args.parentOverride) fail("--parent requires a value");
      continue;
    }
    if (a === "--write-env") {
      args.writeEnv = argv[++i] ?? "";
      if (!args.writeEnv) fail("--write-env requires a path");
      continue;
    }
    fail(`Unknown argument: ${a}`);
  }

  return args;
}

function run(cmd, env = {}) {
  execSync(cmd, {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
}

function sh(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] })
    .toString()
    .trim();
}

async function neonGetJson(url, apiKey) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    fail(`Neon API GET failed (${res.status} ${res.statusText}): ${url}\n${body}`);
  }
  return await res.json();
}

async function neonPostJson(url, apiKey, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    fail(`Neon API POST failed (${res.status} ${res.statusText}): ${url}\n${text}`);
  }
  return await res.json();
}

async function main() {
  const args = parseArgs(process.argv);

  requireEnv("NEON_API_KEY");
  requireEnv("NEON_PROJECT_ID");

  const apiKey = process.env.NEON_API_KEY;
  const projectId = process.env.NEON_PROJECT_ID;

  let currentBranch = args.branchOverride;
  if (!currentBranch) {
    currentBranch = sh("git rev-parse --abbrev-ref HEAD");
  }

  if (!currentBranch || currentBranch === "HEAD") {
    fail("Could not determine git branch name (detached HEAD). Use --branch <name>.");
  }
  if (/\s/.test(currentBranch)) {
    fail(`Branch name contains whitespace: '${currentBranch}'`);
  }

  let neonBranch = currentBranch;
  if (!neonBranch.startsWith("preview/")) neonBranch = `preview/${neonBranch}`;

  let parentName = args.parentOverride || "preview/develop";
  const apiBase = `https://console.neon.tech/api/v2/projects/${projectId}`;

  info(`🔎 Resolving Neon branch: ${neonBranch}`);
  info(`↳ Parent preference: ${parentName} (fallback: develop)`);

  const branchesJson = await neonGetJson(`${apiBase}/branches`, apiKey);
  const branches = Array.isArray(branchesJson?.branches) ? branchesJson.branches : [];

  const existingBranch = branches.find((b) => b?.name === neonBranch);
  let branchId = existingBranch?.id ?? "";

  if (branchId) {
    info(`✅ Neon branch already exists: ${neonBranch} (id: ${branchId})`);
  } else {
    let parent = branches.find((b) => b?.name === parentName);
    if (!parent && parentName === "preview/develop") {
      parentName = "develop";
      parent = branches.find((b) => b?.name === parentName);
    }
    if (!parent?.id) {
      const names = branches
        .map((b) => b?.name)
        .filter(Boolean)
        .slice(0, 50);
      fail(
        `Could not find parent branch '${args.parentOverride || "preview/develop"}' (or fallback 'develop') in Neon.\n` +
          `Available branches (first 50):\n- ${names.join("\n- ")}`
      );
    }

    info(`🧬 Creating Neon branch '${neonBranch}' from '${parentName}'...`);
    const createJson = await neonPostJson(`${apiBase}/branches`, apiKey, {
      branch: { name: neonBranch, parent_id: parent.id },
    });
    branchId = createJson?.branch?.id ?? "";
    if (!branchId) {
      fail(`Failed to create branch. Response:\n${JSON.stringify(createJson, null, 2)}`);
    }
    info(`✅ Created: ${neonBranch} (id: ${branchId})`);
  }

  info("⏳ Waiting for endpoint host...");
  let host = "";
  for (let i = 0; i < 20; i++) {
    const endpointsJson = await neonGetJson(`${apiBase}/branches/${branchId}/endpoints`, apiKey);
    host = endpointsJson?.endpoints?.[0]?.host ?? "";
    if (host) break;
    await sleep(2000);
  }
  if (!host) {
    fail(`Could not resolve endpoint host for branch '${neonBranch}' yet. Try again in a minute.`);
  }

  const rolesJson = await neonGetJson(`${apiBase}/branches/${branchId}/roles`, apiKey);
  const roles = Array.isArray(rolesJson?.roles) ? rolesJson.roles : [];
  const roleName = roles.find((r) => r?.name && r.name !== "web_access")?.name ?? "";
  if (!roleName) {
    fail(`Could not resolve a database role for branch '${neonBranch}'.`);
  }

  info(`✅ Endpoint: ${host}`);
  info(`✅ Role:     ${roleName}`);

  const password = process.env.NEON_DB_PASSWORD ?? "";
  let databaseUrl = "";
  if (password) {
    const passwordEnc = encodeURIComponent(password);
    databaseUrl = `postgresql://${roleName}:${passwordEnc}@${host}/neondb?sslmode=require`;
    info("\nDATABASE_URL (masked):");
    info(maskDatabaseUrl(databaseUrl));
  } else {
    info("\n⚠️ NEON_DB_PASSWORD is not set, so DATABASE_URL can't be constructed.");
  }

  if (args.writeEnv) {
    if (!databaseUrl) fail("--write-env requires NEON_DB_PASSWORD (to write DATABASE_URL).");
    writeFileSync(
      args.writeEnv,
      `# Generated by scripts/migrate-preview.mjs\nNEON_BRANCH="${neonBranch}"\nDATABASE_URL="${databaseUrl}"\n`,
      "utf8"
    );
    info(`\n📝 Wrote env file: ${args.writeEnv}`);
  }

  if (args.apply) {
    if (!databaseUrl) {
      fail("Cannot apply schema without NEON_DB_PASSWORD (needed for DATABASE_URL).");
    }
    info(`\n🚀 Applying schema to '${neonBranch}'...`);
    run("yarn db:generate", { DATABASE_URL: databaseUrl });
    run("yarn workspace @salonko/prisma prisma db push --skip-generate --accept-data-loss", {
      DATABASE_URL: databaseUrl,
    });
    info("✅ Schema applied.");
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
