import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import {
  ROLE_IDS,
  RolePackFrontmatterSchema,
  type RoleCatalogEntry,
  type RoleId,
  type RolePack,
} from "../types.js";
import {
  assertValidPack,
  extractQuestions,
  parseSections,
} from "../lib/pack-schema.js";
import {
  PRIMARY_SHORT_FLAGS,
  aliasesFor,
  requireRoleId,
} from "./aliases.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKS_DIR = join(HERE, "packs");

let cache: Map<RoleId, RolePack> | null = null;

function loadPackFile(filePath: string): RolePack {
  const raw = readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = RolePackFrontmatterSchema.parse(data);
  const sections = parseSections(content);
  const questions = extractQuestions(
    sections["Must-ask discovery questions"] ?? ""
  );
  const pack: RolePack = {
    frontmatter,
    body: content.trim(),
    raw,
    questions,
    sections,
  };
  assertValidPack(pack);
  return pack;
}

export function loadAllPacks(strict = true): Map<RoleId, RolePack> {
  if (cache) return cache;
  const map = new Map<RoleId, RolePack>();
  const files = readdirSync(PACKS_DIR).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const pack = loadPackFile(join(PACKS_DIR, file));
    map.set(pack.frontmatter.id, pack);
  }
  if (strict) {
    for (const id of ROLE_IDS) {
      if (!map.has(id)) {
        throw new Error(`Missing role pack for ${id}`);
      }
    }
  }
  cache = map;
  return map;
}

export function getPack(id: RoleId): RolePack {
  const packs = loadAllPacks();
  const pack = packs.get(id);
  if (!pack) throw new Error(`Unknown role: ${id}`);
  return pack;
}

/** Resolve short flags / aliases (DE, workforce-UI, data engineer) → pack */
export function getPackByInput(roleInput: string): RolePack {
  return getPack(requireRoleId(roleInput));
}

export function listCatalog(): RoleCatalogEntry[] {
  return ROLE_IDS.map((id) => {
    const { frontmatter } = getPack(id);
    return {
      id: frontmatter.id,
      title: frontmatter.title,
      seniority: frontmatter.seniority,
      one_liner: frontmatter.one_liner,
      owns: frontmatter.owns,
      does_not_own: frontmatter.does_not_own,
      short_flag: PRIMARY_SHORT_FLAGS[id],
      aliases: aliasesFor(id),
    };
  });
}

export function getConstitution(): string {
  return readFileSync(join(HERE, "..", "constitution.md"), "utf8").trim();
}

export function clearPackCache(): void {
  cache = null;
}
