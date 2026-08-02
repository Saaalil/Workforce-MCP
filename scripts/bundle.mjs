import * as esbuild from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outfile = join(root, "dist", "index.js");

/**
 * Bundle OUR code only. Leave @modelcontextprotocol/sdk + zod external so
 * AJV's `new Function` (schema compile) is NOT inside our published file —
 * Socket "Uses eval" must not attach to @saaalil/workforce-mcp itself.
 */
await esbuild.build({
  entryPoints: [join(root, "src", "index.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile,
  // Shebang is normalized below — do not also put it in banner (entry
  // already has #! and esbuild preserves it → double shebang breaks ESM).
  packages: "external",
  logLevel: "info",
  treeShaking: true,
  minify: false,
  sourcemap: false,
  legalComments: "none",
});

// Exactly one shebang on line 1 (Node only strips the first line).
let out = readFileSync(outfile, "utf8").replace(/^\uFEFF/, "");
out = out.replace(/^(?:#!\/usr\/bin\/env node\r?\n)+/, "");
out = `#!/usr/bin/env node\n${out}`;
writeFileSync(outfile, out);
if (existsSync(outfile)) {
  try {
    chmodSync(outfile, 0o755);
  } catch {
    /* Windows may ignore mode */
  }
}

// Hard fail publish if malware-looking patterns land in OUR file.
for (const pattern of [
  /\bnew Function\b/,
  /\beval\s*\(/,
  /\bchild_process\b/,
  /from\s+["']node:fs["']/,
  /from\s+["']fs["']/,
]) {
  if (pattern.test(out)) {
    console.error(
      `SECURITY: forbidden pattern ${pattern} found in dist/index.js`
    );
    process.exit(1);
  }
}

console.log("Bundled Workforce stdio entry → dist/index.js (SDK external)");
