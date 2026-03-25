# Mon + Chance Motion Pass 1 Scorecard — 2026-03-25

## Asset under test
- source still: `outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-4-cleanref.png`
- motion output: `motion-clips/2026-03-25/mon-chance-2026-03-25-motion-pass-1-veo2.mp4`
- motion meta: `motion-clips/2026-03-25/mon-chance-2026-03-25-motion-pass-1-veo2.json`
- review frames:
  - `review/motion-pass-1/frame-01.jpg`
  - `review/motion-pass-1/frame-02.jpg`
  - `review/motion-pass-1/frame-03.jpg`
  - `review/motion-pass-1/contact-sheet.jpg`
- model path: `fal-ai/veo2/image-to-video`
- duration: `8.0s`
- resolution: `1280x720`
- frame rate: `24 fps`

## Hard verdict
**REJECT**

## Gate scoring

### 1) Face stability
**FAIL**

What happened:
- Mon's face drifts materially across the clip.
- Mid-clip Mon softens into a less controlled, more mascot-coded read.
- End-frame Mon expression shifts too far toward a friendly/smiling look versus the locked guarded still.
- Chance is more stable than Mon, but still softens slightly through the blink/hold.

### 2) No twitch / morph drift
**FAIL**

What happened:
- The motion is not catastrophic, but there is visible morph drift in Mon's muzzle/eye area and overall facial family.
- The still's stronger facial precision is not preserved frame to frame.
- This is enough identity motion drift to break hero-lock trust.

### 3) Tension preserved or improved
**FAIL**

What happened:
- The locked still carries guarded-vs-dry-provocative tension.
- The generated motion relaxes that tension instead of sharpening it.
- By the final frame Mon reads warmer / more agreeable than the keeper still, which weakens the intended beat.

### 4) No trust-breaking background / identity degradation
**PASS with caution**

What held:
- Central Peak-style background continuity stays broadly intact.
- No obvious signage contamination reappears.
- Wardrobe and overall pair geometry remain serviceable.

What still misses:
- Identity degradation is the trust-breaking issue here, even though the background is mostly fine.

## Summary
This motion pass proves the keeper still can be animated through a direct one-pass Veo 2 path without catastrophic scene collapse, but it does **not** preserve the still's key advantage: Mon's controlled guarded face and the pair's precise emotional tension. The clip makes the locked still worse, so it fails the motion gate immediately.

## Decision
- do **not** promote this clip into the pilot package
- keep the pass-4 clean-reference still as the still-side lock
- reopen motion path selection / prompting only; do **not** reopen still generation yet
