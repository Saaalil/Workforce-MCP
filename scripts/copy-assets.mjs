import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoles = join(root, "src", "roles", "packs");
const distRoles = join(root, "dist", "roles", "packs");
const srcConstitution = join(root, "src", "constitution.md");
const distConstitution = join(root, "dist", "constitution.md");
const srcAssets = join(root, "src", "assets");
const distAssets = join(root, "dist", "assets");

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
