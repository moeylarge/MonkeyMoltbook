# FACEMAXX Training Usage

## 1. Build/update manifest
```bash
cd facemaxx-mobile/training
./build_manifest.py
```

## 2. Add annotation files
Place per-rater annotation JSON files into:
- `annotations/`

Naming format:
- `<sampleId>__<raterId>.json`

## 3. Merge annotations
```bash
cd facemaxx-mobile/training
./merge_annotations.py
```

Outputs:
- merged labels → `merged/`
- review-needed cases → `review/`

## Review conditions
A sample gets routed for review if:
- fewer than 3 raters
- high disagreement on overall score
- no clear archetype majority
- invalid/multiple-face/occlusion/extreme-angle/blur flags cross threshold

## Current pipeline state
- raw exports: scaffolded
- annotations: scaffolded
- manifest building: working
- merge logic: working
- model training: not started yet
