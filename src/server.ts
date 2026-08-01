import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ROLE_IDS, type RoleId } from "./types.js";
import { getPack, loadAllPacks } from "./roles/loader.js";
import { PRIMARY_SHORT_FLAGS, ROLE_ALIASES } from "./roles/aliases.js";
import { renderSpecialistBrief } from "./lib/render-brief.js";
import { registerListRoles } from "./tools/list-roles.js";
import { registerSpecialize } from "./tools/specialize.js";
import { registerConsult } from "./tools/consult.js";
import { registerHandoff } from "./tools/handoff.js";

function registerSpecialistPrompt(
  server: McpServer,
  promptName: string,
  roleId: RoleId
): void {
  const pack = getPack(roleId);
  const flag = PRIMARY_SHORT_FLAGS[roleId];
  server.registerPrompt(
    promptName,
    {
      title: `${flag} — ${pack.frontmatter.title} context`,
      description: `Load ${pack.frontmatter.title} (${flag}) specialist context: ${pack.frontmatter.one_liner}. Not hiring — equips the agent for this work.`,
      argsSchema: {
        task: z.string().describe("The work to do under this specialist context"),
        context: z
          .string()
          .optional()
          .describe("Optional product/repo context"),
        constraints: z
          .string()
          .optional()
          .describe(
            "Optional constraints (stack, deadline, brand, compliance)"
          ),
      },
    },
    ({ task, context, constraints }) => {
      const brief = renderSpecialistBrief({
        pack,
        task: task || "Help with the current project work",
        context,
        constraints,
        mode: "ask",
      });
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: brief,
            },
          },
        ],
      };
    }
  );
}

export function createWorkforceServer(): McpServer {
  loadAllPacks(true);

  const server = new McpServer({
    name: "workforce-mcp",
    version: "1.2.0",
  });

  registerListRoles(server);
  registerSpecialize(server);
  registerConsult(server);
  registerHandoff(server);

  const registeredPrompts = new Set<string>();

  for (const id of ROLE_IDS) {
    const pack = getPack(id);
    const flag = PRIMARY_SHORT_FLAGS[id];

    const promptNames = [
      `workforce/${id}`,
      `workforce/${flag}`,
      `workforce/${flag.toLowerCase()}`,
    ];

    for (const alias of ROLE_ALIASES[id]) {
      if (alias === id) continue;
      if (alias.length <= 3 || alias.includes("_")) {
        promptNames.push(`workforce/${alias}`);
      }
    }

    for (const name of promptNames) {
      const key = name.toLowerCase();
      if (registeredPrompts.has(key)) continue;
      registeredPrompts.add(key);
      registerSpecialistPrompt(server, name, id);
    }

    server.registerResource(
      `workforce-role-${id}`,
      `workforce://roles/${id}`,
      {
        title: `${flag} — ${pack.frontmatter.title} context`,
        description: pack.frontmatter.one_liner,
        mimeType: "text/markdown",
      },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: pack.raw,
          },
        ],
      })
    );

    if (flag.toLowerCase() !== id) {
      server.registerResource(
        `workforce-role-flag-${flag.toLowerCase()}`,
        `workforce://roles/${flag.toLowerCase()}`,
        {
          title: `${flag} — ${pack.frontmatter.title} context`,
          description: `Short flag for ${id}: ${pack.frontmatter.one_liner}`,
          mimeType: "text/markdown",
        },
        async (uri) => ({
          contents: [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text: pack.raw,
            },
          ],
        })
      );
    }
  }

  return server;
}
