If the session gets lost, the UI freezes, or the daemon goes weird, use this file first.

Updated: 2026-03-25 America/Los_Angeles

## Immediate recovery checklist

1. Open the active workspace:
   - `/Users/moey/.openclaw/workspace`
2. Read these root files in order:
   - `PROJECTS.md`
   - `NOW.md`
   - `HANDOFF.md`
3. Open the active project's docs:
   - `owned-source-leads/docs/system-overview.md`
   - `owned-source-leads/docs/owned-source-strategy.md`
   - `owned-source-leads/docs/mca-inbound-engine.md`
   - `owned-source-leads/docs/mca-prospecting-engine.md`
   - `owned-source-leads/docs/debt-inbound-engine.md`
   - `owned-source-leads/docs/data-schema.md`
   - `owned-source-leads/docs/lead-scoring.md`
   - `owned-source-leads/docs/buyer-readiness-spec.md`
   - `owned-source-leads/docs/dashboard-wireframe-01.md`
   - `owned-source-leads/docs/operator-workflow.md`
4. Local dashboard URL:
   - `http://127.0.0.1:18789/`

## Current truth

- Primary active project: **Owned-Source Hot Lead Generation System**
- Project path: `/Users/moey/.openclaw/workspace/owned-source-leads`
- Current phase: **Phase 1 strategy and architecture defined**
- Highest priority is owned-source hot lead generation, not generic scraping
- Required engine split is locked:
  - MCA owned inbound
  - MCA public-data prospecting
  - Debt owned inbound
- First-pass schema, scoring, buyer-readiness, dashboard, and operator workflow are already written
- Git commit created for this phase:
  - `32bd88d` — Add owned-source hot lead generation phase 1 docs

## What to do next

1. Finish the remaining required docs:
   - `deduplication-rules.md`
   - `page-template-system.md`
   - `funnel-map.md`
   - `compliance-notes.md`
   - `verification-checklist.md`
2. Move into Phase 2 foundation:
   - datastore
   - attribution layer
   - scoring layer
   - dashboard
   - lead detail view
   - export-ready structure
   - logs
3. Then begin Phase 3:
   - main MCA landing page
   - first three MCA niche/city pages
   - MCA qualification flow
   - MCA scoring verification

## Hard project rules

- owned inbound is the priority
- debt is inbound-only
- do not build consumer scraping systems
- do not drift into endless design churn
- do not rebuild working modules without verified bugs
- after each phase, lock what works

## Background project notes

- Friends AI is no longer the current primary focus
- RizzMaxx stays active in background
- other existing workspace projects remain separate and should not be mixed into this build unless explicitly requested
