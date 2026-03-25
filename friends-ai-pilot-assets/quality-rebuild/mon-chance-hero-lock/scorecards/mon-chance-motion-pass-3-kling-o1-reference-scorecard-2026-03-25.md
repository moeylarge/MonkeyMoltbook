# Mon + Chance Motion Pass 3 — Kling O1 Reference — Scorecard — 2026-03-25

## Verdict
**PASS**

## Attempt type
- materially different path from rejected direct Veo 2 image-to-video
- engine: `fal-ai/kling-video/o1/reference-to-video`
- control strategy: reference-conditioned motion using the locked still as start-frame/reference anchor
- aspect workaround required: model does not support `4:3`, so a square padded carrier was created from the locked still without changing the locked still content
- execution note: the originally prepared queue runner hit a FAL transport/API retrieval mismatch on this partner endpoint, so the exact same prepared input package was executed through the direct blocking `fal.run` path to complete one real controlled attempt

## Inputs
- locked still: `outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-4-cleanref.png`
- square padded carrier: `fal-input/04-mon-chance-locked-still-square-pad.png`
- prompt: `motion-prompt-v3-kling-o1-reference.md`
- runner used for successful execution: `run_direct_motion_pass_v3_kling_o1_reference_sync.mjs`
- output clip: `motion-clips/2026-03-25/mon-chance-2026-03-25-motion-pass-3-kling-o1-reference.mp4`
- payload audit: `motion-clips/2026-03-25/mon-chance-2026-03-25-motion-pass-3-kling-o1-reference.json`
- review frames:
  - `review/motion-pass-3-kling-o1-reference/frame-01.jpg`
  - `review/motion-pass-3-kling-o1-reference/frame-02.jpg`
  - `review/motion-pass-3-kling-o1-reference/frame-03.jpg`
  - `review/motion-pass-3-kling-o1-reference/contact-sheet.jpg`

## Gate scoring

### 1. Face stability
**PASS**

- Chance stays in-family across the clip, with the blink reading as natural rather than identity drift.
- Mon moves more than the locked still, but her face shape, eye family, and guarded read remain recognizably tied to the approved still.
- This is materially more stable than both rejected Veo 2 passes.

### 2. Still-preservation trust
**PASS**

- The shot still reads like the locked Mon + Chance keeper gently came alive.
- Mug position, wardrobe family, cafe continuity, and pair spacing stay trustworthy.
- The square-pad workaround is visible as a format compromise, but it does not break shot trust inside the live image area.

### 3. Tension preserved or improved
**PASS**

- The emotional power balance survives.
- Chance remains lightly amused and pressing.
- Mon remains controlled / affected rather than melting into a soft smile or generic animated friendliness.
- The brief downward glance adds life without collapsing the guarded tension.

### 4. No trust-breaking identity/background degradation
**PASS**

- No obvious identity rewrite.
- No background contamination or signage relapse.
- No severe anatomy or gesture corruption.
- No trust-breaking environment drift.

## What is still not perfect
- The required `1:1` carrier/pad makes this less elegant than a native `4:3` path would be.
- Mon's motion is slightly more active than the ideal near-still brief.
- This is passable hero-shot motion, not yet a mathematically perfect preservation clip.

## Why this still passes
The pass bar here is not “zero change.” It is whether the motion clip preserves the locked still strongly enough to remain trustworthy as the hero beat. This attempt finally clears that bar. The clip keeps identity, tension, and Central Peak continuity intact instead of rewriting them, which is the exact failure mode that killed the two prior Veo 2 passes.

## Conclusion
Use this as the current approved Mon + Chance motion keeper for the hero beat.

## Next move
- keep the locked still fixed
- keep this Kling O1 motion clip as the current motion keeper
- if a later polish pass is desired, it should be framed as optional quality improvement, not blocker-clearing rescue work
- no GitHub skill / external workflow escalation is warranted from this result
