import { ROLE_IDS, type RoleId } from "../types.js";

/**
 * Canonical role id → human-friendly aliases (short flags + full names).
 * Users/agents can say: workforce-DE, DE, data engineer, data_engineer, etc.
 */
export const ROLE_ALIASES: Record<RoleId, readonly string[]> = {
  architect: [
    "arch",
    "architect",
    "architecture",
    "sa",
    "software_architect",
    "system_architect",
  ],
  ui_designer: [
    "ui",
    "uid",
    "ux",
    "designer",
    "ui_designer",
    "ux_designer",
    "ui_design",
    "product_designer",
  ],
  frontend: [
    "fe",
    "frontend",
    "front_end",
    "front",
    "web_frontend",
    "react",
  ],
  backend: [
    "be",
    "backend",
    "back_end",
    "back",
    "api",
    "server",
  ],
  data_engineer: [
    "de",
    "data_engineer",
    "data_eng",
    "etl",
    "pipeline",
    "pipelines",
  ],
  data_scientist: [
    "ds",
    "data_scientist",
    "scientist",
    "analytics",
  ],
  ml_engineer: [
    "ml",
    "mle",
    "ml_engineer",
    "mlops",
    "model_engineer",
  ],
  ai_engineer: [
    "ai",
    "aie",
    "ai_engineer",
    "llm",
    "rag",
    "agents",
  ],
  ops: [
    "ops",
    "devops",
    "platform",
    "platform_eng",
    "platform_engineer",
    "infra",
    "infrastructure",
    "doe",
  ],
  sre: [
    "sre",
    "site_reliability",
    "site_reliability_engineer",
    "reliability",
  ],
  monitoring: [
    "mon",
    "monitoring",
    "observability",
    "o11y",
    "telemetry",
  ],
  security: [
    "sec",
    "security",
    "appsec",
    "infosec",
    "cyber",
  ],
  qa: [
    "qa",
    "qe",
    "quality",
    "test",
    "testing",
    "sdet",
  ],
  manager: [
    "mgr",
    "manager",
    "em",
    "eng_manager",
    "engineering_manager",
    "delivery",
    "delivery_lead",
    "pm_eng",
    "scrum_master",
    "delegate",
  ],
};

/** Prefer these short flags in catalog / docs */
export const PRIMARY_SHORT_FLAGS: Record<RoleId, string> = {
  architect: "ARCH",
  ui_designer: "UI",
  frontend: "FE",
  backend: "BE",
  data_engineer: "DE",
  data_scientist: "DS",
  ml_engineer: "ML",
  ai_engineer: "AI",
  ops: "OPS",
  sre: "SRE",
  monitoring: "MON",
  security: "SEC",
  qa: "QA",
  manager: "MGR",
};

function normalizeRoleToken(raw: string): string {
  let s = raw.trim().toLowerCase();
  // Strip common prefixes: workforce-DE, workforce_ui_designer, workforce/DE
  s = s.replace(/^workforce[\s_/-]+/, "");
  s = s.replace(/[\s-]+/g, "_");
  s = s.replace(/_+/g, "_");
  return s;
}

const ALIAS_INDEX: Map<string, RoleId> = (() => {
  const map = new Map<string, RoleId>();
  for (const id of ROLE_IDS) {
    map.set(id, id);
    map.set(PRIMARY_SHORT_FLAGS[id].toLowerCase(), id);
    for (const alias of ROLE_ALIASES[id]) {
      map.set(normalizeRoleToken(alias), id);
    }
  }
  return map;
})();

export function resolveRoleId(input: string): RoleId | null {
  const key = normalizeRoleToken(input);
  return ALIAS_INDEX.get(key) ?? null;
}

export function requireRoleId(input: string): RoleId {
  const id = resolveRoleId(input);
  if (!id) {
    const known = ROLE_IDS.map(
      (r) => `${PRIMARY_SHORT_FLAGS[r]}|${r}`
    ).join(", ");
    throw new Error(
      `Unknown Workforce role "${input}". Use a short flag or full id: ${known}`
    );
  }
  return id;
}

export function aliasesFor(id: RoleId): string[] {
  return [...ROLE_ALIASES[id]];
}

export function allAliasTokens(): string[] {
  return [...ALIAS_INDEX.keys()].sort();
}

/** Zod-friendly description listing short + full */
export function roleArgDescription(): string {
  return (
    "Specialist context to load — short flag or full id. Examples: DE, UI, FE, BE, DS, ML, AI, ARCH, OPS, SRE, MON, SEC, QA, MGR " +
    "or data_engineer, ui_designer, frontend, backend, ops, sre, monitoring, security, qa, manager. " +
    "Also accepts workforce-DE / workforce/UI / workforce/MGR style strings. This loads agent context for the work — it does not hire people."
  );
}
