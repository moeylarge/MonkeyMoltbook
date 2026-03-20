# FACEMAXX Labeling Workflow

## Goal
Turn exported scan samples into reusable labeled training data.

## Folder layout
- `training/raw-exports/` → copied JSON sample exports from the app
- `training/annotations/` → one annotation file per rater per sample
- `training/merged/` → merged sample + aggregate labels
- `training/review/` → low-consensus or flagged samples

## Workflow

### 1. Collect raw exports
Copy exported sample JSON files from the app into:
- `training/raw-exports/`

Recommended naming:
- `<sampleId>.json`

### 2. Annotate each sample
For each raw sample, create one annotation file per rater in:
- `training/annotations/`

Recommended naming:
- `<sampleId>__<raterId>.json`

Use:
- `annotation_schema.json`
- `annotation_template.json`
- `RATING_RUBRIC.md`

### 3. Aggregate labels
For each sample:
- average ratings by field
- compute variance/disagreement
- preserve flags
- mark low-consensus samples for review

Write merged outputs to:
- `training/merged/`

### 4. Review problem samples
Move or copy problematic samples to:
- `training/review/`

Examples:
- multiple faces
- invalid samples
- heavy disagreement
- image too blurry
- extreme angle

## Minimum standard
- 3 raters per sample minimum
- do not train on unreviewed invalid samples
- store disagreement spread, not just averages

## Merge output should contain
- original sample payload
- aggregated ratings
- rater count
- variance by field
- archetype consensus or disagreement
- final validity decision
