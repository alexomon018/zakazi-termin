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
const maestroRoot = path.join(repoRoot, "maestro");

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

/**
 * Resolve a manifest path like "flows/auth/foo.yaml" to an absolute path under maestro/, or null if invalid.
 */
function resolveFlowPath(rel, screenId) {
  if (typeof rel !== "string" || !rel.trim()) {
    return { error: `Screen "${screenId}": invalid flowFiles entry` };
  }
  const trimmed = rel.trim();
  if (path.isAbsolute(trimmed)) {
    return { error: `Screen "${screenId}": flow path must be relative, got absolute: ${rel}` };
  }
  const normalized = path.normalize(trimmed);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return { error: `Screen "${screenId}": invalid path (outside maestro): ${rel}` };
  }
  const abs = path.join(maestroRoot, normalized);
  const relativeToMaestro = path.relative(maestroRoot, abs);
  if (relativeToMaestro.startsWith("..") || path.isAbsolute(relativeToMaestro)) {
    return { error: `Screen "${screenId}": flow path escapes maestro/: ${rel}` };
  }
  return { abs };
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
      const resolved = resolveFlowPath(rel, id);
      if (resolved.error) {
        console.error(resolved.error);
        errors++;
        continue;
      }
      if (!fs.existsSync(resolved.abs)) {
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
