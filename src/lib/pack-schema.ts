import { z } from "zod";
import {
  REQUIRED_SECTIONS,
  RolePackFrontmatterSchema,
  type RolePack,
  type RolePackFrontmatter,
} from "../types.js";

const SECTION_HEADER =
  /^##\s+(.+?)\s*$/gm;

export function parseSections(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const matches = [...body.matchAll(SECTION_HEADER)];
  for (let i = 0; i < matches.length; i++) {
    const title = matches[i][1].trim();
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : body.length;
    sections[title] = body.slice(start, end).trim();
  }
  return sections;
}

export function extractQuestions(questionsSection: string): string[] {
  const lines = questionsSection.split(/\r?\n/);
  const questions: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\s*(?:\d+[\).\]]|[-*])\s+\*?\*?(.+?)\*?\*?\s*$/);
    if (m) {
      const q = m[1].replace(/\*\*/g, "").trim();
      if (q.length > 10) questions.push(q);
    }
  }
  return questions;
}

export function validatePackStructure(
  frontmatter: RolePackFrontmatter,
  sections: Record<string, string>,
  questions: string[]
): string[] {
  const errors: string[] = [];

  for (const section of REQUIRED_SECTIONS) {
    if (!sections[section] || sections[section].trim().length < 40) {
      errors.push(`Missing or too-short section: "## ${section}"`);
    }
  }

  if (questions.length < 8) {
    errors.push(
      `Need at least 8 discovery questions, found ${questions.length}`
    );
  }

  const handoff = sections["Handoff protocols"] ?? "";
  if (handoff.length < 80) {
    errors.push("Handoff protocols section is empty or too short");
  }

  const stack = sections["2025–2026 skill stack defaults"] ?? "";
  if (!stack.includes("|") && !stack.toLowerCase().includes("default")) {
    errors.push("Skill stack section should include a defaults table or list");
  }

  try {
    RolePackFrontmatterSchema.parse(frontmatter);
  } catch (e) {
    if (e instanceof z.ZodError) {
      errors.push(...e.issues.map((i) => `frontmatter: ${i.path.join(".")} ${i.message}`));
    }
  }

  return errors;
}

export function assertValidPack(pack: RolePack): void {
  const errors = validatePackStructure(
    pack.frontmatter,
    pack.sections,
    pack.questions
  );
  if (errors.length) {
    throw new Error(
      `Invalid role pack "${pack.frontmatter.id}":\n- ${errors.join("\n- ")}`
    );
  }
}
