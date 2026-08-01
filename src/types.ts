import { z } from "zod";

export const ROLE_IDS = [
  "architect",
  "ui_designer",
  "frontend",
  "backend",
  "data_engineer",
  "data_scientist",
  "ml_engineer",
  "ai_engineer",
  "ops",
  "sre",
  "monitoring",
  "security",
  "qa",
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

export const RoleIdSchema = z.enum(ROLE_IDS);

/** Accepts short flags (DE, UI) and full ids; refined at tool boundary via resolveRoleId */
export const RoleInputSchema = z
  .string()
  .min(1)
  .max(64)
  .describe(
    "Short flag or full role id: DE|UI|FE|BE|DS|ML|AI|ARCH|OPS|SRE|MON|SEC|QA or data_engineer, ui_designer, ..."
  );

export const WorkModeSchema = z.enum(["ask", "plan", "execute"]);
export type WorkMode = z.infer<typeof WorkModeSchema>;
/** @deprecated Use WorkModeSchema */
export const HireModeSchema = WorkModeSchema;
/** @deprecated Use WorkMode */
export type HireMode = WorkMode;

export const RolePackFrontmatterSchema = z.object({
  id: RoleIdSchema,
  title: z.string().min(1),
  seniority: z.string().min(1),
  one_liner: z.string().min(1),
  owns: z.array(z.string()).min(1),
  does_not_own: z.array(z.string()).min(1),
});

export type RolePackFrontmatter = z.infer<typeof RolePackFrontmatterSchema>;

export const REQUIRED_SECTIONS = [
  "Identity / stance",
  "Must-ask discovery questions",
  "2025–2026 skill stack defaults",
  "Workflow phases + concrete deliverables",
  "Hard quality bars",
  "Anti-patterns refused",
  "Decision frameworks",
  "Handoff protocols",
] as const;

export interface RolePack {
  frontmatter: RolePackFrontmatter;
  body: string;
  raw: string;
  questions: string[];
  sections: Record<string, string>;
}

export interface RoleCatalogEntry {
  id: RoleId;
  title: string;
  seniority: string;
  one_liner: string;
  owns: string[];
  does_not_own: string[];
  short_flag: string;
  aliases: string[];
}
