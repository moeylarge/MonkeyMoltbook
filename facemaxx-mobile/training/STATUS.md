# FACEMAXX Training Status

## Current state
- raw sample export path exists in the app
- measurement vectors are being generated
- local dataset export records exist
- file-based JSON sample export exists
- labeling workflow scaffold exists
- annotation schema/template exists
- merge rules exist

## Next recommended tasks
- write a helper script to build/update labeling manifests
- write a merge script for annotations → merged labels
- decide where exported app JSON files will be copied from device/web runtime into `training/raw-exports/`
- begin collecting first 25-100 internal samples
