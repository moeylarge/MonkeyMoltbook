# Deterministic Handoff — Shot 08 Final Spiral / Button — 2026-03-25

## Goal
Produce one real Shot 08 still candidate that can be honestly scored against the lock criteria.

## Current state after direct pass 2
- locked still verdict: **PASS / KEEPER**
- locked still: `outputs/2026-03-25/shot-08-final-spiral-2026-03-25-direct-pass-2-strongclean-v2.png`
- payload audit: `outputs/2026-03-25/shot-08-final-spiral-2026-03-25-direct-pass-2-strongclean-v2.json`
- scorecard: `scorecards/shot-08-direct-pass-2-strongclean-v2-scorecard-2026-03-25.md`

## Best input set
Primary reference priority:
1. `references/07-ensemble-payoff-story-shot.png`
2. `fal-input/08-final-spiral-upload-ref-strongclean-v2.jpg`

Paid still-generation run rule:
- bind **one** source image only: `fal-input/08-final-spiral-upload-ref-strongclean-v2.jpg`
- do not bind motion clips
- do not bind the Mon + Chance hero still
- do not add a second support reference in the same step

Default prompt:
- `hero-still-prompt-v1.md`

Scoring doc:
- `keeper-rubric-v1.md`

## Exact run recommendation
### Preferred tool
- direct FAL Nano Banana Pro edit via API

### Single-pass settings
- mode: image edit
- source image count: 1
- output count: 1
- aspect ratio: 4:3
- output format: png
- resolution: 1K
- safety tolerance: 4
- limit generations: true

## Pass/fail rule
After generation, score immediately:
- if it trips any fast reject trigger in `keeper-rubric-v1.md`, mark `REJECT`
- only if it clears all three gates does it become `PASS / KEEPER`

## Motion rule
The still now clears `PASS / KEEPER`.
If continuing, run at most one restrained motion pass from the locked keeper still and preserve the same anti-signage discipline.

## Audit finding before the run
- best current geometry source is the old Shot 07 ensemble still
- old Shot 08 motion carries the wrong wardrobe/world energy and background-extra drift
- homage/signage drift needed to be neutralized before any deterministic still pass
