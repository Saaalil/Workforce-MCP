import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoles = join(root, "src", "roles", "packs");
const distRoles = join(root, "dist", "roles", "packs");
const srcConstitution = join(root, "src", "constitution.md");
const distConstitution = join(root, "dist", "constitution.md");

mkdirSync(distRoles, { recursive: true });
cpSync(srcRoles, distRoles, { recursive: true });
if (existsSync(srcConstitution)) {
  cpSync(srcConstitution, distConstitution);
}

console.log("Copied role packs and constitution to dist/");
