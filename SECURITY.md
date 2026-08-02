# Security

## What Workforce is

`@saaalil/workforce-mcp` is an **stdio MCP server**. It injects specialist context (markdown packs) into the host agent. It is **not malware**.

## Trust boundary (our published `dist/index.js`)

| Capability | Our code |
|------------|----------|
| Network | **None** — no outbound HTTP |
| Shell / `child_process` | **None** |
| `eval` / `new Function` | **None** in our file |
| Filesystem | **None** at runtime — packs/icons are compile-time embedded |
| Install scripts | **None** (`prepublishOnly` is publisher-side only) |

Transport is **stdio only**. We do not start an Express/HTTP server.

## Why Socket showed “Uses eval” on 1.4.1

v1.4.1 **bundled** `@modelcontextprotocol/sdk` into `dist/index.js`. That SDK uses **AJV**, which compiles JSON-schema validators with `new Function(...)`. Socket attributed that pattern to **our** package (malware-looking Package Alert).

**From 1.4.2:** we keep the official MCP SDK + `zod` as normal **dependencies** and bundle **only** Workforce code. Any AJV `new Function` signal stays on the known upstream packages (Dependency Alerts), not on `@saaalil/workforce-mcp`.

Filesystem / URL Package Alerts are cleared the same way: content is embedded; we do not put website URLs into the runtime server metadata.

Dependency alerts on `@modelcontextprotocol/sdk`’s HTTP/SSE stack may still appear — stdio consumers never start that stack.

## Verification

```bash
npm run build
# must not contain: new Function, eval(, node:fs, child_process
npm run smoke
npm pack --dry-run
```

Source: https://github.com/Saaalil/Workforce-MCP  
npm: https://www.npmjs.com/package/@saaalil/workforce-mcp  
Report issues: https://github.com/Saaalil/Workforce-MCP/issues
