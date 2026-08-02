import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  renderDelegateBrief,
  renderDiscussBrief,
  type DiscussFormat,
} from "../lib/orchestrate.js";

const DiscussFormatSchema = z.enum([
  "scrum",
  "critique",
  "premortem",
  "war_room",
  "retro",
  "design_review",
  "postmortem_theater",
]);

export function registerDiscuss(server: McpServer): void {
  server.registerTool(
    "workforce_discuss",
    {
      title: "Multi-specialty discuss",
      description:
        "Run a multi-role discussion on an idea (scrum, critique, premortem, war room, retro, design review, or postmortem theater). " +
        "Surfaces challenges from each specialty POV, then recommends a sequence — do not implement everything in parallel.",
      inputSchema: {
        topic: z
          .string()
          .min(3)
          .max(4000)
          .describe("Idea, feature, incident, or decision to discuss"),
        format: DiscussFormatSchema.optional().describe(
          "scrum (default) | critique | premortem | war_room | retro | design_review | postmortem_theater"
        ),
        context: z
          .string()
          .max(8000)
          .optional()
          .describe("Optional product/repo background"),
        roles: z
          .string()
          .max(500)
          .optional()
          .describe(
            "Optional comma-separated specialties (e.g. UI,FE,BE,SEC). Ignored for postmortem_theater (full cast always)."
          ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ topic, format, context, roles }) => {
      const text = renderDiscussBrief({
        topic,
        format: (format as DiscussFormat | undefined) ?? "scrum",
        context,
        roles,
      });
      return { content: [{ type: "text" as const, text }] };
    }
  );
}

export function registerDelegate(server: McpServer): void {
  server.registerTool(
    "workforce_delegate",
    {
      title: "Delegate across specialties",
      description:
        "Manager-style work breakdown: which specialty owns which slice, in what order, with acceptance criteria and workforce/FLAG invoke hints. " +
        "Use after discuss or when the user asks who should do what.",
      inputSchema: {
        goal: z
          .string()
          .min(3)
          .max(4000)
          .describe("Outcome to deliver"),
        context: z
          .string()
          .max(8000)
          .optional()
          .describe("Optional product/repo background"),
        constraints: z
          .string()
          .max(4000)
          .optional()
          .describe("Deadline, stack, compliance, scope cuts"),
        roles: z
          .string()
          .max(500)
          .optional()
          .describe(
            "Optional comma-separated specialty subset to consider"
          ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ goal, context, constraints, roles }) => {
      const text = renderDelegateBrief({
        goal,
        context,
        constraints,
        roles,
      });
      return { content: [{ type: "text" as const, text }] };
    }
  );
}
