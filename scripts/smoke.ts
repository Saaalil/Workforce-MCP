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
} from "../src/lib/orchestrate.ts";

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
if (!constitution.includes("not** a hiring") && !constitution.includes("not a hiring")) {
  fail("Constitution must clarify this is not hiring");
} else {
  ok("Constitution: not-hiring framing");
}
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

  if (!brief.includes("not** a hiring") && !brief.includes("not a hiring")) {
    fail(`${id}: brief missing not-hiring framing`);
  }
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
  if (brief.includes("Workforce Hire:")) {
    fail(`${id}: still uses Hire branding`);
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

for (const id of ROLE_IDS) {
  if (!PRIMARY_SHORT_FLAGS[id]) fail(`missing short flag for ${id}`);
}

if (failed) {
  console.error("\nSmoke tests failed.");
  process.exit(1);
}
console.log("\nAll smoke tests passed.");
