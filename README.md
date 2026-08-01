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

Same for `UI`, `FE`, `BE`, `ML`, `AI`, `OPS`, `SRE`, `MON`, `SEC`, `QA`, `ARCH`, `MGR`, …

**Orchestration flow:** discuss the idea across specialties → delegate who owns what → execute **one** specialty at a time (`workforce/UI`, then handoff, …).

## Install (Cursor)

**Use npx** (works for everyone — no local `node_modules` required):

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

Do **not** set `command` to `node` with `./node_modules/@saaalil/workforce-mcp/...` unless you have already run `npm i @saaalil/workforce-mcp` in that same workspace. That path is why installs fail with `MODULE_NOT_FOUND`.

Or run: `npx -y @saaalil/workforce-mcp`.

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
| **MGR** | `manager` | Delegate slices / sequence specialties |

Also accepts: `workforce/DE`, `workforce-UI`, `devops`, `o11y`, `data engineer`, etc.

## Tools

| Tool | Purpose |
|------|---------|
| `workforce_as` | **Primary** — load full specialist context for the work |
| `workforce_specialize` | Alias of `workforce_as` |
| `workforce_list_roles` | Catalog of flags + specialties |
| `workforce_consult` | Mid-task check against a specialty’s bars |
| `workforce_handoff` | Switch context (e.g. ARCH→FE, DE→AI) |
| `workforce_discuss` | Multi-specialty meeting (scrum / critique / premortem / war_room / retro / design_review / **postmortem_theater**) |
| `workforce_delegate` | Manager ownership plan — who owns which slice, in what order |

Default **mode=`ask`**: investigate the repo, then reply with Goal / Blocking questions (0–3 with defaults) / Assumptions / Plan and **stop** until approved (unless the change is trivially small).

## Example prompts to your agent

- `workforce/UI` — design the marketing landing page
- `workforce/DE` — design the orders gold mart
- `workforce_as` with role `SRE` — define SLOs for checkout
- `workforce/discuss` — scrum the “express checkout” idea across specialties
- `workforce/discuss` with format `postmortem_theater` — full cast; each specialty owns one corrective action
- `workforce/delegate` — break “express checkout” into specialty-owned slices
- `workforce/MGR` — stay in manager mode and sequence the work
- Plain language also works: “Load DE context and design the orders gold mart”
- `Switch context OPS → SRE after the golden path is ready`

## How Workforce differs from skill directories (e.g. skills.sh)

[skills.sh](https://www.skills.sh/) is a **marketplace of discrete skills** you install one-by-one (`npx skills add …`) — procedural snippets for agents (frontend-design, tdd, azure-*, etc.). That model wins at breadth and remixing many tiny capabilities.

Workforce is a different bet:

| | Skill directories | Workforce |
|--|-----------------|-----------|
| Unit | One skill file / procedure | One **specialty** with identity, stack defaults, quality bars, anti-patterns, handoffs |
| How you use it | Install many skills into the agent | One MCP — call `workforce/DE`, discuss, delegate |
| Coordination | You pick which skills to stack | **Discuss → delegate → one specialty at a time → handoff** |
| Failure work | Separate debugging / review skills | **Postmortem theater**: every specialty owns one corrective action |
| Intake | Often “just do it” | Contractor **Goal / Blocking questions / Assumptions / Plan** before high blast-radius work |

**Be better, not broader:** stay opinionated on orchestration and bars; don’t become another skill dump. Complement skills.sh (use a skill for a niche procedure) while Workforce owns **who speaks, who owns the slice, and when to switch**.

## Develop

```bash
npm install
npm run validate-packs
npm run build
npm run smoke
```

## License

MIT
