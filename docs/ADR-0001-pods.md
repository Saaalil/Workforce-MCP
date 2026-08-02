# ADR-0001: Workforce Pods

## Status

Accepted — 2026-08-02

## Context

Users often need a *fixed specialty band* (web app, data product, LLM stack) without naming every flag. Skill dumps solve this by stacking skills; Workforce must solve it without “implement everything at once.”

## Decision

**Pods** are named, versioned **roster presets** — not new craft specialties and not merged mega-packs.

1. Calling a pod renders a **Pod brief**: pod intent → member POVs (discuss-lite) → **delegation table** for that roster only → **one** first `workforce/FLAG`.
2. Execution remains **one specialty at a time** via existing `workforce_as` / handoff.
3. Pods are data in `src/pods/registry.ts`, exposed as:
   - Tool: `workforce_pod` (+ `workforce_list_pods`)
   - Prompts: `workforce/web`, `workforce/DP`, `workforce/AIP`, …
4. **Naming:** pod ids never steal single-specialty short flags.
   - Specialty `AI` stays `workforce/AI` (ai_engineer).
   - Intelligence pod is **`AIP`** (`workforce/AIP`), not `workforce/AI`.

### Initial roster (v1)

| Pod | Flag | Members | Default sequence |
|-----|------|---------|------------------|
| Web product | `WEB` | UI, FE, BE | UI → FE + BE → (QA later) |
| Data product | `DP` | DE, DS | DS (decision/metric) → DE (pipelines) *or* DE → DS if warehouse-first |
| Intelligence | `AIP` | AI, ML, DS, DE | DS → DE → AI *or* ML → evals |
| Platform | `PLAT` | OPS, SRE, MON | OPS → SRE → MON |
| Ship gate | `SHIP` | FE, BE, QA, SEC | SEC threat pass → BE/FE → QA gates |

## Consequences

- **Good:** Faster activation; clear bands; still sequential.
- **Good:** Website can catalog pods as named team presets.
- **Bad if misused:** Agents may try to code as all members at once — brief must forbid this.
- **Rejected alternatives:**
  - Merging all member pack bodies into one prompt (context pollution).
  - Auto-spawning parallel agent threads (out of MCP scope).
  - Overloading `workforce/AI` to mean the pod (breaks specialty AI).

## Revisit triggers

- Users consistently want WEB+QA or AIP without DS → adjust roster in minor version.
- Pod count > 8 → require usage evidence before adding more.
