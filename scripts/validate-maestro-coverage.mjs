#!/usr/bin/env node
/**
 * Validates maestro/coverage/screens.yaml: each screen must list at least one existing flow file.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const manifestPath = path.join(repoRoot, "maestro", "coverage", "screens.yaml");

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function main() {
  if (!fs.existsSync(manifestPath)) {
    fail(`Missing manifest: ${manifestPath}`);
  }

  const raw = fs.readFileSync(manifestPath, "utf8");
  let data;
  try {
    data = parseYaml(raw);
  } catch (e) {
    fail(`Invalid YAML in screens.yaml: ${e}`);
  }

  const screens = data?.screens;
  if (!Array.isArray(screens) || screens.length === 0) {
    fail('screens.yaml must define a non-empty "screens" array');
  }

  let errors = 0;
  for (const screen of screens) {
    const id = screen?.id ?? "(missing id)";
    const flowFiles = screen?.flowFiles;
    if (!Array.isArray(flowFiles) || flowFiles.length === 0) {
      console.error(`Screen "${id}": flowFiles must be a non-empty array`);
      errors++;
      continue;
    }
    for (const rel of flowFiles) {
      if (typeof rel !== "string" || !rel.trim()) {
        console.error(`Screen "${id}": invalid flowFiles entry`);
        errors++;
        continue;
      }
      const abs = path.join(repoRoot, "maestro", rel);
      if (!fs.existsSync(abs)) {
        console.error(`Screen "${id}": flow file not found: ${rel}`);
        errors++;
      }
    }
  }

  if (errors > 0) {
    fail(`Maestro coverage validation failed with ${errors} error(s).`);
  }

  console.log(`✅ Maestro screen coverage OK (${screens.length} screens).`);
}

main();
