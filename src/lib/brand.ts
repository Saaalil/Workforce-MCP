import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Icon } from "@modelcontextprotocol/sdk/types.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(HERE, "..", "assets");

function dataUri(fileName: string, mimeType: string): string {
  const buf = readFileSync(join(ASSETS, fileName));
  if (mimeType === "image/svg+xml") {
    const encoded = encodeURIComponent(buf.toString("utf8"));
    return `data:${mimeType},${encoded}`;
  }
  return `data:${mimeType};base64,${buf.toString("base64")}`;
}

/** Official Workforce mark — used for MCP server / client UI icons. */
export const WORKFORCE_ICONS: Icon[] = [
  {
    src: dataUri("logo.svg", "image/svg+xml"),
    mimeType: "image/svg+xml",
    sizes: ["any"],
    theme: "dark",
  },
  {
    src: dataUri("logo-light.svg", "image/svg+xml"),
    mimeType: "image/svg+xml",
    sizes: ["any"],
    theme: "light",
  },
  {
    src: dataUri("logo.png", "image/png"),
    mimeType: "image/png",
    sizes: ["512x512"],
    theme: "dark",
  },
];

export const WORKFORCE_WEBSITE_URL =
  "https://github.com/Saaalil/Workforce-MCP";

export const WORKFORCE_NPM_URL =
  "https://www.npmjs.com/package/@saaalil/workforce-mcp";
