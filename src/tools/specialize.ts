import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WorkModeSchema, RoleInputSchema } from "../types.js";
import { getPackByInput } from "../roles/loader.js";
import { roleArgDescription } from "../roles/aliases.js";
import { renderSpecialistBrief } from "../lib/render-brief.js";

const INPUT = {
  role: RoleInputSchema.describe(roleArgDescription()),
  task: z
    .string()
    .min(3)
    .max(4000)
    .describe("The work to do under this specialist context"),
  context: z
    .string()
    .max(8000)
    .optional()
    .describe("Optional repo/product/background notes"),
  constraints: z
    .string()
    .max(4000)
    .optional()
    .describe("Optional stack, deadline, brand, compliance, or budget constraints"),
  mode: WorkModeSchema.optional().describe(
    "ask (default): investigate then Goal/Blocking questions/Assumptions/Plan and stop; plan: same with a concrete plan; execute: implement after approval"
  ),
};

async function handleSpecialize(args: {
  role: string;
  task: string;
  context?: string;
  constraints?: string;
  mode?: "ask" | "plan" | "execute";
}) {
  try {
    const pack = getPackByInput(args.role);
    const text = renderSpecialistBrief({
      pack,
      task: args.task,
      context: args.context,
      constraints: args.constraints,
      mode: args.mode ?? "ask",
    });
    return {
      content: [{ type: "text" as const, text }],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text" as const, text: message }],
      isError: true,
    };
  }
}

/**
 * Primary tool: load specialist context into the agent for a piece of work.
 * NOT a hiring tool — it injects skills, judgment, process, and quality bars.
 */
export function registerSpecialize(server: McpServer): void {
  server.registerTool(
    "workforce_as",
    {
      title: "Load Specialist Context",
      description:
        "Load full specialist context into the agent for a task (skills, stack defaults, quality bars, anti-patterns, handoffs). " +
        "The agent must investigate the repo, then reply with Goal / Blocking questions (0–3 with defaults) / Assumptions / Plan and stop until approved (unless the change is trivially small). " +
        "Use when the user says workforce/UI, workforce/DE, DE, Backend, SRE, Ops, etc. " +
        "This is NOT hiring people — it equips the agent to do that specialty of work at full potential. " +
        "Short flags: DE UI FE BE DS ML AI ARCH OPS SRE MON SEC QA.",
      inputSchema: INPUT,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    handleSpecialize
  );

  // Alias for discoverability
  server.registerTool(
    "workforce_specialize",
    {
      title: "Load Specialist Context (alias)",
      description:
        "Alias of workforce_as — load specialist context for the agent to perform specialized work. Not a hiring tool.",
      inputSchema: INPUT,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    handleSpecialize
  );
}

/** @deprecated Prefer registerSpecialize / workforce_as */
export const registerHire = registerSpecialize;
