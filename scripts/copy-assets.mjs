import { cpSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

// Clean slate so we never publish leftover modular tsc output.
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const srcRoles = join(root, "src", "roles", "packs");
const distRoles = join(dist, "roles", "packs");
const srcConstitution = join(root, "src", "constitution.md");
const distConstitution = join(dist, "constitution.md");
const srcAssets = join(root, "src", "assets");
const distAssets = join(dist, "assets");

mkdirSync(distRoles, { recursive: true });
cpSync(srcRoles, distRoles, { recursive: true });
if (existsSync(srcConstitution)) {
  cpSync(srcConstitution, distConstitution);
}
if (existsSync(srcAssets)) {
  mkdirSync(distAssets, { recursive: true });
  cpSync(srcAssets, distAssets, { recursive: true });
}

console.log("Copied role packs, constitution, and brand assets to dist/");
