import type { RoleId } from "../types.js";

export type PodId = "web" | "dp" | "aip" | "plat" | "ship";

export interface WorkforcePod {
  id: PodId;
  /** Short flag shown in catalogs (WEB, DP, …) */
  flag: string;
  title: string;
  one_liner: string;
  /** Specialty members in recommended discuss order */
  members: RoleId[];
  /** Default execution sequence (flags), human-readable */
  default_sequence: string;
  /** When to pick this pod */
  when: string;
  /** Prompt / alias tokens (without workforce/ prefix) */
  aliases: string[];
}

/**
 * Pods = roster presets. Not craft specialties.
 * Never reuse a single-specialty primary flag (AI, UI, DE, …) as a pod id.
 */
export const PODS: Record<PodId, WorkforcePod> = {
  web: {
    id: "web",
    flag: "WEB",
    title: "Web product pod",
    one_liner:
      "UI + FE + BE — design and ship a user-facing surface with API contracts, one specialty at a time",
    members: ["ui_designer", "frontend", "backend"],
    default_sequence: "UI → FE + BE (after UI handoff) → optional QA later",
    when: "Landing pages, app UI, CRUD products, marketing + API-backed flows",
    aliases: ["web", "WEB", "web_pod", "fullstack_web", "product_web"],
  },
  dp: {
    id: "dp",
    flag: "DP",
    title: "Data product pod",
    one_liner:
      "DE + DS — governed pipelines meet decision rigor (metrics, experiments, specs)",
    members: ["data_scientist", "data_engineer"],
    default_sequence: "DS (estimand/metric) → DE (contracts/pipelines) — or DE first if warehouse already framed",
    when: "Marts, SLAs, experiment specs, analytics products, decision metrics",
    aliases: ["dp", "DP", "data", "data_pod", "data_product"],
  },
  aip: {
    id: "aip",
    flag: "AIP",
    title: "Intelligence pod",
    one_liner:
      "AI + ML + DS + DE — LLM/agent/RAG or model lifecycle with data + eval discipline (not workforce/AI alone)",
    members: ["data_scientist", "data_engineer", "ml_engineer", "ai_engineer"],
    default_sequence: "DS → DE → AI or ML (pick one path) → evals before widen",
    when: "RAG, agents, ranking models, feature pipelines tied to model/LLM products",
    aliases: [
      "aip",
      "AIP",
      "ai_pod",
      "intelligence",
      "ml_stack",
      "llm_stack",
      "ai_stack",
    ],
  },
  plat: {
    id: "plat",
    flag: "PLAT",
    title: "Platform / reliability pod",
    one_liner:
      "OPS + SRE + MON — deliver, operate, and explain the system in production",
    members: ["ops", "sre", "monitoring"],
    default_sequence: "OPS (path to prod) → SRE (SLOs) → MON (telemetry/alerts)",
    when: "CI/CD, environments, SLOs, incidents, observability baselines",
    aliases: ["plat", "PLAT", "platform", "platform_pod", "reliability_pod"],
  },
  ship: {
    id: "ship",
    flag: "SHIP",
    title: "Ship / release gate pod",
    one_liner:
      "SEC + BE + FE + QA — harden and gate a release without skipping authz or critical journeys",
    members: ["security", "backend", "frontend", "qa"],
    default_sequence: "SEC (threat pass) → BE/FE fixes → QA release gate",
    when: "Pre-prod hardening, auth/money paths, release candidates",
    aliases: ["ship", "SHIP", "release", "release_pod", "gate"],
  },
};

export const POD_IDS = Object.keys(PODS) as PodId[];

const POD_ALIAS_INDEX: Map<string, PodId> = (() => {
  const map = new Map<string, PodId>();
  for (const id of POD_IDS) {
    const pod = PODS[id];
    const tokens = new Set(
      [pod.id, pod.flag, pod.flag.toLowerCase(), ...pod.aliases].map((t) =>
        t.toLowerCase().replace(/[\s-]+/g, "_")
      )
    );
    for (const t of tokens) map.set(t, id);
  }
  return map;
})();

export function normalizePodToken(raw: string): string {
  let s = raw.trim().toLowerCase();
  s = s.replace(/^workforce[\s_/-]+/, "");
  s = s.replace(/[\s-]+/g, "_");
  return s.replace(/_+/g, "_");
}

export function resolvePodId(input: string): PodId | null {
  return POD_ALIAS_INDEX.get(normalizePodToken(input)) ?? null;
}

export function requirePodId(input: string): PodId {
  const id = resolvePodId(input);
  if (!id) {
    const known = POD_IDS.map((p) => `${PODS[p].flag}|${p}`).join(", ");
    throw new Error(
      `Unknown Workforce pod "${input}". Use: ${known}. Note: AI is a specialty; the intelligence pod is AIP.`
    );
  }
  return id;
}

export function listPods() {
  return POD_IDS.map((id) => {
    const p = PODS[id];
    return {
      id: p.id,
      flag: p.flag,
      title: p.title,
      one_liner: p.one_liner,
      members: p.members,
      default_sequence: p.default_sequence,
      when: p.when,
      aliases: p.aliases,
      invoke: `workforce/${p.flag}`,
    };
  });
}
