# FACEMAXX First Labeling Batch Plan

## Goal
Prepare the first 25 real exported FACEMAXX samples for human rating.

## Batch size
- 25 samples
- 3 raters per sample
- expected annotation files: 75 total

## Folder targets
- raw exports go in: `training/raw-exports/`
- annotations go in: `training/annotations/`
- merged outputs go in: `training/merged/`
- flagged/problem samples go in: `training/review/`

## Naming rules
### Raw sample files
- `<sampleId>.json`

### Annotation files
- `<sampleId>__<raterId>.json`
- examples:
  - `sample-001__rater-001.json`
  - `sample-001__rater-002.json`
  - `sample-001__rater-003.json`

## Recommended raters
- rater-001 = Moey
- rater-002 = trusted human #2
- rater-003 = trusted human #3

## Workflow
1. collect 25 raw FACEMAXX export JSON files
2. copy them into `training/raw-exports/`
3. run `./build_manifest.py`
4. give raters:
   - `RATING_RUBRIC.md`
   - `annotation_template.json`
   - `FIRST_BATCH_INSTRUCTIONS.md`
5. collect completed annotations into `training/annotations/`
6. run `./merge_annotations.py`
7. inspect:
   - `training/merged/`
   - `training/review/`

## Success criteria
- at least 25 raw exports prepared
- at least 3 ratings per sample
- merge runs cleanly
- disagreement/review queue is understandable

## What to learn from batch 1
- are the rating instructions clear?
- are raters consistent enough?
- do archetype labels create too much disagreement?
- are exported samples usable for training?
- do confidence/rejection flags match human intuition?
