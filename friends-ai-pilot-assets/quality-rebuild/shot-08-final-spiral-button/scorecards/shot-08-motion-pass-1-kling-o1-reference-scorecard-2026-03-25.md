# Shot 08 Motion Pass 1 — Kling O1 Reference — Scorecard — 2026-03-25

## Verdict
**REJECT**

## Attempt type
- engine: `fal-ai/kling-video/o1/reference-to-video`
- control strategy: reference-conditioned restrained motion using the locked still as both start-frame carrier and fidelity reference
- aspect workaround required: model does not support native `4:3`, so a square padded carrier was created from the locked still without reopening still generation
- execution note: one local prep invocation failed before submission because the square-pad file was not written; the single real model attempt was the subsequent successful submission using the same prepared package

## Inputs
- locked still: `outputs/2026-03-25/shot-08-final-spiral-2026-03-25-direct-pass-2-strongclean-v2.png`
- square padded carrier: `fal-input/08-final-spiral-locked-still-square-pad.png`
- prompt: `motion-prompt-v1-kling-o1-reference.md`
- runner used for successful execution: `run_direct_motion_pass_v1_kling_o1_reference_sync.mjs`
- output clip: `motion-clips/2026-03-25/shot-08-final-spiral-2026-03-25-motion-pass-1-kling-o1-reference.mp4`
- payload audit: `motion-clips/2026-03-25/shot-08-final-spiral-2026-03-25-motion-pass-1-kling-o1-reference.json`
- review frames:
  - `review/motion-pass-1-kling-o1-reference/frame-01.jpg`
  - `review/motion-pass-1-kling-o1-reference/frame-02.jpg`
  - `review/motion-pass-1-kling-o1-reference/frame-03.jpg`
  - `review/motion-pass-1-kling-o1-reference/contact-sheet.jpg`

## Motion gate scoring

### 1. Face stability
**REJECT**

- Multiple faces drift materially away from the locked still.
- Mon softens and rotates into a different performance instead of preserving the tighter affected read.
- Chance becomes broader and more generic, losing the still's sly-control precision.

### 2. Still-preservation trust
**REJECT**

- The shot does not read like the locked still gently came alive.
- Major pose/layout details rewrite immediately: the giraffe arm/head pose changes, the hippo paper and mouth performance change, and the swan gesture/body read shifts.
- The square-pad workaround is acceptable in principle, but the generated live image itself is not faithful enough to the keeper still.

### 3. Ensemble reaction hierarchy
**REJECT**

- Mon no longer cleanly anchors the strongest reaction.
- Supporting ensemble reads flatten into a softer generic group reaction instead of the locked button hierarchy.
- Distinct six-character reaction clarity is weakened rather than preserved.

### 4. No trust-breaking identity/background degradation
**PASS with caveat**

- No obvious readable signage relapse was introduced.
- Character count remains six and the cafe world broadly stays intact.
- But identity/pose drift is already severe enough to fail the clip even without a signage break.

## Why this fails
The requirement was one restrained motion pass that preserved the locked keeper still's exact ensemble logic. This attempt breaks trust immediately by rewriting acting, posture, and key silhouette information across the group. The clip is not a gentle animation of the approved still; it is a new interpretation of the scene.

## Conclusion
Do not use this motion clip as a keeper. Preserve it only as audit memory.

## Next move
Keep the Shot 08 still locked and do not run more motion variants in this line. The single best next action is to move on to the next shot or sequence need, using the locked still as the final Shot 08 still deliverable unless John explicitly reopens motion strategy.