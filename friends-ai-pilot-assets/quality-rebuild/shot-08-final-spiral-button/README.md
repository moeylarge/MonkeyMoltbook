# Shot 08 — Final Spiral / Button Package

## Purpose
Deterministic rebuild package for locking the **Shot 08 final ensemble still** before any motion attempt.

This folder exists so Shot 08 can be run without browser memory, vague prompt drift, or mixed-source confusion.

## Current verdict
- still gate: **PASS / KEEPER** on 2026-03-25 direct pass 2
- motion gate: **eligible for one controlled pass**

Latest audited result:
- still output: `outputs/2026-03-25/shot-08-final-spiral-2026-03-25-direct-pass-2-strongclean-v2.png`
- payload audit: `outputs/2026-03-25/shot-08-final-spiral-2026-03-25-direct-pass-2-strongclean-v2.json`
- scorecard: `scorecards/shot-08-direct-pass-2-strongclean-v2-scorecard-2026-03-25.md`

## Locked source rule
Keeper still was produced from **one bound source image only**:
- `fal-input/08-final-spiral-upload-ref-strongclean-v2.jpg`

Do not bind legacy motion clips or extra stills into the same generation step.
They are audit memory only.

## Best existing reference assets
1. Canonical ensemble geometry reference:
   - `references/07-ensemble-payoff-story-shot.png`
2. Approved upload-ready cleaned still that actually held the anti-signage constraint:
   - `fal-input/08-final-spiral-upload-ref-strongclean-v2.jpg`
3. Locked keeper still:
   - `outputs/2026-03-25/shot-08-final-spiral-2026-03-25-direct-pass-2-strongclean-v2.png`
4. Legacy motion audit memory only:
   - `review/legacy-motion-audit/shot07-motion-frame-01.jpg`
   - `review/legacy-motion-audit/shot07-motion-frame-02.jpg`
   - `review/legacy-motion-audit/shot08-motion-frame-01.jpg`
   - `review/legacy-motion-audit/shot08-motion-frame-02.jpg`

## Asset assessment

### `07-ensemble-payoff-story-shot.png`
Why it matters:
- best existing six-character room geometry in the workspace
- correct couch / chair / coffee-table geography for Central Peak
- preserves the exact ensemble blocking needed for the final button beat

Why it does not pass as final Shot 08 still by itself:
- too board-like for premium final use
- carries homage-style readable signage drift
- emotional button hierarchy is not yet precise enough for the final beat

### `08-final-spiral-upload-ref-strongclean-v2.jpg`
Why it matters:
- same ensemble geometry, but with the chalkboard structure and right-window sign anchors physically removed harder than v1
- prevents the prior readable-signage reconstruction failure mode
- proved clean enough to yield the locked keeper still on direct pass 2

Use rule:
- keep this as the canonical one-source still reference for any future audit or tightly controlled rerun

## Directory roles
- `references/` = canonical still anchors
- `fal-input/` = upload-ready bound-source files for direct still generation
- `outputs/` = generated still results and payload audits
- `scorecards/` = hard pass/reject scoring records
- `review/` = audit memory and failure review only
- `motion-clips/` = only populate after the still passes

## Pass rule
Do not run motion until the still clears the rubric in:
- `keeper-rubric-v1.md`

That still gate is now cleared by the direct pass 2 keeper.

## Current resume point
- still is now locked from direct pass 2
- if continuing, package exactly one restrained motion pass from `outputs/2026-03-25/shot-08-final-spiral-2026-03-25-direct-pass-2-strongclean-v2.png`
- keep the same six-character layout and anti-signage discipline
