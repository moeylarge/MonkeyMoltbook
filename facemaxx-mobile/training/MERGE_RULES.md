# LooksMaxxing Merge Rules

## Purpose
Define how multiple annotation files become one merged training label.

## Per-field aggregation
For each numeric rating field:
- compute mean
- compute min/max
- compute variance or spread

Fields:
- overall
- jawline
- eyes
- skin
- symmetry
- hairFraming
- facialHarmony

## Archetype handling
- if majority agrees: use majority label
- if split with no clear majority: mark as low-consensus

## Validity rules
Mark sample as invalid if:
- any annotation sets `invalidSample=true` and review confirms it
- majority of raters flag multiple faces / occlusion / blur severe enough to ruin the sample

## Review routing
Send to `training/review/` if:
- fewer than 3 raters
- high disagreement on overall rating
- archetype disagreement with no majority
- conflicting validity flags

## Merged output should include
- source sample payload
- aggregated means
- disagreement metrics
- rater count
- validity decision
- reviewRequired boolean
