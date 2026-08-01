import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ROLE_IDS, type RoleId } from "./types.js";
import { getPack, loadAllPacks } from "./roles/loader.js";
import { PRIMARY_SHORT_FLAGS, ROLE_ALIASES } from "./roles/aliases.js";
import { renderSpecialistBrief } from "./lib/render-brief.js";
import { WORKFORCE_ICONS, WORKFORCE_WEBSITE_URL } from "./lib/brand.js";
import { registerListRoles } from "./tools/list-roles.js";
import { registerSpecialize } from "./tools/specialize.js";
import { registerConsult } from "./tools/consult.js";
import { registerHandoff } from "./tools/handoff.js";
import { registerDiscuss, registerDelegate } from "./tools/discuss.js";
import {
  renderDelegateBrief,
  renderDiscussBrief,
} from "./lib/orchestrate.js";

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
      description: `Load ${pack.frontmatter.title} (${flag}) specialist context: ${pack.frontmatter.one_liner}. Agent investigates, then Goal / Blocking questions / Assumptions / Plan and stops until approved. Not hiring.`,
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
    title: "Workforce",
    version: "1.3.0",
    description:
      "Specialist context for your agent — UI, DE, SRE, MGR discuss/delegate, and more. Not a hiring tool.",
    websiteUrl: WORKFORCE_WEBSITE_URL,
    icons: WORKFORCE_ICONS,
  });

  registerListRoles(server);
  registerSpecialize(server);
  registerConsult(server);
  registerHandoff(server);
  registerDiscuss(server);
  registerDelegate(server);

  // Orchestration prompts (chips alongside specialty prompts)
  for (const name of ["workforce/discuss", "workforce/scrum"] as const) {
    server.registerPrompt(
      name,
      {
        title: "Multi-specialty discuss",
        description:
          "Scrum-style (or critique/premortem/postmortem theater) discussion across Workforce specialties — challenges from each POV, then a recommended sequence.",
        argsSchema: {
          topic: z.string().describe("Idea or decision to discuss"),
          format: z
            .enum([
              "scrum",
              "critique",
              "premortem",
              "war_room",
              "retro",
              "design_review",
              "postmortem_theater",
            ])
            .optional()
            .describe("Discussion format"),
          context: z.string().optional().describe("Optional background"),
          roles: z
            .string()
            .optional()
            .describe(
              "Optional comma-separated flags, e.g. UI,FE,BE,SEC (ignored for postmortem_theater)"
            ),
        },
      },
      ({ topic, format, context, roles }) => ({
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: renderDiscussBrief({
                topic: topic || "Discuss the current idea",
                format: format ?? "scrum",
                context,
                roles,
              }),
            },
          },
        ],
      })
    );
  }

  for (const name of [
    "workforce/postmortem",
    "workforce/postmortem_theater",
  ] as const) {
    server.registerPrompt(
      name,
      {
        title: "Postmortem theater",
        description:
          "Full-cast postmortem: every specialty owns exactly one corrective action. Topic = the failure story.",
        argsSchema: {
          topic: z
            .string()
            .describe("Failure story — what broke, when, blast radius"),
          context: z.string().optional().describe("Optional background"),
        },
      },
      ({ topic, context }) => ({
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: renderDiscussBrief({
                topic: topic || "Postmortem the recent failure",
                format: "postmortem_theater",
                context,
              }),
            },
          },
        ],
      })
    );
  }

  for (const name of ["workforce/delegate", "workforce/plan_work"] as const) {
    server.registerPrompt(
      name,
      {
        title: "Delegate across specialties",
        description:
          "Break work into specialty-owned slices with order, acceptance, and workforce/FLAG invoke hints.",
        argsSchema: {
          goal: z.string().describe("Outcome to deliver"),
          context: z.string().optional().describe("Optional background"),
          constraints: z
            .string()
            .optional()
            .describe("Deadline, stack, compliance, scope cuts"),
          roles: z
            .string()
            .optional()
            .describe("Optional specialty subset"),
        },
      },
      ({ goal, context, constraints, roles }) => ({
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: renderDelegateBrief({
                goal: goal || "Plan specialty ownership for this work",
                context,
                constraints,
                roles,
              }),
            },
          },
        ],
      })
    );
  }

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
