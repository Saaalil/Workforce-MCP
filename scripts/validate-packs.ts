import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import {
  ROLE_IDS,
  RolePackFrontmatterSchema,
  type RoleId,
} from "../src/types.ts";
import {
  extractQuestions,
  parseSections,
  validatePackStructure,
} from "../src/lib/pack-schema.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packsDir = join(root, "src", "roles", "packs");

let failed = false;

function fail(msg: string): void {
  console.error(`FAIL: ${msg}`);
  failed = true;
}

function ok(msg: string): void {
  console.log(`OK: ${msg}`);
}

const files = readdirSync(packsDir).filter((f) => f.endsWith(".md"));
const seen = new Set<RoleId>();

if (files.length !== ROLE_IDS.length) {
  fail(`Expected ${ROLE_IDS.length} packs, found ${files.length}`);
}

for (const file of files) {
  const raw = readFileSync(join(packsDir, file), "utf8");
  const { data, content } = matter(raw);
  let frontmatter;
  try {
    frontmatter = RolePackFrontmatterSchema.parse(data);
  } catch (e) {
    fail(`${file}: invalid frontmatter: ${e}`);
    continue;
  }

  if (seen.has(frontmatter.id)) {
    fail(`${file}: duplicate id ${frontmatter.id}`);
  }
  seen.add(frontmatter.id);

  if (file !== `${frontmatter.id}.md`) {
    fail(`${file}: filename must be ${frontmatter.id}.md`);
  }

  const sections = parseSections(content);
  const questions = extractQuestions(
    sections["Must-ask discovery questions"] ?? ""
  );
  const errors = validatePackStructure(frontmatter, sections, questions);
  if (errors.length) {
    fail(`${file}:\n  - ${errors.join("\n  - ")}`);
  } else {
    ok(`${frontmatter.id} (${questions.length} questions)`);
  }
}

for (const id of ROLE_IDS) {
  if (!seen.has(id)) fail(`Missing pack for ${id}`);
}

if (failed) {
  console.error("\nPack validation failed.");
  process.exit(1);
}

console.log("\nAll role packs valid.");
