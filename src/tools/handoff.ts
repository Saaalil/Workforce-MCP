import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RoleInputSchema } from "../types.js";
import { getPackByInput } from "../roles/loader.js";
import { roleArgDescription } from "../roles/aliases.js";
import { renderHandoffBrief } from "../lib/render-brief.js";

export function registerHandoff(server: McpServer): void {
  server.registerTool(
    "workforce_handoff",
    {
      title: "Switch Specialist Context",
      description:
        "Switch the agent's specialist context from one specialty to another (e.g. ARCH→FE, DE→AI, OPS→SRE) with a clean brief. " +
        "Not a personnel handoff — a context switch so the next slice of work uses the right skills and quality bars.",
      inputSchema: {
        from_role: RoleInputSchema.describe(
          `Outgoing specialty. ${roleArgDescription()}`
        ),
        to_role: RoleInputSchema.describe(
          `Incoming specialty. ${roleArgDescription()}`
        ),
        task: z
          .string()
          .min(3)
          .max(4000)
          .describe("Work continuing under the new specialty context"),
        findings: z
          .string()
          .max(8000)
          .optional()
          .describe("Key findings and constraints from the outgoing specialty"),
        artifacts: z
          .string()
          .max(8000)
          .optional()
          .describe("Named artifacts to carry forward"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ from_role, to_role, task, findings, artifacts }) => {
      try {
        const from = getPackByInput(from_role);
        const to = getPackByInput(to_role);
        if (from.frontmatter.id === to.frontmatter.id) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Context switch failed: from_role and to_role both resolve to "${from.frontmatter.id}". Pick a different specialty, or use workforce_consult.`,
              },
            ],
            isError: true,
          };
        }
        const text = renderHandoffBrief({
          from,
          to,
          task,
          findings,
          artifacts,
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
  );
}
