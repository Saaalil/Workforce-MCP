# Workforce MCP

**Specialist context for your agent — not a hiring tool.**

One MCP. When you need UI work, load **UI** context. Pipeline work → **DE**. Reliability → **SRE**. Your agent gets full production-grade skills, discovery questions, stack defaults, quality bars, and handoffs for that specialty — without installing separate skill packs per project.

## Mental model

```text
You: "workforce-DE for the order pipeline"
  → agent calls workforce_as({ role: "DE", task: "…" })
  → agent receives deep Data Engineer context
  → agent works AS a data engineer on that task
```

Same for `UI`, `FE`, `BE`, `ML`, `AI`, `OPS`, `SRE`, `MON`, `SEC`, `QA`, `ARCH`, …

## Install (Cursor)

```json
{
  "mcpServers": {
    "workforce": {
      "command": "npx",
      "args": ["-y", "workforce-mcp"]
    }
  }
}
```

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

Also accepts: `workforce-DE`, `workforce-UI`, `devops`, `o11y`, `data engineer`, etc.

## Tools

| Tool | Purpose |
|------|---------|
| `workforce_as` | **Primary** — load full specialist context for the work |
| `workforce_specialize` | Alias of `workforce_as` |
| `workforce_list_roles` | Catalog of flags + specialties |
| `workforce_consult` | Mid-task check against a specialty’s bars |
| `workforce_handoff` | Switch context (e.g. ARCH→FE, DE→AI) |

Default **mode=`ask`**: clarify with specialty discovery questions, then execute.

## Example prompts to your agent

- `workforce-UI for the marketing landing page`
- `Load DE context and design the orders gold mart`
- `workforce_as SRE — define SLOs for checkout`
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
