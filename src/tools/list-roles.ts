import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registrySummary } from "../roles/registry.js";
import { listCatalog } from "../roles/loader.js";

export function registerListRoles(server: McpServer): void {
  server.registerTool(
    "workforce_list_roles",
    {
      title: "List Specialist Contexts",
      description:
        "List all Workforce specialist contexts with short flags (DE, UI, SRE, …), full ids, aliases, and what each specialty owns. " +
        "Use before workforce_as if unsure which specialist context fits the work.",
      inputSchema: {
        response_format: z
          .enum(["markdown", "json"])
          .default("markdown")
          .describe("markdown for humans, json for structured parsing"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ response_format }) => {
      const roles = listCatalog();
      if (response_format === "json") {
        const payload = { roles, count: roles.length };
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(payload, null, 2),
            },
          ],
          structuredContent: payload,
        };
      }
      const text = [
        "# Workforce Specialist Contexts",
        "",
        "One MCP that loads deep specialist context into your agent for the work at hand.",
        "",
        "| Flag | Invoke | Specialty context |",
        "|------|--------|-------------------|",
        ...roles.map(
          (r) =>
            `| **${r.short_flag}** | \`workforce_as\` role=\`${r.short_flag}\` | ${r.title} |`
        ),
        "",
        registrySummary(),
        "",
        "Next: call `workforce_as` with `role` = `DE` | `UI` | `SRE` | … and the work to do.",
      ].join("\n");
      return {
        content: [{ type: "text" as const, text }],
      };
    }
  );
}
