import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ROLE_IDS } from "../src/types.ts";
import {
  clearPackCache,
  getPack,
  getPackByInput,
  getConstitution,
} from "../src/roles/loader.ts";
import { resolveRoleId, PRIMARY_SHORT_FLAGS } from "../src/roles/aliases.ts";
import {
  renderConsultBrief,
  renderHandoffBrief,
  renderSpecialistBrief,
} from "../src/lib/render-brief.ts";
import {
  renderDelegateBrief,
  renderDiscussBrief,
  renderPodBrief,
} from "../src/lib/orchestrate.ts";
import { resolvePodId, listPods } from "../src/pods/registry.ts";

process.chdir(join(dirname(fileURLToPath(import.meta.url)), ".."));
clearPackCache();

let failed = false;
function fail(msg: string): void {
  console.error(`FAIL: ${msg}`);
  failed = true;
}
function ok(msg: string): void {
  console.log(`OK: ${msg}`);
}

const constitution = getConstitution();
if (!constitution.includes("Before implementing") || !constitution.includes("Blocking questions")) {
  fail("Constitution must include contractor Before implementing protocol");
} else {
  ok("Constitution: contractor intake protocol");
}

const distinctive: Record<string, string[]> = {
  architect: ["SLO", "one-way"],
  ui_designer: ["WCAG", "metric"],
  frontend: ["RSC", "LCP"],
  backend: ["Idempotency", "OpenAPI"],
  data_engineer: ["dbt", "SLA"],
  data_scientist: ["estimand", "MDE"],
  ml_engineer: ["Feast", "champion"],
  ai_engineer: ["eval", "LangGraph"],
  ops: ["CI/CD", "Terraform"],
  sre: ["error budget", "SLO"],
  monitoring: ["OpenTelemetry", "cardinality"],
  security: ["threat", "OIDC"],
  qa: ["Playwright", "P0"],
  manager: ["delegat", "handoff", "specialty"],
};

for (const id of ROLE_IDS) {
  const pack = getPack(id);
  const brief = renderSpecialistBrief({
    pack,
    task: `Smoke test work for ${id}`,
    mode: "ask",
  });

  if (!brief.includes("Required response format (before implementing)")) {
    fail(`${id}: ask mode missing contractor intake format`);
  }
  if (!brief.includes("**Goal.**") || !brief.includes("**Plan.**")) {
    fail(`${id}: ask brief missing Goal/Plan framing`);
  }
  if (!brief.includes("Before implementing")) {
    fail(`${id}: constitution missing Before implementing`);
  }
  if (brief.includes("Ask the user these questions NOW")) {
    fail(`${id}: still uses old dump-questions framing`);
  }
  if (/\bhiring\b|\brecruit/i.test(brief) || brief.includes("Workforce Hire:")) {
    fail(`${id}: brief still contains hiring language`);
  }
  for (const needle of distinctive[id] ?? []) {
    if (!brief.toLowerCase().includes(needle.toLowerCase())) {
      fail(`${id}: brief missing distinctive signal "${needle}"`);
    }
  }
  ok(`specialize ${id}`);
}

const aliasCases: Array<[string, string]> = [
  ["DE", "data_engineer"],
  ["workforce-DE", "data_engineer"],
  ["workforce-UI designer", "ui_designer"],
  ["UI", "ui_designer"],
  ["SRE", "sre"],
  ["OPS", "ops"],
  ["MON", "monitoring"],
];

for (const [input, expected] of aliasCases) {
  const resolved = resolveRoleId(input);
  if (resolved !== expected) {
    fail(`alias "${input}" → ${resolved}, expected ${expected}`);
  } else {
    ok(`alias ${input} → ${expected}`);
  }
}

const deBrief = renderSpecialistBrief({
  pack: getPackByInput("workforce-DE"),
  task: "Build dbt gold mart for orders",
  mode: "ask",
});
if (!deBrief.includes("Data Engineer") || !deBrief.includes("Specialist Context")) {
  fail("workforce-DE did not load specialist context pack");
} else {
  ok("workforce-DE specialist context");
}

const handoff = renderHandoffBrief({
  from: getPackByInput("ARCH"),
  to: getPackByInput("FE"),
  task: "Implement web app",
  findings: "Modular monolith",
});
if (!handoff.includes("Context Switch") || !handoff.includes("Frontend")) {
  fail("ARCH→FE context switch failed");
} else {
  ok("context switch ARCH → FE");
}

const consult = renderConsultBrief({
  pack: getPackByInput("MON"),
  situation: "Noisy alerts",
});
if (!consult.includes("quality bars")) {
  fail("consult MON missing quality bars");
} else {
  ok("consult MON");
}

const discuss = renderDiscussBrief({
  topic: "Add checkout express pay",
  format: "scrum",
  roles: "UI,FE,BE,SEC,QA",
});
if (!discuss.includes("Workforce Discuss") || !discuss.includes("### UI")) {
  fail("discuss scrum missing specialty voices");
} else {
  ok("discuss scrum");
}

const theater = renderDiscussBrief({
  topic: "Checkout 500s after deploy — payments partial charge",
  format: "postmortem_theater",
  roles: "UI,FE", // must be ignored — full cast
});
const theaterFlags = [
  "### ARCH",
  "### UI",
  "### FE",
  "### BE",
  "### DE",
  "### DS",
  "### ML",
  "### AI",
  "### OPS",
  "### SRE",
  "### MON",
  "### SEC",
  "### QA",
  "### MGR",
];
const theaterMissing = theaterFlags.filter((h) => !theater.includes(h));
if (
  theaterMissing.length ||
  !theater.includes("Corrective action board") ||
  !theater.includes("full cast")
) {
  fail(
    `postmortem_theater incomplete: missing=${theaterMissing.join(",") || "none"}`
  );
} else {
  ok("discuss postmortem_theater full cast");
}

const delegate = renderDelegateBrief({
  goal: "Ship express checkout",
  roles: "MGR,UI,FE,BE,QA",
});
if (!delegate.includes("Delegation") || !delegate.includes("workforce/")) {
  fail("delegate brief incomplete");
} else {
  ok("delegate plan");
}

if (!resolvePodId("WEB") || resolvePodId("WEB") !== "web") {
  fail("pod WEB resolve failed");
} else {
  ok("pod resolve WEB");
}
if (resolvePodId("AI") !== null) {
  fail("specialty AI must not resolve as a pod (use AIP)");
} else {
  ok("pod AI collision avoided");
}
const webPod = renderPodBrief({
  pod: "web",
  goal: "Ship marketing landing + API",
});
if (
  !webPod.includes("Workforce Pod") ||
  !webPod.includes("### UI") ||
  !webPod.includes("### FE") ||
  !webPod.includes("### BE") ||
  !webPod.includes("Pod delegation table")
) {
  fail("web pod brief incomplete");
} else {
  ok("pod WEB brief");
}
const aip = renderPodBrief({ pod: "AIP", goal: "Ship RAG checkout help" });
if (!aip.includes("### AI") || !aip.includes("### DE") || !aip.includes("AIP")) {
  fail("AIP pod brief incomplete");
} else {
  ok("pod AIP brief");
}
if (listPods().length < 5) {
  fail("expected at least 5 pods");
} else {
  ok(`pods catalog n=${listPods().length}`);
}

// Frontmatter parser (no gray-matter / js-yaml)
import { parseFrontmatter } from "../src/lib/frontmatter.ts";
const fm = parseFrontmatter(`---
id: test_role
title: Test
seniority: staff
one_liner: hello
owns:
  - a
  - b
does_not_own:
  - c
---
# Body
`);
if (
  fm.data.id !== "test_role" ||
  !Array.isArray(fm.data.owns) ||
  (fm.data.owns as string[])[0] !== "a" ||
  !fm.content.includes("# Body")
) {
  fail("frontmatter parser failed");
} else {
  ok("safe frontmatter parser");
}

for (const id of ROLE_IDS) {
  if (!PRIMARY_SHORT_FLAGS[id]) fail(`missing short flag for ${id}`);
}

if (failed) {
  console.error("\nSmoke tests failed.");
  process.exit(1);
}
console.log("\nAll smoke tests passed.");
