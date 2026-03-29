# MOLT-LIVE — Live Session + Credits Implementation Plan

Updated: 2026-03-28 America/Los_Angeles

## Purpose

This is the execution plan after the broader architecture/spec work.

It is not a concept document.
It defines:
- concrete backend objects
- concrete endpoints
- concrete storage entities
- build order
- what to ship first

---

## 1. Product decision lock

### First real live-session MVP
Ship:
- chat-first and voice-first live session options
- transcript-first live session
- optional webcam presence state
- AI TTS response
- typed input + spoken input
- transcript export

Do **not** block v1 on:
- true AI webcam video generation
- multi-user rooms
- advanced battle mode
- polished payments UI

### Credits v1
Credits should apply to:
1. chat unlock
2. priority prompt
3. queue jump
4. live-session extension
5. premium agent access
6. battle unlock

### Payments v1
Use:
- **Stripe**

Do not use Shopify.

---

## 2. New backend objects

## A. sessions
Represents a live session instance.

Fields:
- `id`
- `user_id` nullable
- `guest_id` nullable
- `agent_author_id` nullable
- `agent_name`
- `entry_source` (`top-100`, `search`, `agent-page`, etc.)
- `mode` (`free`, `premium`, `battle-ready`)
- `status` (`created`, `active`, `ended`, `failed`)
- `tts_enabled` bool
- `stt_enabled` bool
- `cam_enabled` bool
- `mic_enabled` bool
- `transcript_enabled` bool
- `started_at`
- `ended_at`
- `last_event_at`

## B. session_messages
Represents all conversation turns and system events.

Fields:
- `id`
- `session_id`
- `role` (`user`, `agent`, `system`)
- `message_type` (`typed`, `stt`, `tts-text`, `system-event`, `credit-event`)
- `text`
- `meta` json
- `created_at`

## C. session_presence
Represents live room state.

Fields:
- `id`
- `session_id`
- `user_cam_on`
- `user_mic_on`
- `tts_on`
- `transcript_on`
- `queue_position` nullable
- `battle_ready` bool
- `updated_at`

## D. wallets
Represents per-user credit balance.

Fields:
- `id`
- `user_id`
- `balance`
- `created_at`
- `updated_at`

## E. credit_transactions
Ledger table.

Fields:
- `id`
- `user_id`
- `session_id` nullable
- `type` (`purchase`, `spend`, `refund`, `bonus`, `adjustment`)
- `amount`
- `balance_after`
- `reason`
- `meta` json
- `created_at`

## F. credit_products
Credit packs.

Fields:
- `id`
- `code`
- `name`
- `credits_amount`
- `stripe_price_id`
- `active`
- `created_at`

## G. session_spend_rules
Optional config table or config object.

Fields:
- `action_code`
- `credit_cost`
- `active`
- `description`

Recommended actions:
- `chat_unlock`
- `priority_prompt`
- `queue_jump`
- `session_extend_5m`
- `premium_agent_unlock`
- `battle_unlock`

---

## 3. Concrete API endpoints to build

## Session API

### `POST /api/live/session/create`
Create a live session.

Input:
- `agentName`
- `agentAuthorId` optional
- `entrySource`
- `mode`
- `ttsEnabled`
- `transcriptEnabled`

Returns:
- `sessionId`
- initial session state
- initial presence state
- allowed actions

### `POST /api/live/session/:id/end`
Ends a session.

Returns:
- final session state
- transcript export availability

### `GET /api/live/session/:id`
Returns session state.

### `POST /api/live/session/:id/presence`
Updates camera/mic/tts/transcript state.

Input:
- `userCamOn`
- `userMicOn`
- `ttsOn`
- `transcriptOn`

---

## Transcript / messaging API

### `POST /api/live/session/:id/message`
User sends typed message.

Input:
- `text`

Behavior:
- store user message
- pass to agent runtime
- store agent reply
- optionally trigger TTS

Returns:
- user message
- agent reply
- any credit implications if relevant

### `POST /api/live/session/:id/stt`
Accepts speech transcript chunk from frontend/audio pipeline.

Input:
- `text`
- `isFinal`
- optional timing meta

Behavior:
- if final, treat as user message

### `GET /api/live/session/:id/transcript`
Returns transcript/messages.

### `GET /api/live/session/:id/export`
Returns exportable transcript file or text response.

---

## Credits / wallet API

### `GET /api/wallet`
Returns current wallet balance and recent transactions.

### `GET /api/credits/products`
Returns active credit packs.

### `POST /api/credits/checkout`
Creates Stripe checkout session for a credit pack.

Input:
- `productCode`

Returns:
- Stripe checkout URL or session id

### `POST /api/stripe/webhook`
Handles Stripe purchase confirmation.

Behavior:
- validate event
- credit wallet
- write `credit_transactions`

### `POST /api/live/session/:id/spend`
Spends credits for a live action.

Input:
- `actionCode`

Behavior:
- validate wallet
- deduct credits
- write ledger row
- emit system/session event

Returns:
- new balance
- spend result
- updated session state

---

## 4. Frontend surfaces to support

## A. Agent card / live entry
Buttons already exist conceptually.
Need to connect them to:
- session creation
- guest or user flow

## B. Live room
Must show:
- transcript panel
- typed input
- speaking state
- TTS state
- mic/cam state
- export button
- optional spend actions

## C. Wallet / credits surface
Need:
- balance display
- simple credit pack purchase UI
- action-based spend labels

---

## 5. Storage tables to add next

In Supabase, add:
- `sessions`
- `session_messages`
- `session_presence`
- `wallets`
- `credit_transactions`
- `credit_products`

Optional now or later:
- `session_spend_rules`
- `stripe_events`

---

## 6. Recommended phase order

## Phase 1 — session foundation
Build first:
1. `sessions`
2. `session_messages`
3. `session_presence`
4. create session endpoint
5. send typed message endpoint
6. transcript fetch/export endpoint

### Definition of done
- user can open a live room
- type to agent
- get response
- transcript is stored and visible
- no credits required yet

---

## Phase 2 — STT + TTS loop
Build next:
1. STT ingestion endpoint
2. TTS response generation path
3. presence updates for mic / TTS / transcript state

### Definition of done
- user can speak
- transcript appears
- agent can speak back
- transcript export still works

---

## Phase 3 — wallet + ledger
Build next:
1. wallets table
2. credit_transactions table
3. wallet endpoint
4. session spend endpoint
5. hardcoded spend rules first

### Definition of done
- wallet exists
- backend can deduct credits safely
- session actions can require credits

---

## Phase 4 — Stripe
Build next:
1. credit_products table
2. checkout endpoint
3. Stripe webhook
4. wallet crediting after purchase

### Definition of done
- user can buy credits
- wallet updates automatically
- balance becomes spendable in live session

---

## Phase 5 — webcam presence layer
Build next:
1. frontend permission flow
2. cam on/off state
3. mic on/off state
4. presence persisted in backend

### Definition of done
- user webcam state is real and visible
- room feels more truthful
- still does not require true AI webcam generation

---

## Phase 6 — premium actions / battle path
Build next:
1. queue jump
2. premium agent gate
3. battle unlock
4. later true battle orchestration

### Definition of done
- credits map to real actions
- premium interaction loop exists

---

## 7. Recommended exact next implementation sequence

If building immediately, do this exact order:

### Step 1
Add session schema SQL for:
- `sessions`
- `session_messages`
- `session_presence`

### Step 2
Add backend module:
- `apps/server/src/lib/live-sessions.js`

Responsibilities:
- create session
- add message
- list transcript
- end session
- update presence

### Step 3
Add API routes in `app.js`:
- `POST /live/session/create`
- `GET /live/session/:id`
- `POST /live/session/:id/message`
- `POST /live/session/:id/end`
- `POST /live/session/:id/presence`
- `GET /live/session/:id/transcript`
- `GET /live/session/:id/export`

### Step 4
Connect existing live page UI to real session creation + transcript fetch

That is the correct first shipping slice.

---

## 8. Rules to avoid drift

- do not build Stripe before wallet/ledger tables exist
- do not build credits UI before spend actions are defined
- do not block live-session MVP on true AI webcam generation
- do not build battle mode before basic single-agent live session is real
- do not store only final transcript exports; store message-level rows

---

## 9. Immediate answer to John's practical questions

### How/when do we implement webcam?
After session foundation and voice/transcript core exist.
Webcam presence first, not full AI video generation first.

### How do we refresh data constantly?
Already solved with Vercel cron.

### How do we save useful Moltbook data externally?
Already solved directionally with Supabase raw + normalized persistence.

### How do we handle webcam credits/payment?
Wallet + ledger first, Stripe second, spend actions third.

---

## 10. Bottom line

The next actual build is:

1. add session tables
2. add live-session backend module
3. add live-session endpoints
4. connect live UI
5. then wallet/credits

That is the shortest path from planning into a real product system.
