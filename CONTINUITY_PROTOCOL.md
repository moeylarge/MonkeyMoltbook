# CONTINUITY_PROTOCOL.md

## Purpose
This file defines the continuity rules that must prevent stale-state drift across:
- `/new` sessions
- project switching
- context loss
- browser resets
- deployment/live-state mismatches

This protocol applies to all active projects in the workspace.

---

## Active projects covered
1. UFC
2. Social Clip OS
3. LooksMaxx
4. Monkey / Moltbook
5. RizzMaxx
6. Friends AI *(when/if formalized into a real project folder)*

---

## Core rule
A `/new` session must not break project continuity **if meaningful state was written back correctly**.

That means the system must prefer persisted project truth over chat recollection.

---

# Mandatory continuity rules

## Rule 1 — Immediate writeback after meaningful work
After any meaningful project work, update continuity immediately.

Minimum writeback targets:
- project-local `HANDOFF.md`
- project-local `STATUS.md` when needed
- `memory/YYYY-MM-DD.md`

Do not wait until "later" if real project state changed.

---

## Rule 2 — Project-local files beat root summaries
When recovering project truth, use this order:
1. project-local `HANDOFF.md`
2. project-local `STATUS.md`
3. same-day `memory/YYYY-MM-DD.md`
4. root `HANDOFF.md` / `NOW.md`
5. older memory or archives only if needed

Do not answer from broad root summaries first when a more current project-local file exists.

---

## Rule 3 — User correction triggers mandatory writeback
If John says any version of:
- "that’s not current"
- "we already did that"
- "yesterday we updated X"
- "the real state is Y"

then treat that as an automatic continuity-repair trigger.

Required response pattern:
1. acknowledge stale-state risk plainly
2. verify current authoritative files / live state
3. update project-local continuity
4. update daily memory
5. only then resume normal work

---

## Rule 4 — Separate saved truth from live truth
For deployment-backed or externally changing projects, track both:

### Saved project truth
What the workspace files and code say

### Live truth
What production / Vercel / app store / public site / external platform actually shows

If these differ, the handoff must say so explicitly.

Do not silently merge them.

---

## Rule 5 — No project switch without writeback if state changed
Before switching projects, ending a meaningful work segment, or preparing for `/new`, save the current state if anything important changed.

Minimum questions to answer in writeback:
- What changed?
- What is true now?
- What is blocked?
- What is the next exact step?
- Does live truth differ from saved truth?

---

# Required file responsibilities

## Project-local `HANDOFF.md`
Must answer:
- what is true now
- what changed last
- current blockers / caveats
- next exact step
- any live-vs-saved state mismatch

## Project-local `STATUS.md`
Must hold:
- current phase
- stable project truth
- locked decisions
- current implementation / product state

## `memory/YYYY-MM-DD.md`
Must capture same-day important changes, decisions, corrections, and cross-project transitions.

---

# Project-specific continuity notes

## UFC
Must track separately:
- canonical source folder
- deployment source truth
- live site truth
- Vercel/domain truth
- DB/ledger truth

## Social Clip OS
Must explicitly mark whether continuity is thin, verified, or stale before asserting status.

## LooksMaxx
Must distinguish between launch-prep truth and older build-phase truth.

## Monkey / Moltbook
Must separate:
- product implementation state
- posting/account access state
- live browser/session state

## RizzMaxx
Must separate:
- app/build truth
- launch/submission truth
- business/admin blockers
- screenshot/App Store prep state

## Friends AI
Until formalized, save important state in daily memory.
Once it becomes a real project, create project-local `HANDOFF.md` and `STATUS.md` immediately.

---

# `/new` session rule
These rules explicitly apply across `/new` sessions.

If writeback was done correctly, the next session must be able to recover:
- what changed last
- what is true now
- what is blocked
- what the next exact step is

without relying on vague recollection.

---

# Mini writeback template
Use this after meaningful work:

## Changed
- ...

## Now true
- ...

## Live truth
- ...

## Blockers
- ...

## Next step
- ...

---

# Hard rule
Do not answer from stale memory when newer project truth exists but has not yet been checked.

Recover first.
Write back fast.
Then resume.
