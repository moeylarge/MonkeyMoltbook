# FACEMAXX Training Scaffold

This folder is reserved for the future v1 scoring model pipeline.

## Planned contents
- `prepare_features.py` or equivalent
- `build_dataset.py`
- `train_v1.py`
- `evaluate_v1.py`
- `configs/`
- `artifacts/`

## Intended pipeline
1. export measurement vectors from app scans
2. merge with human ratings
3. build train/validation/test splits
4. train multi-head scoring model
5. evaluate calibration and confidence
6. export model/inference wrapper
