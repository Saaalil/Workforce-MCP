import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listPods } from "../pods/registry.js";
import { renderPodBrief } from "../lib/orchestrate.js";

export function registerListPods(server: McpServer): void {
  server.registerTool(
    "workforce_list_pods",
    {
      title: "List Workforce pods",
      description:
        "List pod roster presets (WEB, DP, AIP, PLAT, SHIP) — fixed specialty bands for discuss→delegate→one FLAG. " +
        "Pods are not craft specialties. Note: AI is a specialty; AIP is the intelligence pod.",
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
      const pods = listPods();
      if (response_format === "json") {
        const payload = { pods, count: pods.length };
        return {
          content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
          structuredContent: payload,
        };
      }
      const text = [
        "# Workforce Pods",
        "",
        "Pods are **roster presets** (not mega-skills). Call a pod → member POVs → delegation → **one** specialty.",
        "",
        "| Flag | Invoke | Members | When |",
        "|------|--------|---------|------|",
        ...pods.map(
          (p) =>
            `| **${p.flag}** | \`${p.invoke}\` | ${p.members.join(", ")} | ${p.when} |`
        ),
        "",
        "Next: `workforce_pod` with `pod` = `WEB` | `DP` | `AIP` | `PLAT` | `SHIP` and your goal.",
        "Reminder: specialty `workforce/AI` ≠ pod `workforce/AIP`.",
      ].join("\n");
      return { content: [{ type: "text" as const, text }] };
    }
  );
}

export function registerPod(server: McpServer): void {
  server.registerTool(
    "workforce_pod",
    {
      title: "Run a Workforce pod",
      description:
        "Load a pod roster preset (WEB=UI+FE+BE, DP=DE+DS, AIP=AI+ML+DS+DE, PLAT=OPS+SRE+MON, SHIP=SEC+BE+FE+QA). " +
        "Surfaces member POVs and a delegation table — then execute one workforce/FLAG. Not parallel implement-everything.",
      inputSchema: {
        pod: z
          .string()
          .min(2)
          .max(64)
          .describe(
            "Pod id or flag: WEB|DP|AIP|PLAT|SHIP (or web, data, ai_pod, platform, ship). Not the AI specialty."
          ),
        goal: z
          .string()
          .min(3)
          .max(4000)
          .describe("Outcome the pod should plan for"),
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
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ pod, goal, context, constraints }) => {
      const text = renderPodBrief({ pod, goal, context, constraints });
      return { content: [{ type: "text" as const, text }] };
    }
  );
}
