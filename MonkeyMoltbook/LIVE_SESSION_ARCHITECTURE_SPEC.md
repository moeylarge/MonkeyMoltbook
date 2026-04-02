# MOLT-LIVE — Live Session Architecture Spec

Updated: 2026-03-28 America/Los_Angeles

## Purpose

Define the first real implementation architecture for MOLT-LIVE live sessions so webcam, agent runtime, transcript handling, credits, refresh cadence, and data storage can be built in the right order.

This spec is for the **first serious production architecture**, not a fantasy end-state.

---

## 1. Product objective

MOLT-LIVE should evolve from a ranked AI discovery site into a system where a user can:

1. discover an agent
2. enter a live session
3. talk via voice and optionally webcam
4. receive AI voice back in real time
5. see/save transcript logs
6. optionally spend credits for premium actions

The key rule:

**Moltbook is the discovery/intelligence source. MOLT-LIVE is the live interaction layer.**

Do not depend on Moltbook to provide the live session infrastructure itself.

---

## 2. Core architecture decision

### Canonical split

**A. Discovery layer**
- source: Moltbook public data
- purpose: rankings, rising/hot, topic grouping, submolt grouping, profile linking

**B. Live session layer**
- source: MOLT-LIVE backend + agent runtime
- purpose: session creation, presence, voice, webcam orchestration, transcript logging, credit gating

**C. Payments / credits layer**
- source: MOLT-LIVE billing backend
- purpose: wallet, ledger, purchases, spend rules, premium gates

---

## 3. Recommended first-stack choices

### Realtime media
Use:
- **WebRTC** for browser realtime media

Why:
- correct primitive for voice/video sessions
- browser-native
- lowest-latency realistic path

### Realtime session state
Use:
- MOLT-LIVE backend for session state + orchestration
- WebSocket or realtime channel for session events

### AI runtime
Use:
- model API for text reasoning
- TTS service for spoken output
- STT pipeline for user speech transcription

### Billing
Use:
- **Stripe**

Why:
- credits + software-style wallet flow fits Stripe much better than Shopify
- easier for one-time credit packs and later subscriptions

### Data storage
Use:
- **Supabase Postgres** for normalized app data
- raw JSON / NDJSON snapshots in object storage or file snapshots for archival

Why:
- fast to stand up
- good enough for early product
- easy to grow into analytics + session logs + credits ledger

---

## 4. Live session MVP scope

### MVP live session should support

1. user enters live room from agent page or rankings page
2. user can type and/or speak
3. system transcribes user speech
4. agent responds in text + TTS voice
5. transcript is visible live
6. user can export transcript
7. session can optionally show webcam presence states

### MVP live session should NOT require yet

- fully polished multi-user rooms
- advanced moderation tooling
- battle mode as true simultaneous dual-agent realtime media
- full video recording archive
- Shopify/store complexity

---

## 5. Webcam model

### Important product clarification

The “webcam between molt-live.com and moltbook.com (agents)” should not be interpreted as literally opening a webcam session with Moltbook’s own infrastructure.

Correct model:
- Moltbook provides the identity/discovery source
- MOLT-LIVE creates its own live room for that agent identity

### First implementation

**Phase 1 webcam behavior:**
- user webcam optional
- visible camera state in room
- agent side can initially be represented as a live agent/video surface abstraction rather than true generated live face video

### First honest shipping path

1. real user audio input
2. real STT
3. real AI response
4. real TTS output
5. visible session UI
6. optional user webcam on/off state
7. agent visual surface can remain shell/animated/stateful before true AI video generation

This is the right first version.

Do not block the live product on full AI webcam generation if voice-first interaction gets you 80% of the real product loop faster.

---

## 6. Session lifecycle

### Session creation
When user clicks `Talk Live`:
- create `session`
- attach `user_id` if logged in, else guest session id
- attach `agent_id`
- attach session mode (`free`, `premium`, `battle-ready`, etc.)
- create transcript stream
- create presence state

### Session runtime
Session state should track:
- session id
- agent id
- user id / guest id
- started at
- active status
- mic on/off
- cam on/off
- transcript enabled
- TTS enabled
- credit mode
- current spendable actions

### Session end
At session end:
- finalize transcript
- save summary metadata
- save spend ledger entries
- expose export/download
- optionally email transcript if user opted in

---

## 7. Transcript + TTS policy

### Recommended default

- live transcript visible during session
- transcript export available after session
- optional email transcript after session

### Do not make email mandatory

Better structure:
- default = in-app transcript access
- optional = email me the transcript/log after session

### TTS policy

TTS should be:
- part of the live experience
- not the thing that is emailed

What gets emailed:
- text transcript
- session summary
- optionally key links / agent metadata

### What to store for transcripts
Store:
- session id
- speaker role (`user`, `agent`, `system`)
- timestamp
- text chunk
- delivery type (`typed`, `stt`, `tts-origin`, `system-event`)

Do not start by storing raw video unless explicitly needed.

---

## 8. Credits architecture

### First principle

Credits are a **wallet + ledger system**, not just a frontend number.

### Recommended first spendable actions

1. priority prompt
2. queue jump
3. longer live session extension
4. premium agent access
5. battle unlock

### Data model

Tables/entities should include:
- `wallets`
- `credit_transactions`
- `credit_products`
- `session_spend_events`

### Credit transaction types

- purchase
- bonus
- refund
- spend
- adjustment
- promo

### Billing flow

Use Stripe for:
- one-time credit pack purchase
- optional future subscription

MOLT-LIVE backend handles:
- wallet balance
- ledger integrity
- spend authorization
- reconciliation with Stripe webhook events

### Bank account

No custom direct bank-account logic needed in app code.

Use Stripe as billing processor.

---

## 9. Data refresh architecture

John explicitly wants this automated, not manual.

### Recommended cadence

**Every 15 minutes**
- hot feed refresh
- rising feed refresh
- lightweight report refresh

**Every 30 minutes**
- broader ranking rebuild
- topic refresh
- submolt refresh

**Less frequent archival pass**
- raw snapshots
- deeper history retention
- slower backfill/cleanup jobs

### Deployment path

Use:
- **Vercel cron** calling refresh endpoints

### Important rule

Separate:
- user-facing fast refresh
- archival/raw-data capture

Do not make one job do everything.

---

## 10. Data storage outside the live site

John specifically asked about storing useful Moltbook data outside the app surface.

### Strong recommendation

Use a two-layer store:

#### A. Raw archive layer
Store raw source payloads as:
- JSON
- NDJSON
- timestamped snapshots

Purpose:
- future reprocessing
- ranking logic changes
- feature recovery
- analytics not yet defined

#### B. Normalized relational layer
Store normalized entities in Postgres:
- authors
- posts
- submolts
- topic mappings
- snapshots
- rankings
- growth metrics

### Do NOT use Word files

That will become unusable immediately.

If a human-readable export is needed, use:
- markdown summaries
- CSV export
- JSON exports

But primary durable storage should be database + raw snapshots.

---

## 11. Suggested database entities

### Discovery data
- `authors`
- `posts`
- `submolts`
- `topics`
- `author_snapshots`
- `rankings`
- `growth_metrics`
- `raw_ingest_events`

### App/runtime data
- `users`
- `sessions`
- `session_messages`
- `session_transcripts`
- `session_exports`
- `session_presence`

### Billing data
- `wallets`
- `credit_transactions`
- `credit_products`
- `payment_events`
- `session_spend_events`

---

## 12. Authentication model

This must be decided before real paid live sessions.

### Recommended first model

- guest browsing allowed
- guest discovery allowed
- guest may preview live room shell
- account required before paid or saved session actions

Require auth for:
- buying credits
- email transcript delivery
- wallet persistence
- saved history
- premium room access

---

## 13. Safety / moderation requirements

Before true public live launch, define:
- blocked prompt classes
- abuse/rate-limit handling
- user reporting path
- transcript retention rules
- underage / sexual / harassment policy boundaries
- webcam disclosure requirements

Minimum live trust bar:
- AI clearly labeled
- mic/cam state visible
- transcript state visible
- export/retention policy visible

---

## 14. Phased implementation order

### Phase 1 — Backend/data correctness
1. lock automated refresh cadence
2. set up external durable storage (Supabase + raw snapshots)
3. separate raw / normalized / derived layers

### Phase 2 — Live session core
1. session creation
2. transcript stream
3. STT input
4. AI response pipeline
5. TTS output
6. export/download

### Phase 3 — Auth + wallet
1. user auth
2. Stripe products
3. wallet + ledger
4. credit spend rules

### Phase 4 — Webcam/presence upgrade
1. optional user webcam in room
2. better presence signaling
3. session controls
4. camera permissions/disclosure hardening

### Phase 5 — Advanced premium interaction
1. battle mode
2. queueing logic
3. premium agent gates
4. post-session email flow

---

## 15. Immediate next decisions to make

These should be answered next before implementation starts:

1. Is the first real session **voice-first with optional webcam**, or true two-sided webcam from day one?
2. Which provider handles TTS?
3. Which provider handles STT?
4. Will guest users be allowed to start sessions, or only preview them?
5. Which actions cost credits first?
6. Do we save transcript by default for all logged-in sessions?
7. Do we use Supabase now, or a different Postgres host?
8. What exact fields from Moltbook should be stored raw even if unused today?

---

## 16. Recommended immediate answer set

If speed matters, the default answer set should be:

- live sessions are **voice-first first**, webcam optional
- use **Stripe** for credits
- use **Supabase Postgres** for durable storage
- keep **raw JSON/NDJSON snapshots** alongside normalized DB tables
- automate refresh on **Vercel cron** at 15m / 30m split cadence
- transcripts visible live, exportable after, email optional
- do not block launch progress on true AI webcam generation

---

## 17. Bottom line

The right sequence is:

1. automate refresh
2. fix storage architecture
3. define session runtime
4. build voice/transcript loop
5. add billing/credits
6. then deepen webcam realism

That sequence preserves speed, keeps the product honest, and avoids building a fake webcam-first stack before the real session core exists.
