# Mon + Chance Motion Pass 2 Scorecard — Veo 2 Minimal — 2026-03-25

## Asset under test
- source still: `outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-4-cleanref.png`
- motion output: `motion-clips/2026-03-25/mon-chance-2026-03-25-motion-pass-2-veo2-minimal.mp4`
- motion meta: `motion-clips/2026-03-25/mon-chance-2026-03-25-motion-pass-2-veo2-minimal.json`
- prompt: `motion-prompt-v2-minimal.md`
- runner: `run_direct_motion_pass_v2_minimal.mjs`
- review frames:
  - `review/motion-pass-2/frame-01.jpg`
  - `review/motion-pass-2/frame-02.jpg`
  - `review/motion-pass-2/frame-03.jpg`
  - `review/motion-pass-2/contact-sheet.jpg`
- model path: `fal-ai/veo2/image-to-video`
- duration: `5.0s`
- resolution: `1280x720`
- frame rate: `24 fps`

## Hard verdict
**REJECT**

## Gate scoring

### 1) Face stability
**FAIL**

What happened:
- Mon does not hold the locked facial family through the middle of the clip.
- Mid-frame Mon shifts into a rounder, friendlier, less guarded read than the keeper still.
- Chance also changes materially around the eyes / muzzle through the blink-and-gesture section.

### 2) No twitch / morph drift
**FAIL**

What happened:
- The shorter runtime reduces total exposure but does not solve identity drift.
- Chance's talking hand is rewritten into a larger gesture arc than the still implies.
- Mon's cup / upper-body hold changes enough to feel re-authored rather than minimally animated.
- Facial morph drift remains visible in the center frame.

### 3) Tension preserved or improved
**FAIL**

What happened:
- The still's power comes from Mon holding a tight guarded line while Chance lightly presses.
- Pass 2 weakens that exact beat by softening Mon and broadening Chance's gesture performance.
- The result reads more generic and animated, not more charged.

### 4) No trust-breaking background / identity degradation
**PASS with caution**

What held:
- Central Peak continuity remains broadly usable.
- No obvious signage contamination returns.
- Wardrobe family remains intact.

What still misses:
- Identity and performance drift remain the trust-breaking issue.

## Summary
This was the correct controlled retry: same locked still, shorter runtime, no push-in, and much stricter micro-motion prompting. It still fails. The model continues to rewrite facial expression and gesture behavior instead of preserving the keeper still. That means the current direct Veo 2 image-to-video path is not reliable enough for this hero-lock shot.

## Decision
- do **not** promote this clip into the pilot package
- keep the pass-4 clean-reference still as the still-side lock
- keep pass 2 as audit memory only
- treat the current direct Veo 2 path as **motion-path rejected for this shot** unless a materially different model/control method is used
- next best action: test a different motion path with stronger still-preservation controls rather than prompt-tuning this same path again
