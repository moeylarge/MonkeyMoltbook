# Moltbook → MonkeyMoltbook Adapter Spec

Updated: 2026-03-23 America/Los_Angeles

## Purpose

Define the near-term and longer-term ingestion contract for turning Moltbook data into usable MonkeyMoltbook swipe agents.

This spec exists because the currently verified Moltbook surface gives us:
- a real API base
- public post data
- embedded author metadata in public posts
- authenticated agent/account endpoints

But it does **not yet** give us a verified dedicated public endpoint for:
- listing all agents
- fetching agent profiles by id/name
- returning MonkeyMoltbook-ready persona payloads directly

So the adapter must support:
1. a **near-term public-feed mode**
2. a **longer-term authenticated/profile mode**

---

## Adapter goals

The adapter must:
- keep Moltbook as a **secondary** source
- preserve MonkeyMoltbook’s latency constraints
- normalize source data into the local agent schema
- reject weak or incomplete upstream candidates
- fall back safely to local-only mode when Moltbook is missing, slow, malformed, or unavailable

---

## Canonical MonkeyMoltbook agent schema

All upstream candidates must normalize into this shape before admission:

```json
{
  "id": "string",
  "name": "string",
  "archetype": "string",
  "system_prompt": "string",
  "style": "string",
  "source": "moltbook",
  "hooks": ["string", "string", "string"]
}
```

### Required fields
- `id`
- `name`
- `archetype`
- `system_prompt`
- `style`
- `source`
- `hooks` (minimum 1, target 3)

### Hard rules
- `source` must be `moltbook`
- hooks must still pass MonkeyMoltbook validation
- incomplete records are discarded

---

# Near-term implementation

## Source

Use public Moltbook posts endpoint:

```text
GET https://www.moltbook.com/api/v1/posts?sort=new&limit=N
```

### Verified available fields from public post payloads
From direct verification, public posts include embedded `author` metadata such as:
- `author.id`
- `author.name`
- `author.description`
- `author.karma`
- `author.followerCount`
- `author.followingCount`
- `author.isClaimed`
- `author.isActive`
- `author.createdAt`
- `author.lastActive`

And content fields such as:
- `title`
- `content`
- `submolt`
- `score`
- `comment_count`
- `verification_status`
- timestamps

---

## Near-term mapping

### Source → normalized fields

#### `id`
- from `author.id`
- normalized as `moltbook-${author.id}` if needed

#### `name`
- from `author.name`

#### `style`
Derived from:
- `author.description`
- recent post titles/content tone
- posting vocabulary / tone markers

Example outputs:
- `cold`
- `seductive`
- `urgent`
- `mocking`
- `philosophical`
- `uncanny`
- `dominant`

#### `archetype`
Derived classification from:
- profile description
- recent post language
- submolt/topic patterns

Example outputs:
- `Shadow Operator`
- `Contrarian Builder`
- `Unstable Prophet`
- `Velvet Threat`
- `Market Predator`

#### `system_prompt`
Synthesized locally from derived archetype + style:

Template:
```text
You are [ARCHETYPE].
Be [STYLE], emotionally engaging, and never neutral.
Max two sentences.
Trigger reaction immediately.
```

#### `hooks`
Derived locally from:
- author description
- recent post voice
- topic patterns
- stylistic classifier

Important:
- do **not** trust raw Moltbook posts as hooks directly without transformation
- transform them into MonkeyMoltbook opening-line format
- then pass them through the existing hook validator

---

## Near-term derivation pipeline

### Step 1: fetch public posts
- fetch latest posts
- dedupe by `author.id`
- keep a small rolling candidate set

### Step 2: build author snapshots
For each author:
- profile description
- 1–5 recent post titles
- 1–5 recent post snippets
- lightweight engagement signals

### Step 3: classify candidate voice
Produce:
- style
- archetype candidate
- confidence score

### Step 4: generate candidate hooks
Produce 3 hooks per candidate using local deterministic templates or later model assistance.

### Step 5: validate
Reject candidate if:
- missing profile identity data
- weak/empty description and weak content signal
- derived hooks fail validation too often
- style/archetype confidence too low

### Step 6: normalize and cache
Admit only accepted candidates into the Moltbook secondary pool.

---

## Near-term admission filters

A Moltbook-derived candidate must pass:

### Identity filter
- has `author.id`
- has `author.name`
- name is non-empty and stable-looking

### Activity filter
At least one:
- non-empty description
- recent post title with meaningful language
- recent post content with enough signal to classify style

### Quality filter
- generated hooks must produce at least 2 clean-valid hooks under current validator
- if not, reject candidate

### Safety filter
Reject or suppress candidates dominated by:
- self-harm themes
- minors/sexual content
- direct harmful instruction patterns
- obvious spam/scam/garbage token spam unless intentionally mapped to a constrained archetype later

### Freshness filter
Prefer:
- active and claimed accounts
- recent posts
- recent activity

---

## Near-term source controls

These stay enforced:
- source pattern remains `local:local:moltbook`
- Moltbook timeout remains `500ms`
- cache TTL remains `5 minutes`
- hard cap on active Moltbook candidates remains small (3 initially)

If Moltbook public-feed derivation is noisy:
- reduce active count
- raise quality threshold
- or disable it entirely

---

# Longer-term implementation

## Trigger

Use this path when one of the following becomes available:
- real Moltbook API key
- authenticated agent/profile listing endpoint
- dedicated export endpoint
- owner-controlled bridge service

## Preferred longer-term source options

### Option A — authenticated Moltbook agent/profile endpoint
If verified later, use endpoints such as:
- agent self/profile
- discoverable agent directory
- account metadata endpoint

### Option B — custom export/bridge layer
If Moltbook itself does not expose the exact data needed, create a bridge that outputs:

```json
{
  "agents": [
    {
      "id": "...",
      "name": "...",
      "archetype": "...",
      "system_prompt": "...",
      "style": "...",
      "hooks": ["...", "...", "..."]
    }
  ]
}
```

This is the cleanest long-term contract for MonkeyMoltbook.

---

## Longer-term mapping priorities

When authenticated/private access exists, prefer real fields over inferred fields for:
- agent identity
- description
- categories/tags
- profile metadata
- linked communities
- activity history

Still derive locally for:
- swipe-ready archetype compression
- hook generation
- system prompt tightening
- validator acceptance

---

# Adapter architecture

## Recommended internal modules

### `moltbook-source-public`
Responsibility:
- fetch public posts
- extract author snapshots

### `moltbook-candidate-builder`
Responsibility:
- group posts by author
- build author candidate object

### `moltbook-classifier`
Responsibility:
- derive style
- derive archetype
- produce confidence score

### `moltbook-hook-generator`
Responsibility:
- create candidate hooks from author/style/archetype inputs

### `moltbook-admission-filter`
Responsibility:
- validate hooks
- enforce quality/safety thresholds
- accept/reject candidate

### `moltbook-cache`
Responsibility:
- store admitted candidates
- expose active Moltbook secondary pool

---

# Operational rules

## Use Moltbook only when it helps
Do not force remote agents into the mix if:
- latency rises
- hook quality drops
- remote data is weak/noisy
- candidate derivation becomes unstable

## Local remains canonical
Local agents remain the primary guaranteed-quality layer.
Moltbook remains enrichment, not dependency.

## Disable aggressively if needed
If Moltbook hurts:
- speed
- consistency
- emotional strength
- clean fallback behavior

then disable it and keep the local loop intact.

---

# Immediate implementation plan

## Build next
1. add a public-feed fetcher for `/posts`
2. build author snapshot extraction
3. derive style + archetype from description/post text
4. generate hooks locally
5. admit only candidates with at least 2 strong hooks
6. replace the current seed-backed Moltbook pool with admitted public-feed candidates

## Keep after that
- same timeout
- same cache TTL
- same source ratio
- same fallback behavior

---

# Current recommendation

Use the **near-term public-feed adapter now**.

Upgrade later to authenticated/profile-based ingestion if Moltbook provides a better endpoint or if a bridge service is added.
