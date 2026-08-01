import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RoleInputSchema } from "../types.js";
import { getPackByInput } from "../roles/loader.js";
import { roleArgDescription } from "../roles/aliases.js";
import { renderConsultBrief } from "../lib/render-brief.js";

export function registerConsult(server: McpServer): void {
  server.registerTool(
    "workforce_consult",
    {
      title: "Consult Specialist Context",
      description:
        "Mid-task check against an already-loaded specialty's quality bars and decision frameworks (short flag or full id). Not hiring — specialist judgment for a blocker or decision.",
      inputSchema: {
        role: RoleInputSchema.describe(roleArgDescription()),
        situation: z
          .string()
          .min(3)
          .max(8000)
          .describe("Current situation, blocker, or decision point"),
        goal: z
          .string()
          .max(2000)
          .optional()
          .describe("What good looks like for this consult"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ role, situation, goal }) => {
      try {
        const pack = getPackByInput(role);
        const text = renderConsultBrief({ pack, situation, goal });
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
  );
}
