import { ROLE_IDS, REQUIRED_SECTIONS } from "../src/types.ts";
import {
  ROLE_ALIASES,
  PRIMARY_SHORT_FLAGS,
  resolveRoleId,
  allAliasTokens,
} from "../src/roles/aliases.ts";
import {
  clearPackCache,
  getPack,
  loadAllPacks,
} from "../src/roles/loader.ts";
import { createWorkforceServer } from "../src/server.ts";

clearPackCache();
loadAllPacks(true);

let failed = 0;
const fail = (m: string) => {
  console.error("FAIL:", m);
  failed++;
};
const ok = (m: string) => console.log("OK:", m);

// 1. Alias collisions
const seen = new Map<string, string>();
for (const id of ROLE_IDS) {
  const tokens = new Set([
    id,
    PRIMARY_SHORT_FLAGS[id].toLowerCase(),
    ...ROLE_ALIASES[id].map((a) =>
      a.toLowerCase().replace(/[\s-]+/g, "_")
    ),
  ]);
  for (const t of tokens) {
    if (seen.has(t) && seen.get(t) !== id) {
      fail(`alias collision: '${t}' -> ${seen.get(t)} and ${id}`);
    } else {
      seen.set(t, id);
    }
  }
}
ok(`alias index size=${allAliasTokens().length}, no collisions`);

// 2. Every short flag + slash/hyphen form resolves
for (const id of ROLE_IDS) {
  const flag = PRIMARY_SHORT_FLAGS[id];
  for (const input of [
    flag,
    id,
    `workforce/${flag}`,
    `workforce-${flag}`,
    `workforce/${id}`,
    `workforce-${id}`,
  ]) {
    const r = resolveRoleId(input);
    if (r !== id) fail(`resolve '${input}' -> ${r}, expected ${id}`);
  }
}
ok("all flags/ids/workforce slash+hyphen forms resolve");

// 3. Pack depth metrics
console.log("\n--- Pack depth ---");
for (const id of ROLE_IDS) {
  const p = getPack(id);
  const missing = REQUIRED_SECTIONS.filter(
    (s) => !p.sections[s] || p.sections[s].length < 40
  );
  const q = p.questions.length;
  const bodyLen = p.body.length;
  const handoff = p.sections["Handoff protocols"]?.length ?? 0;
  const bars = p.sections["Hard quality bars"]?.length ?? 0;
  if (missing.length) fail(`${id} missing sections: ${missing.join(", ")}`);
  if (q < 8) fail(`${id} only ${q} questions`);
  if (bodyLen < 1500) fail(`${id} body thin: ${bodyLen} chars`);
  console.log(
    `${PRIMARY_SHORT_FLAGS[id].padEnd(4)} ${id.padEnd(16)} q=${String(q).padStart(2)} body=${String(bodyLen).padStart(5)} bars=${String(bars).padStart(4)} handoff=${String(handoff).padStart(4)} owns=${p.frontmatter.owns.length} not=${p.frontmatter.does_not_own.length}`
  );
}

// 4. Prompt naming (mirror server.ts)
const registeredPrompts = new Set<string>();
const promptsByRole: Record<string, string[]> = {};
for (const id of ROLE_IDS) {
  const flag = PRIMARY_SHORT_FLAGS[id];
  const promptNames = [
    `workforce/${id}`,
    `workforce/${flag}`,
    `workforce/${flag.toLowerCase()}`,
  ];
  for (const alias of ROLE_ALIASES[id]) {
    if (alias === id) continue;
    if (alias.length <= 3 || alias.includes("_")) {
      promptNames.push(`workforce/${alias}`);
    }
  }
  promptsByRole[id] = [];
  for (const name of promptNames) {
    const key = name.toLowerCase();
    if (registeredPrompts.has(key)) continue;
    registeredPrompts.add(key);
    promptsByRole[id].push(name);
  }
}

// Orchestration + pod prompts (mirror server.ts)
import { POD_IDS, PODS } from "../src/pods/registry.ts";
for (const name of [
  "workforce/discuss",
  "workforce/scrum",
  "workforce/delegate",
  "workforce/plan_work",
  "workforce/postmortem",
  "workforce/postmortem_theater",
] as const) {
  registeredPrompts.add(name.toLowerCase());
}
for (const podId of POD_IDS) {
  const pod = PODS[podId];
  for (const a of [pod.flag, pod.id, ...pod.aliases]) {
    registeredPrompts.add(`workforce/${a}`.toLowerCase());
  }
}

console.log("\n--- Prompt registration ---");
console.log("total unique prompts:", registeredPrompts.size);
for (const id of ROLE_IDS) {
  const names = promptsByRole[id];
  const hasFlag = names.some(
    (n) =>
      n.toLowerCase() ===
      `workforce/${PRIMARY_SHORT_FLAGS[id].toLowerCase()}`
  );
  if (!hasFlag) fail(`${id} missing workforce/${PRIMARY_SHORT_FLAGS[id]} prompt`);
  console.log(
    `${PRIMARY_SHORT_FLAGS[id].padEnd(4)} ${names.length} prompts: ${names.slice(0, 8).join(", ")}${names.length > 8 ? "…" : ""}`
  );
}

const mustHave = [
  "workforce/UI",
  "workforce/FE",
  "workforce/DE",
  "workforce/SRE",
  "workforce/ARCH",
  "workforce/ops",
  "workforce/qa",
  "workforce/ai_engineer",
  "workforce/monitoring",
  "workforce/backend",
  "workforce/frontend",
  "workforce/security",
  "workforce/MGR",
  "workforce/discuss",
  "workforce/postmortem",
  "workforce/WEB",
  "workforce/DP",
  "workforce/AIP",
];
for (const p of mustHave) {
  if (!registeredPrompts.has(p.toLowerCase())) fail(`missing critical prompt ${p}`);
}
ok("critical Cursor prompts present");

createWorkforceServer();
ok("createWorkforceServer() boots");

const ambiguous = [
  "react",
  "server",
  "test",
  "front",
  "back",
  "designer",
  "scientist",
  "pipeline",
  "agents",
  "quality",
  "devops",
  "o11y",
  "rag",
];
console.log("\n--- Ambiguous / convenience alias resolution ---");
for (const a of ambiguous) {
  console.log(`  ${a} -> ${resolveRoleId(a)}`);
}

// Spot-check brief content for hire language / empty sections
import { renderSpecialistBrief } from "../src/lib/render-brief.ts";
for (const id of ROLE_IDS) {
  const brief = renderSpecialistBrief({
    pack: getPack(id),
    task: `Verify ${id} specialty context depth`,
    mode: "execute",
  });
  if (/hire a|hiring people|recruit/i.test(brief) && !/not.*hir/i.test(brief)) {
    fail(`${id} brief may still sound like hiring`);
  }
  if (brief.length < 3000) fail(`${id} execute brief thin: ${brief.length}`);
  for (const heading of [
    "## Identity / stance",
    "## Stack defaults for this work",
    "## Hard quality bars",
    "## Anti-patterns refused",
    "## Decision frameworks",
    "## Suggested specialty switches",
    "## Before implementing",
  ]) {
    if (!brief.includes(heading)) fail(`${id} brief missing ${heading}`);
  }
}
ok("all execute briefs have required specialist sections");

// Ask-mode briefs must use contractor intake framing
for (const id of ROLE_IDS) {
  const askBrief = renderSpecialistBrief({
    pack: getPack(id),
    task: `Verify ${id} intake framing`,
    mode: "ask",
  });
  if (!askBrief.includes("Required response format (before implementing)")) {
    fail(`${id} ask brief missing contractor response format`);
  }
  if (askBrief.includes("Ask the user these questions NOW")) {
    fail(`${id} ask brief still dumps old question list framing`);
  }
}
ok("all ask briefs use contractor Goal/Plan intake");

if (failed) {
  console.error("\nDeep audit FAILED:", failed);
  process.exit(1);
}
console.log("\nDeep audit PASSED");
