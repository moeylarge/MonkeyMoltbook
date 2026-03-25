# Shot 08 — Final Spiral / Button Package

## Purpose
Deterministic rebuild package for locking the **Shot 08 final ensemble still** before any motion attempt.

This folder exists so Shot 08 can be run without browser memory, vague prompt drift, or mixed-source confusion.

## Current verdict
- still gate: **REJECT** on 2026-03-25 direct pass 1
- motion gate: **blocked until still passes**

Latest audited result:
- still output: `outputs/2026-03-25/shot-08-final-spiral-2026-03-25-direct-pass-1-cleanref.png`
- payload audit: `outputs/2026-03-25/shot-08-final-spiral-2026-03-25-direct-pass-1-cleanref.json`
- scorecard: `scorecards/shot-08-direct-pass-1-cleanref-scorecard-2026-03-25.md`

## Locked source rule
For the next paid still-generation step, use **one bound source image only**:
- `fal-input/08-final-spiral-upload-ref-cleaned.jpg`

Do not bind legacy motion clips or extra stills into the same generation step.
They are audit memory only.

## Best existing reference assets
1. Canonical ensemble geometry reference:
   - `references/07-ensemble-payoff-story-shot.png`
2. Approved upload-ready cleaned still for deterministic reruns:
   - `fal-input/08-final-spiral-upload-ref-cleaned.jpg`
3. Legacy motion audit memory only:
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

### `08-final-spiral-upload-ref-cleaned.jpg`
Why it matters:
- same ensemble geometry, but neutralized for safer deterministic editing
- removes dependence on homage-ish signage reconstruction
- cleanest one-source candidate for a paid still pass

Use rule:
- use this as the sole bound source for the next still pass

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

## Current resume point
- run exactly one still-generation pass with `run_direct_still_pass.mjs`
- score immediately
- if **PASS**, then and only then package the motion step
- if **REJECT**, stop and preserve the result as audit memory
