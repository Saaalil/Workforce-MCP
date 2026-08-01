import { ROLE_IDS, type RoleId } from "../types.js";
import { listCatalog } from "./loader.js";
import { PRIMARY_SHORT_FLAGS, resolveRoleId } from "./aliases.js";

export const CORE_ROLES = ROLE_IDS;

export function isRoleId(value: string): value is RoleId {
  return (ROLE_IDS as readonly string[]).includes(value);
}

export function registrySummary(): string {
  return listCatalog()
    .map(
      (r) =>
        `- **${r.short_flag}** / \`${r.id}\` — ${r.title} (${r.seniority}): ${r.one_liner}\n  Aliases: ${r.aliases.slice(0, 6).join(", ")}${r.aliases.length > 6 ? ", …" : ""}\n  Owns: ${r.owns.join(", ")}\n  Does not own: ${r.does_not_own.join(", ")}`
    )
    .join("\n");
}

export function flagTable(): string {
  return ROLE_IDS.map(
    (id) => `| ${PRIMARY_SHORT_FLAGS[id]} | \`${id}\` |`
  ).join("\n");
}

export { resolveRoleId, PRIMARY_SHORT_FLAGS };
