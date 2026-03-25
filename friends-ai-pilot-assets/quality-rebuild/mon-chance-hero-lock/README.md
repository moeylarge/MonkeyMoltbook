# Mon + Chance Hero Lock Package

## Purpose
Deterministic workspace package for locking the Mon + Chance hero shot before any broader final-generation pass.

This folder exists so the next generation pass does not depend on browser memory, vague prompt memory, or scattered references.

## Current verdict
The current Mon + Chance image concept is the strongest available starting point in the workspace, but it is **not yet benchmark-grade**.

### Strongest existing candidate assets
1. Primary still reference:
   - `references/04-mon-chance-story-shot.png`
2. Primary upload-ready seed/reference:
   - `fal-input/04-mon-chance-upload-ref.jpg`
3. Additional upload-ready variants prepared for stricter next-pass control:
   - `fal-input/04-mon-chance-upload-ref-close.jpg`
   - `fal-input/04-mon-chance-upload-ref-balanced.jpg`
   - `fal-input/04-mon-chance-upload-ref-wide.jpg`
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

Verdict:
- **REJECT**
- useful as failure memory only
- do not motion-test it

Resume from:
- `deterministic-handoff-2026-03-25.md`
- `run-log-2026-03-25.md`
