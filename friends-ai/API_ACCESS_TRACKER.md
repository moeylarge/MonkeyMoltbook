# FRIENDS AI
## API ACCESS TRACKER

This document tracks what access is needed for the chosen production stack.

Status labels:
- `HAVE`
- `NEED_ACCOUNT`
- `NEED_API_KEY`
- `NEED_BILLING`
- `OPTIONAL_LATER`
- `NOT_NEEDED_NOW`
- `TEST_FIRST`

---

# 1) CORE STACK ACCESS TRACKER

## Midjourney
- role: vibe exploration / early concept-art lane
- access type: account / Discord or web workflow
- status: `NEED_ACCOUNT`
- API required?: no standard direct API assumed
- notes: useful for style exploration, not the main automation path

## Flux via Replicate
- role: previously considered repeatable still generation / identity lock path
- access type: API
- status: `NOT_NEEDED_NOW`
- billing likely needed: yes
- notes: blocked by Cloudflare 1010 in the current environment; removed from active stack

## Flux via Fal
- role: active repeatable still generation / identity lock path
- access type: API
- status: `HAVE`
- billing likely needed: yes
- notes: authenticated and funded; now the active still-generation backbone for the project

## Kling
- role: primary cinematic video generation
- access type: account / possible API depending plan
- status: `NEED_ACCOUNT`
- API required?: maybe later, not required to begin testing
- notes: likely primary motion engine

## Runway
- role: secondary video engine / polish / alternates
- access type: account / possible API depending plan
- status: `NEED_ACCOUNT`
- API required?: maybe later
- notes: important backup and refinement path

## Hedra
- role: talking-character / dialogue animation
- access type: account / maybe API
- status: `TEST_FIRST`
- notes: test against HeyGen before locking

## HeyGen
- role: talking-character / dialogue animation
- access type: account / API likely available on some plans
- status: `TEST_FIRST`
- notes: evaluate versus Hedra first

## D-ID
- role: tertiary fallback for talking-character animation
- access type: account / API depending plan
- status: `OPTIONAL_LATER`
- notes: not first choice

## ElevenLabs
- role: primary character voices
- access type: account + likely API
- status: `NEED_ACCOUNT`
- billing likely needed: yes
- notes: strongest voice candidate currently

## Suno
- role: exploratory original music generation
- access type: account
- status: `TEST_FIRST`
- API required?: not needed now
- notes: compare with Udio if desired

## Udio
- role: exploratory original music generation
- access type: account
- status: `TEST_FIRST`
- API required?: not needed now
- notes: compare with Suno if desired

## Photoshop
- role: cleanup / compositing / artifact repair
- access type: account/app
- status: `NEED_ACCOUNT`
- API required?: no
- notes: serious quality-control tool

## Magnific
- role: still enhancement / detail cleanup
- access type: account
- status: `NEED_ACCOUNT`
- API required?: no
- notes: useful but not first blocker

## Topaz Video AI
- role: final enhancement / upscale
- access type: account/app license
- status: `NEED_ACCOUNT`
- API required?: no
- notes: later-stage tool, not first blocker

## Premiere Pro
- role: final edit / assembly
- access type: account/app
- status: `TEST_FIRST`
- API required?: no
- notes: if not preferred, Resolve may replace it

## DaVinci Resolve
- role: final edit / assembly alternative
- access type: app
- status: `TEST_FIRST`
- API required?: no
- notes: choose based on preference and existing setup

---

# 2) PRIORITY ORDER FOR ACCESS ACQUISITION

## Tier 1 — required to begin serious production tests
1. Midjourney or equivalent vibe tool
2. one Flux API path (Replicate preferred first)
3. Kling
4. Runway
5. ElevenLabs

## Tier 2 — required before dialogue-heavy pilot completion
6. Hedra or HeyGen
7. Photoshop

## Tier 3 — useful polish / refinement tools
8. Magnific
9. Topaz Video AI
10. Suno or Udio

## Tier 4 — optional / later / fallback
11. Fal if Replicate already works
12. D-ID
13. Luma
14. CapCut / secondary edit utilities

---

# 3) EARLIEST UNBLOCKED STACK

If we want the minimum stack to begin real production experiments, we need:
- Midjourney (or alternative style exploration path)
- Replicate or Fal for Flux access
- Kling
- Runway
- ElevenLabs

That set alone unlocks:
- look development
- still canon testing
- early motion testing
- voice testing

---

# 4) QUESTIONS TO ANSWER TOOL-BY-TOOL

For each tool, verify:
- do we already have an account?
- do we already have paid access?
- does the needed plan include API?
- is manual UI good enough for now?
- is there a better substitute already available?

---

# 5) ACCESS LOG TEMPLATE

Use this format when checking each tool:

## Tool:
- account status:
- billing status:
- API status:
- can test now?:
- notes:

---

# 6) NEXT STEP

After this tracker, create or update:
- `IDENTITY_LOCK_RUNBOOK.md`

That runbook should say:
- which exact tool is used for each first-pass generation step
- in what order
- what gets reviewed after each batch
