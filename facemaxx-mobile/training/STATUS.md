# LooksMaxxing Training Status

## Current state
- raw sample export path exists in the app
- measurement vectors are being generated
- local dataset export records exist
- file-based JSON sample export exists
- labeling workflow scaffold exists
- annotation schema/template exists
- merge rules exist

## Next recommended tasks
- decide where exported app JSON files will be copied from device/web runtime into `training/raw-exports/`
- begin collecting first 25 internal samples
- hand raters the first-batch packet
- collect 3 ratings per sample
- run `build_manifest.py` and `merge_annotations.py` on the first real batch

## First-batch prep status
- `FIRST_BATCH_PLAN.md` created
- `FIRST_BATCH_INSTRUCTIONS.md` created
- `first_batch_manifest.json` created
- `rater_packet/README.md` created
