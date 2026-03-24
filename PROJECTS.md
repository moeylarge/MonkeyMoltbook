# PROJECTS.md

This is the canonical project index for fast recovery after resets, daemon issues, or context loss.

## Operating rules

- Do **not** create cron jobs, heartbeat loops, or autonomous execution loops unless Moey explicitly asks.
- Use root files for cross-project continuity:
  - `PROJECTS.md` → what exists
  - `NOW.md` → what is active right now
  - `HANDOFF.md` → how to recover quickly
  - `MEMORY.md` → durable decisions that should survive session loss
- Keep project-specific state close to the code with local `HANDOFF.md` / `STATUS.md` files.
- If a project seems missing, check both:
  - `/Users/moey/.openclaw/workspace`
  - `/Users/moey/.openclaw_old/workspace`
- Commit meaningful workspace changes so project state survives resets.

## Active projects

### 1) RIZZ MAXX
- **Status:** ACTIVE / CURRENT PRIMARY FOCUS
- **Type:** Mobile app
- **Path:** `/Users/moey/.openclaw/workspace/rizz-maxx`
- **Purpose:** AI-powered dating profile optimizer that ranks photos, identifies weak images, and gives actionable recommendations to improve dating profile performance
- **Current state:**
  - master build directive is locked
  - required Phase 1 execution documents have been created
  - product category is locked: dating profile optimizer, not a dating app
  - MVP scope excludes chat, social, marketplace, and drift features
- **Next step:** begin Phase 2 design definition, then scaffold the app shell in Phase 3
- **Key docs:**
  - `rizz-maxx/PRD.md`
  - `rizz-maxx/DESIGN_SYSTEM.md`
  - `rizz-maxx/SCREENS_AND_FLOWS.md`
  - `rizz-maxx/STATUS.md`
- **Risks / blockers:**
  - no implementation scaffold exists yet
  - visual quality must stay premium without broadening scope

### 2) MonkeyMoltbook
- **Status:** ACTIVE / BACKGROUND AFTER FOCUS SWITCH
- **Type:** Mobile app + realtime backend
- **Path:** `/Users/moey/.openclaw/workspace/MonkeyMoltbook`
- **Purpose:** swipe-based AI agent app with instant first-message emotional hooks and infinite rapid progression
- **Current state:**
  - new project initialized from a tightly constrained MVP build directive
  - Phase 1 scaffold is complete
  - monorepo structure exists with `apps/mobile`, `apps/server`, `packages/shared`, and `docs`
  - Expo-based React Native shell exists as a single-screen UI baseline
  - Node/Express/WebSocket backend boots and passes a local health check
- **Next step:** when resumed, start Phase 2 (chat) only: connect mobile UI to backend WebSocket and render the first live hook message in-app
- **Key docs:**
  - `MonkeyMoltbook/HANDOFF.md`
  - `MonkeyMoltbook/STATUS.md`
  - `MonkeyMoltbook/docs/MVP.md`
- **Risks / blockers:**
  - must avoid feature creep beyond the locked MVP
  - hook quality and latency requirements are strict and must be proven, not assumed

### 3) LooksMaxx / FACEMAXX / LooksMaxxing
- **Status:** ACTIVE / RECENTLY SUBMITTED
- **Type:** Mobile app + local analysis backend
- **Path:** `/Users/moey/.openclaw/workspace/facemaxx-mobile`
- **Purpose:** face-analysis / looks review product with scan flow, battle mode, progression, and premium review funnel
- **Current state:**
  - strongest-preserved project in the workspace
  - app is in a strong local-build state, not just a mockup
  - local analysis backend is real and connected to the app
  - battle mode supports a real second-photo analysis
  - brand direction is now settled around **LooksMaxx**
- **Next step:** run a fresh visual/product review, tighten weak copy/labels, then continue backend/app refinement and first real sample collection
- **Key docs:**
  - `facemaxx-mobile/HANDOFF.md`
  - `facemaxx-mobile/STATUS.md`
  - `facemaxx-mobile/REVIEW_CHECKLIST.md`
  - `facemaxx-mobile/analysis-backend/README.md`
  - `facemaxx-mobile/LOOKSMAXXING_V2_ROADMAP.md`
- **Risks / blockers:**
  - scoring inconsistency across similar photos
  - battle-mode trust/reasoning weirdness
  - developer-ish labels leaking into UI

### 2) UFC betting engine / website
- **Status:** PAUSED / PARTIALLY RECOVERED
- **Type:** Website / data refresh system
- **Path:** `/Users/moey/.openclaw/workspace/ufc-operator-web`
- **Related path:** `/Users/moey/.openclaw/workspace/ufc-analytics`
- **Purpose:** UFC-related betting/data workflow with refresh automation plus the Vercel-hosted site `ufcpickspro.com`
- **Current state:**
  - live continuity now confirms a Vercel-hosted site at `https://www.ufcpickspro.com/`
  - live site is currently protected by **HTTP Basic Auth** on Vercel
  - Vercel dashboard evidence confirms the domain is active with third-party registrar/nameservers and Vercel CDN enabled
  - the visible local workspace snapshot is much thinner than the live deploy state
  - `ufc-operator-web/` currently appears to contain mostly handoff notes and logs, not the full site/app source
  - `ufc-analytics/` also appears log-heavy from the visible snapshot
  - refresh cadence was intentionally slowed down and the stale fast job was disabled
- **Next step:** if UFC resumes, recover the deploy/code truth in this order: Vercel project state, local env/config, refresh pipeline, then actual source location
- **Key docs:**
  - `ufc-operator-web/HANDOFF.md`
- **Risks / blockers:**
  - visible local snapshot does not currently preserve the full website/deploy implementation
  - important state may currently live in Vercel rather than the visible workspace
  - refresh scheduling may be fixed while the underlying job still fails

### 3) Social Clip OS
- **Status:** BACKGROUND / PARTIALLY DOCUMENTED
- **Type:** content clipping / overlay / template system
- **Path:** `/Users/moey/.openclaw/workspace/social-clip-os`
- **Purpose:** reusable clip-branding and content production system
- **Current state:**
  - project exists in active workspace
  - Kick lower-third template flow exists under `templates/kick/`
  - generator + preview + ffmpeg overlay workflow exists
  - continuity is thinner than LooksMaxx and UFC
- **Next step:** if resumed, generate fresh samples, inspect visual quality, and document the broader pipeline beyond the Kick template slice
- **Key docs:**
  - `social-clip-os/HANDOFF.md`
  - `social-clip-os/templates/kick/README.md`
- **Risks / blockers:**
  - current implementation may still not be visually shippable
  - broader project intent is not yet documented deeply enough

### 4) Kids gaming skill app
- **Status:** PAUSED / CONTINUITY LOST
- **Type:** Mobile/web game app
- **Current state:**
  - earlier progress likely existed beyond the earliest phase notes
  - final reliable completion-stage state was not preserved before a reset/freeze
- **Rule:** do not resume automatically unless Moey asks

### 5) KickChampz
- **Status:** BACKGROUND / STRATEGIC
- **Type:** content business / clipping growth system
- **Current state:**
  - still strategically relevant
  - not the current build focus unless Moey explicitly switches back to it
