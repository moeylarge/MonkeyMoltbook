# Deterministic Handoff — Mon + Chance Still Pass — 2026-03-25

## Goal
Produce one real Mon + Chance still candidate that can be honestly scored against the lock criteria.

## Best input set
Primary reference priority:
1. `references/04-mon-chance-story-shot.png`
2. `fal-input/04-mon-chance-upload-ref-close.jpg`
3. `fal-input/04-mon-chance-upload-ref-balanced.jpg`
4. `fal-input/04-mon-chance-upload-ref-wide.jpg`

Default prompt:
- `hero-still-prompt-v3.md`

Scoring doc:
- `keeper-rubric-v2.md`

## Exact run recommendation
### Preferred tool
- FAL Nano Banana Pro edit in browser

### Single-pass settings
- mode: image edit
- image count: 1 output
- resolution: default / 1K for evaluation pass
- aspect ratio: default unless a wider cinematic crop is required by the tool

### What to upload
Upload **one** reference first:
- `fal-input/04-mon-chance-upload-ref-close.jpg`

If the tool supports a second supporting reference without confusing composition, add:
- `fal-input/04-mon-chance-upload-ref-balanced.jpg`

Do not upload motion thumbs unless explicitly using them as reject-memory comparison.

## Pass/fail rule
After generation, score immediately:
- if it fails any fast reject trigger in `keeper-rubric-v2.md`, mark `REJECT`
- if it nearly works but drifts on one surgical issue, mark `NEAR MISS`
- only if it clears all three gates does it become `KEEPER`

## Motion rule
Do **not** click `Make Video` unless the still is scored `KEEPER`.

## Motion resume note — 2026-03-25 late pass
The still is now locked, and the rejected path is specifically the direct `fal-ai/veo2/image-to-video` route for this shot.

The next materially different path is now identified and packaged:
- engine: `fal-ai/kling-video/o1/reference-to-video`
- prompt: `motion-prompt-v3-kling-o1-reference.md`
- runner: `run_direct_motion_pass_v3_kling_o1_reference.mjs`
- padded carrier for aspect-ratio compliance: `fal-input/04-mon-chance-locked-still-square-pad.png`

Current blocker:
- fal returned `HTTP 403 Forbidden` with `User is locked. Reason: Exhausted balance.` before inference

Resume rule:
- top up fal billing first
- rerun the exact Kling O1 reference pass unchanged before trying any other motion engine or changing the still

## Current truth at handoff
A real FAL browser pass was completed on 2026-03-25 and saved as:
- `outputs/mon-chance-nano-banana-pass-2026-03-25.png`

That pass is **REJECT**, because it drifted away from the approved wardrobe/world/character silhouette into generic cafe-streetwear realism.
