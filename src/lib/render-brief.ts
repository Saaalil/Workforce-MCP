import type { WorkMode, RolePack } from "../types.js";
import { getConstitution } from "../roles/loader.js";
import { PRIMARY_SHORT_FLAGS } from "../roles/aliases.js";

function pickQuestions(pack: RolePack, task: string, limit = 8): string[] {
  const taskLower = task.toLowerCase();
  const keywords = taskLower
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
  const scored = pack.questions.map((q) => {
    const ql = q.toLowerCase();
    const score = keywords.reduce(
      (acc, kw) => acc + (ql.includes(kw) ? 1 : 0),
      0
    );
    return { q, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, limit).map((s) => s.q);
  if (scored.every((s) => s.score === 0)) {
    return pack.questions.slice(0, limit);
  }
  return selected;
}

function sectionOrEmpty(pack: RolePack, name: string): string {
  return pack.sections[name]?.trim() ?? "";
}

/**
 * Full specialist context pack for the agent — NOT a hiring flow.
 * Loads identity, discovery questions, stack, quality bars, and handoffs
 * so the agent can perform that specialty of work at full potential.
 */
export function renderSpecialistBrief(opts: {
  pack: RolePack;
  task: string;
  context?: string;
  constraints?: string;
  mode: WorkMode;
}): string {
  const { pack, task, context, constraints, mode } = opts;
  const fm = pack.frontmatter;
  const flag = PRIMARY_SHORT_FLAGS[fm.id];
  const questions = pickQuestions(pack, task);
  const constitution = getConstitution();

  const parts: string[] = [];

  parts.push(`# Workforce Specialist Context: ${fm.title} (${flag})`);
  parts.push("");
  parts.push(
    "> This is **not** a hiring flow. You are loading specialist context so the agent can do this work with full production-grade judgment, skills, and process."
  );
  parts.push("");
  parts.push(`**Specialist:** \`${fm.id}\` / flag \`${flag}\`  `);
  parts.push(`**Seniority lens:** ${fm.seniority}  `);
  parts.push(`**Stance:** ${fm.one_liner}`);
  parts.push("");
  parts.push(`**This specialty owns:** ${fm.owns.join(", ")}`);
  parts.push(`**This specialty does NOT own:** ${fm.does_not_own.join(", ")}`);
  parts.push("");
  parts.push(`**Work to do:** ${task}`);
  if (context) parts.push(`**Project context:** ${context}`);
  if (constraints) parts.push(`**Constraints:** ${constraints}`);
  parts.push(`**Mode:** \`${mode}\``);
  parts.push("");

  parts.push("## Operating Constitution");
  parts.push("");
  parts.push(constitution);
  parts.push("");

  parts.push("## Identity / stance");
  parts.push("");
  parts.push(sectionOrEmpty(pack, "Identity / stance"));
  parts.push("");

  if (mode === "ask" || mode === "plan") {
    parts.push("## Required response format (before implementing)");
    parts.push("");
    parts.push(
      "After a quick investigate of the repo, reply with **exactly** this structure and then **stop** — do not implement yet (unless proportionality says the change is trivial: typo/rename/~20 lines with one obvious fix)."
    );
    parts.push("");
    parts.push("**Goal.** Restate the work and acceptance criteria in your own words.");
    parts.push("");
    parts.push(
      "**Blocking questions (0–3).** Only if a wrong answer throws work away. Each question must include your recommended default. If none, say zero."
    );
    parts.push("");
    parts.push(
      "**Assumptions.** Numbered, specific, falsifiable (data / failure / boundaries / state / environment / scope / testing as relevant)."
    );
    parts.push("");
    parts.push(
      "**Plan.** Files to create/modify, key signatures, order of work; name rejected alternatives in one clause each."
    );
    parts.push("");
    parts.push("Then wait for approval.");
    parts.push("");
    if (mode === "plan") {
      parts.push(
        "You are in `plan` mode: make the Plan section concrete and complete; still do not implement until approved."
      );
      parts.push("");
    }
    parts.push("### Specialty discovery lens (optional — for blocking Qs / assumptions only)");
    parts.push("");
    parts.push(
      "Do **not** ask all of these. Investigate first. Promote at most 0–3 into Blocking questions (with defaults) if they would throw work away; otherwise fold into Assumptions."
    );
    parts.push("");
    questions.forEach((q, i) => parts.push(`${i + 1}. ${q}`));
    parts.push("");
    parts.push("## Specialty workflow checklist (for the Plan)");
  } else {
    parts.push("## Execute mode (approved)");
    parts.push("");
    parts.push(
      "Treat this as **after approval**: implement the agreed plan. If an assumption fails mid-flight, stop and report — do not quietly change the design."
    );
    parts.push("");
    parts.push(
      "State any remaining assumptions explicitly. Prefer reversible decisions. Still refuse one-way doors without constraints."
    );
    parts.push("");
    parts.push("### Assumption reminders from this specialty");
    parts.push("");
    questions.forEach((q, i) => parts.push(`${i + 1}. ${q}`));
    parts.push("");
    parts.push("## Specialty workflow checklist");
  }

  parts.push("");
  parts.push(sectionOrEmpty(pack, "Workflow phases + concrete deliverables"));
  parts.push("");

  parts.push("## Stack defaults for this work");
  parts.push("");
  parts.push(sectionOrEmpty(pack, "2025–2026 skill stack defaults"));
  parts.push("");

  parts.push("## Hard quality bars");
  parts.push("");
  parts.push(sectionOrEmpty(pack, "Hard quality bars"));
  parts.push("");

  parts.push("## Anti-patterns refused");
  parts.push("");
  parts.push(sectionOrEmpty(pack, "Anti-patterns refused"));
  parts.push("");

  parts.push("## Decision frameworks");
  parts.push("");
  parts.push(sectionOrEmpty(pack, "Decision frameworks"));
  parts.push("");

  parts.push("## Suggested specialty switches");
  parts.push("");
  parts.push(
    "If the work needs a different specialty, call `workforce_handoff` (or `workforce_as` for the new flag) instead of silently switching context."
  );
  parts.push("");
  parts.push(sectionOrEmpty(pack, "Handoff protocols"));
  parts.push("");

  parts.push("---");
  parts.push(
    `Operate as **${fm.title} (${flag})** with the full context above. Stay in this specialty. Default: investigate → Goal / Blocking questions / Assumptions / Plan → stop until approved (unless the change is trivially proportional).`
  );

  return parts.join("\n");
}

/** @deprecated Use renderSpecialistBrief */
export const renderHireBrief = renderSpecialistBrief;

export function renderConsultBrief(opts: {
  pack: RolePack;
  situation: string;
  goal?: string;
}): string {
  const { pack, situation, goal } = opts;
  const fm = pack.frontmatter;
  const flag = PRIMARY_SHORT_FLAGS[fm.id];
  return [
    `# Workforce Consult (specialist context): ${fm.title} (${flag})`,
    "",
    "> Mid-work check against this specialty's quality bars — not a hiring step.",
    "",
    `**Situation:** ${situation}`,
    goal ? `**Goal:** ${goal}` : "",
    "",
    "## Identity reminder",
    "",
    sectionOrEmpty(pack, "Identity / stance"),
    "",
    "## Apply these quality bars",
    "",
    sectionOrEmpty(pack, "Hard quality bars"),
    "",
    "## Check against anti-patterns",
    "",
    sectionOrEmpty(pack, "Anti-patterns refused"),
    "",
    "## Decision frameworks to use",
    "",
    sectionOrEmpty(pack, "Decision frameworks"),
    "",
    "## Relevant discovery questions (if still unanswered)",
    "",
    ...pack.questions.slice(0, 6).map((q, i) => `${i + 1}. ${q}`),
    "",
    "## Response format",
    "",
    "1. If advice depends on unknown one-way-door facts: at most 3 blocking questions with defaults; otherwise zero.",
    "2. Give concrete advice tied to quality bars (state assumptions).",
    "3. List next artifacts / checklist items — or a mini Plan if work should continue under contractor intake.",
    "4. Name any specialty switch needed (`workforce_as` / `workforce_handoff`).",
  ]
    .filter(Boolean)
    .join("\n");
}

export function renderHandoffBrief(opts: {
  from: RolePack;
  to: RolePack;
  task: string;
  findings?: string;
  artifacts?: string;
}): string {
  const { from, to, task, findings, artifacts } = opts;
  const fromFlag = PRIMARY_SHORT_FLAGS[from.frontmatter.id];
  const toFlag = PRIMARY_SHORT_FLAGS[to.frontmatter.id];
  return [
    `# Workforce Context Switch: ${from.frontmatter.title} (${fromFlag}) → ${to.frontmatter.title} (${toFlag})`,
    "",
    "> Switching specialist context for the next slice of work — not a personnel handoff.",
    "",
    `**Work:** ${task}`,
    findings
      ? `**Findings from ${from.frontmatter.title}:**\n${findings}`
      : "",
    artifacts ? `**Artifacts to carry forward:**\n${artifacts}` : "",
    "",
    `## Outgoing specialty (${from.frontmatter.title}) notes`,
    "",
    sectionOrEmpty(from, "Handoff protocols"),
    "",
    `## Incoming specialty: ${to.frontmatter.title} (${toFlag})`,
    "",
    `**Owns:** ${to.frontmatter.owns.join(", ")}`,
    `**Does not own:** ${to.frontmatter.does_not_own.join(", ")}`,
    "",
    sectionOrEmpty(to, "Identity / stance"),
    "",
    "## Incoming specialty — before implementing",
    "",
    "Investigate the repo, then produce **Goal / Blocking questions (0–3 with defaults) / Assumptions / Plan** and **stop** until approved (unless proportionality says just do it). Use the questions below only as a lens — do not dump them all.",
    "",
    ...to.questions.slice(0, 8).map((q, i) => `${i + 1}. ${q}`),
    "",
    "## Incoming workflow",
    "",
    sectionOrEmpty(to, "Workflow phases + concrete deliverables"),
    "",
    "## Incoming quality bars",
    "",
    sectionOrEmpty(to, "Hard quality bars"),
    "",
    "---",
    `Operate as **${to.frontmatter.title} (${toFlag})** now. Do not continue under ${from.frontmatter.title} context.`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}
