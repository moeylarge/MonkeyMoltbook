# LooksMaxxing First Batch Instructions

## What you are doing
You are rating exported LooksMaxxing face samples for model training.

## Files you should read first
- `RATING_RUBRIC.md`
- `annotation_template.json`

## For each sample
1. open the raw sample JSON from `training/raw-exports/`
2. review the sample carefully
3. create a new annotation file in `training/annotations/`
4. name it:
   - `<sampleId>__<your-rater-id>.json`

## Required fields to complete
- overall
- jawline
- eyes
- skin
- symmetry
- hairFraming
- facialHarmony
- archetypeLabel
- imageQuality
- ratingConfidence
- flags
- notes (optional)

## Important rules
- rate the image you see, not the imagined person behind it
- do not coordinate scores with other raters
- if the image is weak, flag it honestly
- if multiple faces / heavy blur / extreme angle / strong filtering appear, mark that in flags

## Quality threshold
If the sample is clearly invalid, still complete the annotation but set:
- `invalidSample: true`
- explain why in `notes`

## After all annotations are done
Return the files to `training/annotations/` and the merge script will aggregate them.
