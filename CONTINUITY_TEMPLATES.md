# Continuity Templates

Use these as starter structures for durable project memory. Copy/adapt them into the real files when needed.

---

## Root `PROJECTS.md` template

```md
# PROJECTS.md

This is the canonical project index.

## Operating rules
- Update this when a project is created, renamed, paused, resumed, or moved.
- Keep status short and current.
- Link to each project's local handoff/status docs.

## Active projects

### <Project Name>
- **Status:** ACTIVE | PAUSED | BACKGROUND | BLOCKED | ARCHIVED
- **Type:** mobile app | website | backend | automation | content system
- **Path:** `/absolute/or/workspace-relative/path`
- **Purpose:** one-line summary of what the project is for
- **Current state:** 2-5 bullets on what is already true
- **Next step:** the single best next action
- **Key docs:**
  - `<project>/HANDOFF.md`
  - `<project>/README.md`
  - `<project>/STATUS.md`
- **Risks / blockers:**
  - current blocker 1
  - current blocker 2
```

---

## Root `NOW.md` template

```md
# NOW.md

Updated: <timestamp> <timezone>

## Current active focus
**<Project Name>**

## Resume point
- what we were doing right before stopping
- what has already been completed
- what should not be re-planned from scratch

## Current blocker / risk
- blocker 1
- blocker 2

## Next 3 actions
1. first concrete action
2. second concrete action
3. third concrete action

## Guardrails
- do not switch projects unless asked
- do not create automation/cron unless asked
- update handoff before major resets/restarts
```

---

## Root `HANDOFF.md` template

```md
# HANDOFF.md

If the session gets lost, use this file first.

Updated: <timestamp> <timezone>

## Immediate recovery checklist
1. Open the active workspace
2. Read `PROJECTS.md`
3. Read `NOW.md`
4. Read `HANDOFF.md`
5. Open the current project's local `HANDOFF.md`

## Current truth
- active project: <name>
- current phase: <phase>
- code location: <path>
- key current fact: <important truth>

## What to do next
1. exact next action
2. exact next action
3. exact next action

## Important commands / URLs
- frontend: `<url or command>`
- backend: `<url or command>`
- dashboard: `<url>`

## Do not forget
- important decision 1
- important decision 2
- important warning / caveat
```

---

## Root `MEMORY.md` template

```md
# MEMORY.md

## Durable preferences / identity
- user prefers:
- agent name / identity:
- boundaries / do-not-do:

## Durable project decisions

### <Project Name>
- key naming decision
- key architecture decision
- key business/product decision
- key path / URL / environment note
- key lesson to avoid repeating mistakes

## Recovery notes
- read these files first after context loss:
- projects that are active vs paused:
```

---

## Daily note `memory/YYYY-MM-DD.md` template

```md
# <YYYY-MM-DD>

## What changed today
- shipped / changed / tested:
- bug fixed:
- docs updated:

## Decisions made
- decision 1
- decision 2

## Files / paths touched
- `path/to/file`
- `path/to/file`

## Next step tomorrow
- first next step
- second next step

## Anything worth promoting to MEMORY.md
- durable lesson / decision / preference
```

---

## Project-local `HANDOFF.md` template

```md
# HANDOFF.md

## Project
<Project name>

## Current state
- what currently works
- what is incomplete
- what was just finished

## How to run
### Frontend
- command(s)
- URL(s)

### Backend / workers / scripts
- command(s)
- URL(s)

## Important files
- `README.md`
- `STATUS.md`
- `DECISIONS.md`
- `src/...`

## Recent decisions
- decision 1
- decision 2

## Current next steps
1. first next action
2. second next action
3. third next action

## Known issues / risks
- issue 1
- issue 2

## Recovery order if context is lost
1. read this file
2. read `STATUS.md`
3. read `README.md`
4. inspect the key runtime entrypoints
```

---

## Project-local `STATUS.md` template

```md
# STATUS.md

Updated: <timestamp>

## Summary
One short paragraph on the current state.

## Done
- completed item
- completed item

## In progress
- active task
- active task

## Next
- next task
- next task

## Blockers
- blocker

## Validation
- what was tested
- what still needs testing
```
```
