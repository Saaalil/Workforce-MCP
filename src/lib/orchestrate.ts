import type { RoleId, RolePack } from "../types.js";
import { ROLE_IDS } from "../types.js";
import { PRIMARY_SHORT_FLAGS } from "../roles/aliases.js";
import { getPack, getPackByInput } from "../roles/loader.js";

export type DiscussFormat =
  | "scrum"
  | "critique"
  | "premortem"
  | "war_room"
  | "retro"
  | "design_review"
  | "postmortem_theater";

const WAR_ROOM_ROLES: RoleId[] = [
  "sre",
  "security",
  "backend",
  "ops",
  "monitoring",
  "qa",
];

/** Formats that always seat the full specialty roster (no subset). */
const FULL_CAST_FORMATS: DiscussFormat[] = ["postmortem_theater"];

function section(pack: RolePack, name: string): string {
  return pack.sections[name]?.trim() ?? "";
}

function firstBullets(text: string, limit: number): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*]\s+/, "").replace(/^\s*\d+[\).]\s+/, "").trim())
    .filter((l) => l.length > 20 && !l.startsWith("|") && !l.startsWith("#"));
  const out: string[] = [];
  for (const line of lines) {
    if (out.length >= limit) break;
    if (!out.includes(line)) out.push(line);
  }
  return out;
}

function resolveRoleList(
  rolesCsv: string | undefined,
  format: DiscussFormat
): RoleId[] {
  // Postmortem theater always includes every specialty — no casting cuts.
  if (FULL_CAST_FORMATS.includes(format)) {
    return [...ROLE_IDS];
  }
  if (rolesCsv?.trim()) {
    const parts = rolesCsv.split(/[,|\s]+/).map((s) => s.trim()).filter(Boolean);
    const ids: RoleId[] = [];
    for (const p of parts) {
      try {
        const id = getPackByInput(p).frontmatter.id;
        if (!ids.includes(id)) ids.push(id);
      } catch {
        /* skip unknown */
      }
    }
    if (ids.length) return ids;
  }
  if (format === "war_room") return [...WAR_ROOM_ROLES];
  return [...ROLE_IDS];
}

/**
 * Multi-specialty “meeting” brief — scrum / critique / premortem / war room.
 */
export function renderDiscussBrief(opts: {
  topic: string;
  format?: DiscussFormat;
  context?: string;
  roles?: string;
}): string {
  const format = opts.format ?? "scrum";
  const roleIds = resolveRoleList(opts.roles, format);
  const parts: string[] = [];

  const titles: Record<DiscussFormat, string> = {
    scrum: "Scrum / multi-specialty discussion",
    critique: "Critique board (adversarial POVs)",
    premortem: "Pre-mortem (imagine it failed)",
    war_room: "War room (reliability / security / delivery)",
    retro: "Retro (what worked / hurt / carry forward)",
    design_review: "Design review (craft critique before build)",
    postmortem_theater:
      "Postmortem theater (full cast — one corrective action each)",
  };

  parts.push(`# Workforce Discuss — ${titles[format]}`);
  parts.push("");
  parts.push(
    "> Not a hiring meeting. Specialties speak as **context lenses**. After this, pick one specialty to execute — do not implement everything at once."
  );
  parts.push("");
  parts.push(`**Topic:** ${opts.topic}`);
  if (opts.context) parts.push(`**Context:** ${opts.context}`);
  parts.push(`**Format:** \`${format}\``);
  parts.push(
    `**Voices:** ${roleIds.map((id) => PRIMARY_SHORT_FLAGS[id]).join(", ")}` +
      (FULL_CAST_FORMATS.includes(format)
        ? " _(full cast — every specialty)_"
        : "")
  );
  parts.push("");
  parts.push("## Facilitator rules");
  parts.push("");
  if (format === "postmortem_theater") {
    parts.push(
      "1. **Topic = the failure story** (what broke, when, blast radius, user impact)."
    );
    parts.push(
      "2. Every specialty speaks — no empty seats. Each owns **exactly one** corrective action (not a laundry list)."
    );
    parts.push(
      "3. Fill the **Corrective action board** (one row per flag). Then name the **first** `workforce/FLAG` to execute — usually highest-leverage / most urgent."
    );
    parts.push(
      "4. Blameless on people; ruthless on systems. If a specialty truly had zero involvement, still own a **prevention** or **detection** action in their craft."
    );
    parts.push(
      "5. High blast radius → Goal / Blocking questions (0–3 with defaults) / Assumptions / Plan — then stop."
    );
  } else {
    parts.push(
      "1. Synthesize each specialty’s POV below — challenges, risks, and asks."
    );
    parts.push(
      "2. End with **decisions needed**, **recommended sequence**, and the **first** `workforce/FLAG` to call."
    );
    parts.push(
      "3. Follow contractor intake if blast radius is high: Goal / Blocking questions (0–3 with defaults) / Assumptions / Plan — then stop."
    );
  }
  parts.push("");

  if (format === "premortem") {
    parts.push(
      "## Premortem frame: It is 90 days later and this failed. Each specialty explains how."
    );
    parts.push("");
  } else if (format === "critique") {
    parts.push(
      "## Critique frame: Each specialty tries to break the idea from their craft."
    );
    parts.push("");
  } else if (format === "war_room") {
    parts.push(
      "## War-room frame: Production is on fire or about to be — prioritize blast radius and recovery."
    );
    parts.push("");
  } else if (format === "retro") {
    parts.push(
      "## Retro frame: Looking back on the work/idea so far — keep, drop, and change from each craft."
    );
    parts.push("");
  } else if (format === "design_review") {
    parts.push(
      "## Design-review frame: Before build — each specialty reviews fitness, gaps, and must-fix notes."
    );
    parts.push("");
  } else if (format === "postmortem_theater") {
    parts.push(
      "## Postmortem theater frame: The failure already happened. Full cast on stage — each specialty owns **one** corrective action."
    );
    parts.push("");
    parts.push(
      "For each voice: (a) how this craft contributed or failed to catch it, (b) **one** named corrective action with acceptance, (c) when to invoke that specialty."
    );
    parts.push("");
  } else {
    parts.push(
      "## Scrum frame: Round-table — what each specialty would own, worry about, and need next."
    );
    parts.push("");
  }

  for (const id of roleIds) {
    const pack = getPack(id);
    const flag = PRIMARY_SHORT_FLAGS[id];
    const fm = pack.frontmatter;
    const challenges = firstBullets(section(pack, "Anti-patterns refused"), 3);
    const bars = firstBullets(section(pack, "Hard quality bars"), 2);
    const asks = pack.questions.slice(0, 2);

    parts.push(`### ${flag} — ${fm.title}`);
    parts.push("");
    parts.push(`**Stance:** ${fm.one_liner}`);
    parts.push(`**Owns:** ${fm.owns.join(", ")}`);
    parts.push("");
    if (format === "premortem") {
      parts.push("**How this fails from our POV:**");
    } else if (format === "critique") {
      parts.push("**Attack / challenge:**");
    } else if (format === "retro") {
      parts.push("**Keep / drop / change:**");
    } else if (format === "design_review") {
      parts.push("**Review notes (pass / gaps / must-fix):**");
    } else if (format === "postmortem_theater") {
      parts.push("**How our craft showed up in the failure** (miss, gap, or late catch):");
    } else {
      parts.push("**Challenges & risks:**");
    }
    parts.push("");
    for (const c of challenges) parts.push(`- ${c}`);
    if (format === "postmortem_theater") {
      parts.push("");
      parts.push(
        "**One corrective action we own** (title + acceptance — fill in; use quality bars as the bar):"
      );
      parts.push("");
      parts.push("- Action: …");
      parts.push("- Acceptance: …");
      parts.push("- Priority: P0 / P1 / P2");
    } else if (bars.length) {
      parts.push("");
      parts.push("**Quality bar reminders:**");
      parts.push("");
      for (const b of bars) parts.push(`- ${b}`);
    }
    if (format !== "postmortem_theater") {
      parts.push("");
      parts.push("**Would ask before owning a slice:**");
      parts.push("");
      asks.forEach((q, i) => parts.push(`${i + 1}. ${q}`));
    } else if (bars.length) {
      parts.push("");
      parts.push("**Quality bar reminders (for the action):**");
      parts.push("");
      for (const b of bars) parts.push(`- ${b}`);
    }
    parts.push("");
    parts.push(`**Invoke when ready:** \`workforce/${flag}\` or \`workforce_as\` role=\`${flag}\``);
    parts.push("");
  }

  if (format === "postmortem_theater") {
    parts.push("## Corrective action board (fill — one row per specialty)");
    parts.push("");
    parts.push(
      "| Flag | Corrective action (one) | Acceptance | Priority | Invoke |"
    );
    parts.push("|------|-------------------------|------------|----------|--------|");
    for (const id of roleIds) {
      const flag = PRIMARY_SHORT_FLAGS[id];
      parts.push(
        `| **${flag}** | … | … | P? | \`workforce/${flag}\` |`
      );
    }
    parts.push("");
    parts.push("## Synthesis");
    parts.push("");
    parts.push("- **Timeline / root causes (systems, not people):**");
    parts.push("- **What we will not do again:**");
    parts.push("- **Execution order for corrective actions:**");
    parts.push("- **First call now:** `workforce/…`");
  } else {
    parts.push("## Synthesis (fill this in)");
    parts.push("");
    parts.push("- **Agreements across specialties:**");
    parts.push("- **Conflicts / trade-offs to decide:**");
    parts.push("- **Out of scope for this slice:**");
    parts.push("- **Recommended specialty sequence:** (e.g. MGR→ARCH→UI→FE/BE→QA)");
    parts.push("- **First call now:** `workforce/…`");
  }
  parts.push("");
  parts.push("---");
  parts.push(
    "After synthesis, call `workforce_delegate` for a formal ownership plan, or `workforce_as` / `workforce/MGR` to stay in manager mode."
  );

  return parts.join("\n");
}

/**
 * Manager-style delegation plan: which specialty owns which slice.
 */
export function renderDelegateBrief(opts: {
  goal: string;
  context?: string;
  constraints?: string;
  roles?: string;
}): string {
  const roleIds = resolveRoleList(opts.roles, "scrum");
  const parts: string[] = [];

  parts.push("# Workforce Delegate — specialty ownership plan");
  parts.push("");
  parts.push(
    "> Manager orchestration: assign slices to specialties. Not hiring. Execute **one** specialty at a time after approval."
  );
  parts.push("");
  parts.push(`**Goal:** ${opts.goal}`);
  if (opts.context) parts.push(`**Context:** ${opts.context}`);
  if (opts.constraints) parts.push(`**Constraints:** ${opts.constraints}`);
  parts.push("");
  parts.push("## Instructions for the agent");
  parts.push("");
  parts.push(
    "Produce a concrete delegation table. Prefer a thin vertical slice. Mark specialties **N/A** if not needed this pass."
  );
  parts.push("");
  parts.push("For each relevant specialty include:");
  parts.push("");
  parts.push("1. **Slice** — what they own this pass");
  parts.push("2. **Acceptance** — falsifiable done-check");
  parts.push("3. **Depends on** — upstream specialty or artifact");
  parts.push("4. **Invoke** — `workforce/FLAG`");
  parts.push("5. **Order** — integer sequence");
  parts.push("");
  parts.push("## Specialty roster (use as menu)");
  parts.push("");
  parts.push("| Flag | Specialty | Owns (summary) |");
  parts.push("|------|-----------|----------------|");
  for (const id of roleIds) {
    const pack = getPack(id);
    const flag = PRIMARY_SHORT_FLAGS[id];
    parts.push(
      `| **${flag}** | ${pack.frontmatter.title} | ${pack.frontmatter.owns.slice(0, 3).join(", ")} |`
    );
  }
  parts.push("");
  parts.push("## Output template");
  parts.push("");
  parts.push("### Goal (restate + acceptance)");
  parts.push("");
  parts.push("### Blocking questions (0–3 with defaults) — or zero");
  parts.push("");
  parts.push("### Assumptions");
  parts.push("");
  parts.push("### Delegation plan");
  parts.push("");
  parts.push("| Order | Flag | Slice | Acceptance | Depends on | Invoke |");
  parts.push("|------:|------|-------|------------|------------|--------|");
  parts.push("| 1 | … | … | … | — | `workforce/…` |");
  parts.push("");
  parts.push("### First call");
  parts.push("");
  parts.push("Name the exact next prompt/tool, then **stop** until the user approves.");
  parts.push("");
  parts.push("---");
  parts.push(
    "Operate as **Manager (MGR)**. Do not silently become FE/BE/DE — delegate and sequence."
  );

  return parts.join("\n");
}
