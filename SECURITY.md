# Security

## What Workforce is

`@saaalil/workforce-mcp` is an **stdio MCP server**. It loads local markdown specialty packs and returns text briefs to the host agent (Cursor, Claude, etc.). It is **not** a browser extension, not a cloud service runtime, and **not malware**.

## Trust boundary

| Capability | Our published code |
|------------|--------------------|
| Network | **None** — no outbound HTTP from Workforce itself |
| Shell / child_process | **None** |
| `eval` / dynamic code | **None** |
| Filesystem | **Read-only** role packs, constitution, and brand assets shipped inside the package |
| Install scripts | **None** (`prepublishOnly` is publisher-side only) |

Transport is **stdio only** (`StdioServerTransport`). We do not start an Express/HTTP server.

## Why Socket / scanners may still show alerts

Older installs depended on `@modelcontextprotocol/sdk` as a runtime dependency. That SDK’s **HTTP/SSE** stack (Express, etc.) triggers generic Socket signals (`network access`, `shell access`, `eval` in transitive tools) even when a stdio-only consumer never loads those modules.

**From 1.4.1 onward** Workforce:

1. **Bundles** the stdio server into a single `dist/index.js` (no runtime npm dependencies).
2. **Removed** `gray-matter` / `js-yaml` (replaced with a tiny safe frontmatter parser — no `eval`).
3. Ships only the bundle + role packs + docs — no `postinstall` hooks.

### Residual scanner signals (false positives)

The MCP SDK validates tool schemas with **AJV**, which compiles validators via `new Function(...)`. That can appear as “uses eval” when a scanner reads our **bundled** file. It is schema compilation inside a well-known library — not dynamic execution of untrusted strings, and not malware.

Generic “dependency alerts” on *historical* versions (pre-1.4.1) that listed `@modelcontextprotocol/sdk` as a runtime dependency are expected (Express/HTTP trees the stdio path never starts). They are not evidence that Workforce exfiltrates data or runs a shell.

## Verification

```bash
npm pack --dry-run
npm run smoke
npm audit
```

Source: https://github.com/Saaalil/Workforce-MCP  
npm: https://www.npmjs.com/package/@saaalil/workforce-mcp  
Report issues: https://github.com/Saaalil/Workforce-MCP/issues
