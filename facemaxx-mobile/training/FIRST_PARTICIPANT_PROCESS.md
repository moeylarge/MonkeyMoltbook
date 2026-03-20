# FACEMAXX First Participant Process

## Goal
Process one real participant cleanly from intake to training pipeline.

## Step 1 — Create/select participant folder
Use:
- `training/incoming/participants/participant-001/`

## Step 2 — Save consent
Fill out:
- `consent.txt`

Minimum requirement:
- participant id
- date
- explicit consent wording
- how consent was given

## Step 3 — Save photos
Put incoming photos in the same participant folder.

Recommended naming:
- `photo-001.jpg`
- `photo-002.jpg`
- `photo-003.jpg`

## Step 4 — Add notes if needed
Use:
- `notes.txt`

Examples:
- best selfie
- second image is blurry
- mirror shot only

## Step 5 — Choose usable photo(s)
Pick the cleanest images to process first.

Prefer:
- one face only
- decent lighting
- low blur
- limited occlusion
- mostly frontal

## Step 6 — Run through FACEMAXX
Upload/capture the selected image in the app.
Let FACEMAXX generate:
- scan output
- measurement vector
- dataset export
- file-based JSON sample export

## Step 7 — Move/export sample into training flow
Place the exported JSON sample into:
- `training/raw-exports/`

## Step 8 — Update sample index
Record the mapping in:
- `training/sample_index.csv`

Fields:
- sample_id
- participant_id
- source_photo
- notes

## Step 9 — Build manifest
Run:
```bash
cd facemaxx-mobile/training
./build_manifest.py
```

## Step 10 — Send to raters
Give raters:
- `RATING_RUBRIC.md`
- `annotation_template.json`
- `FIRST_BATCH_INSTRUCTIONS.md`

## Step 11 — Merge annotations later
Once 3 ratings exist for the sample, run:
```bash
cd facemaxx-mobile/training
./merge_annotations.py
```
