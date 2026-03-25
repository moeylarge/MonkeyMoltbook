# Mon + Chance Hero Lock Package

## Purpose
Deterministic workspace package for locking the Mon + Chance hero shot before any broader final-generation pass.

This folder exists so the next generation pass does not depend on browser memory, vague prompt memory, or scattered references.

## Current verdict
The Mon + Chance hero still is now **benchmark-grade / keeper-approved** via the cleaned-reference deterministic pass on 2026-03-25.

### Strongest existing candidate assets
1. Canonical still reference:
   - `references/04-mon-chance-story-shot.png`
2. Approved cleaned bound reference for deterministic reruns:
   - `fal-input/04-mon-chance-upload-ref-close-cleaned.jpg`
3. Hero-still keeper:
   - `outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-4-cleanref.png`
4. Current motion-review stills from prior attempts:
   - `review/current-motion-thumb-output.jpg`
   - `review/current-motion-thumb-output-1.jpg`
   - `review/current-motion-thumb-output-2.jpg`

## Asset assessment

### `04-mon-chance-story-shot.png`
Why it matters:
- clearly contains the right pair composition and cafe world
- preserves the core Mon/Chance beat geometry
- best available workspace anchor for the pair

Why it does not pass yet:
- still reads more like an early-style board frame than a premium final episode frame
- emotional specificity is not strong enough yet
- character finish still drifts toward mascot-coded softness instead of premium AI-cinema realism

### `04-mon-chance-upload-ref.jpg`
Why it matters:
- best packaged seed for FAL/manual upload workflows
- already normalized for browser upload use

Use rule:
- use this as the default upload reference unless a newly approved still replaces it

### prior motion thumbs
Use only as failure memory:
- they show the current visual family
- they do not constitute a pass
- do not treat previous motion existence as proof of style lock

## Directory roles
- `references/` = canonical still references
- `fal-input/` = upload-ready files for next still-generation pass
- `outputs/` = place new still winners and approved exports here
- `review/` = thumbs, audits, reject examples, notes

## Naming rules for next pass
Approved still candidate naming:
- `outputs/mon-chance-still-a01.png`
- `outputs/mon-chance-still-a02.png`
- etc.

Approved motion candidate naming:
- `outputs/mon-chance-motion-a01.mp4`
- `outputs/mon-chance-motion-a02.mp4`

Rejected/browser-captured review stills:
- `review/reject-mon-chance-still-a01.jpg`
- `review/reject-mon-chance-motion-a01-frame.jpg`

## Pass rule
Do not place anything in `outputs/approved/` or call it locked unless it clears:
1. still gate
2. motion gate
3. episode-fit gate

as defined in:
- `friends-ai-pilot-assets/MON_CHANCE_QUALITY_LOCK.md`

## Recommended next prompt path
Use `hero-still-prompt-v3.md` first.
Score with `keeper-rubric-v2.md`.
Only animate a still that passes review.

## Latest real pass status
A real FAL browser still pass was completed on 2026-03-25.
Saved result:
- `outputs/mon-chance-nano-banana-pass-2026-03-25.png`

Multiple deterministic direct FAL still passes were then completed on 2026-03-25, culminating in a cleaned-reference keeper run.
Saved keeper result:
- `outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-4-cleanref.png`
- `outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-4-cleanref.json`
- runner: `run_direct_still_pass.mjs`
- bound source: `fal-input/04-mon-chance-upload-ref-close-cleaned.jpg`
- scorecard: `scorecards/mon-chance-direct-pass-4-cleanref-scorecard-2026-03-25.md`

Verdict:
- **PASS / KEEPER** for the still only
- browser pass = failure-memory only because binding was untrustworthy
- direct cleaned-reference pass = approved hero-lock still
- motion path status: current direct Veo 2 image-to-video path is **REJECTED for this shot** after two failed audits

Latest motion audit assets:
- pass 1 clip: `motion-clips/2026-03-25/mon-chance-2026-03-25-motion-pass-1-veo2.mp4`
- pass 1 scorecard: `scorecards/mon-chance-motion-pass-1-veo2-scorecard-2026-03-25.md`
- pass 2 minimal clip: `motion-clips/2026-03-25/mon-chance-2026-03-25-motion-pass-2-veo2-minimal.mp4`
- pass 2 minimal scorecard: `scorecards/mon-chance-motion-pass-2-veo2-minimal-scorecard-2026-03-25.md`
- latest review contact sheet: `review/motion-pass-2/contact-sheet.jpg`

Resume from:
- `deterministic-handoff-2026-03-25.md`
- `run-log-2026-03-25.md`
