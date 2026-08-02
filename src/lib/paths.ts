import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolve asset roots for both:
 * - modular build: dist/roles/loader.js, dist/lib/brand.js
 * - single-file bundle: dist/index.js
 */
export function packageDistRoot(importMetaUrl: string): string {
  const here = dirname(fileURLToPath(importMetaUrl));
  // Bundled entry lives at dist/index.js
  if (existsSync(join(here, "roles", "packs", "architect.md"))) {
    return here;
  }
  // Modular: dist/roles or dist/lib → go up to dist/
  return join(here, "..");
}

export function rolePacksDir(importMetaUrl: string): string {
  return join(packageDistRoot(importMetaUrl), "roles", "packs");
}

export function constitutionPath(importMetaUrl: string): string {
  return join(packageDistRoot(importMetaUrl), "constitution.md");
}

export function assetsDir(importMetaUrl: string): string {
  return join(packageDistRoot(importMetaUrl), "assets");
}
