#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createWorkforceServer } from "./server.js";

async function main(): Promise<void> {
  const server = createWorkforceServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("workforce-mcp failed to start:", err);
  process.exit(1);
});
