const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro resolve packages from the monorepo root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Allow resolving modern ESM packages that only expose "exports" (e.g. copy-anything v4).
config.resolver.unstable_enablePackageExports = true;

// experimentalImportSupport enables experimental ESM import/export handling in Metro’s
// transformer (better compatibility with ESM-only packages). Production tree-shaking and
// minification are handled by the production minifier (e.g. Terser), not this flag.
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: true,
  },
});

module.exports = config;
