If the session gets lost, the UI freezes, or the daemon goes weird, use this file first.

Updated: 2026-03-26 America/Los_Angeles

## Immediate recovery checklist

1. Open the active workspace:
   - `/Users/moey/.openclaw/workspace`
2. Read these root files in order:
   - `PROJECTS.md`
   - `NOW.md`
   - `HANDOFF.md`
3. Open the active project's handoff first:
   - `owned-source-leads/HANDOFF.md`
4. Then open supporting project docs as needed:
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
5. Local dashboard URL:
   - `http://127.0.0.1:18789/`

## Current truth

- Primary active project: **Owned-Source Hot Lead Generation System**
- Project path: `/Users/moey/.openclaw/workspace/owned-source-leads`
- Current phase: **production verification / QA after live deploy**
- Vercel production app is live at `https://owned-source-leads-6.vercel.app`
- local production build passes on Next.js 16.2.1
- dashboard and lead detail path are functioning again after last night's deploy fixes
- postback flow has now been verified end to end against production
- project-local recovery file now exists:
  - `owned-source-leads/HANDOFF.md`

## What to do next

1. Run traffic/testing/polish pass:
   - dashboard
   - lead detail
   - test intake
   - routing
   - export
   - proof
   - postback
   - traffic readiness
2. Tighten buyer integration if needed:
   - real buyer destinations
   - expected aff/subid params
   - buyer-specific postback requirements
3. Then continue landing-page and traffic-readiness expansion from the now-verified production base

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
