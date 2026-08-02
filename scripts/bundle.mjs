import * as esbuild from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outfile = join(root, "dist", "index.js");

/**
 * Bundle a stdio-only MCP server into one file.
 * Keeps Express/HTTP trees out of the *published* dependency list
 * (they stay inside the bundle only if statically reachable — we import
 * stdio paths only, so supply-chain scanners see zero runtime deps).
 */
await esbuild.build({
  entryPoints: [join(root, "src", "index.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile,
  banner: {
    js: "#!/usr/bin/env node\n",
  },
  // Bundle MCP SDK + zod; Node builtins stay external (platform: node).
  logLevel: "info",
  treeShaking: true,
  minify: false,
  sourcemap: false,
  legalComments: "none",
});

// Ensure the shebang survives and the file is executable on Unix.
let out = readFileSync(outfile, "utf8");
if (!out.startsWith("#!/usr/bin/env node")) {
  out = `#!/usr/bin/env node\n${out}`;
  writeFileSync(outfile, out);
}
if (existsSync(outfile)) {
  try {
    chmodSync(outfile, 0o755);
  } catch {
    /* Windows may ignore mode */
  }
}

console.log("Bundled stdio MCP server → dist/index.js");
