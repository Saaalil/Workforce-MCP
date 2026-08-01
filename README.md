# Workforce MCP

<p align="center">
  <img src="src/assets/logo.png" alt="Workforce" width="96" height="96" />
</p>

**Specialist context for your agent — not a hiring tool.**

One MCP. When you need UI work, load **UI** context. Pipeline work → **DE**. Reliability → **SRE**. Your agent gets full production-grade skills, discovery questions, stack defaults, quality bars, and handoffs for that specialty — without installing separate skill packs per project.

## Mental model

```text
You: call MCP prompt "workforce/DE" for the order pipeline
  → agent loads Data Engineer specialist context
  → agent works AS a data engineer on that task
```

Same for `UI`, `FE`, `BE`, `ML`, `AI`, `OPS`, `SRE`, `MON`, `SEC`, `QA`, `ARCH`, …

## Install (Cursor)

```json
{
  "mcpServers": {
    "workforce": {
      "command": "npx",
      "args": ["-y", "@saaalil/workforce-mcp"]
    }
  }
}
```

Or run the binary after install: `npx -y @saaalil/workforce-mcp`.

Local clone:

```json
{
  "mcpServers": {
    "workforce": {
      "command": "node",
      "args": ["/absolute/path/to/Workforce-MCP/dist/index.js"]
    }
  }
}
```

## Short flags

| Flag | Full id | Specialist context for… |
|------|---------|-------------------------|
| **UI** | `ui_designer` | Product / UI design |
| **FE** | `frontend` | Frontend implementation |
| **BE** | `backend` | APIs / services |
| **ARCH** | `architect` | System architecture |
| **DE** | `data_engineer` | Pipelines / lakehouse / dbt |
| **DS** | `data_scientist` | Experiments / model specs |
| **ML** | `ml_engineer` | Model lifecycle / serving |
| **AI** | `ai_engineer` | RAG / agents / evals |
| **OPS** | `ops` | CI/CD / platform / IaC |
| **SRE** | `sre` | SLOs / incidents / reliability |
| **MON** | `monitoring` | OTel / dashboards / alerts |
| **SEC** | `security` | Threat model / authz / supply chain |
| **QA** | `qa` | Test strategy / release gates |

Also accepts: `workforce/DE`, `workforce-UI`, `devops`, `o11y`, `data engineer`, etc.

## Tools

| Tool | Purpose |
|------|---------|
| `workforce_as` | **Primary** — load full specialist context for the work |
| `workforce_specialize` | Alias of `workforce_as` |
| `workforce_list_roles` | Catalog of flags + specialties |
| `workforce_consult` | Mid-task check against a specialty’s bars |
| `workforce_handoff` | Switch context (e.g. ARCH→FE, DE→AI) |

Default **mode=`ask`**: investigate the repo, then reply with Goal / Blocking questions (0–3 with defaults) / Assumptions / Plan and **stop** until approved (unless the change is trivially small).

## Example prompts to your agent

- `workforce/UI` — design the marketing landing page
- `workforce/DE` — design the orders gold mart
- `workforce_as` with role `SRE` — define SLOs for checkout
- Plain language also works: “Load DE context and design the orders gold mart”
- `Switch context OPS → SRE after the golden path is ready`

## Develop

```bash
npm install
npm run validate-packs
npm run build
npm run smoke
```

## License

MIT
