import type { Icon } from "@modelcontextprotocol/sdk/types.js";
import { EMBEDDED_ICONS } from "../generated/embedded.js";

/** Official Workforce mark — used for MCP server / client UI icons. */
export const WORKFORCE_ICONS: Icon[] = EMBEDDED_ICONS.map((icon) => ({
  src: icon.src,
  mimeType: icon.mimeType,
  sizes: [...icon.sizes],
  theme: icon.theme,
}));
