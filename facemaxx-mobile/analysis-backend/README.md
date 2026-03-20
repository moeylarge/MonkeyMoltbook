# LooksMaxxing Analysis Backend

This folder is reserved for the fuller local analysis stack:
- OpenCV
- InsightFace
- MediaPipe
- LooksMaxxing calibration layer

## Intended responsibilities
- preprocess images
- detect and align faces
- extract landmarks and ratios
- compute quality/confidence features
- map outputs into LooksMaxxing scores and categories

## Suggested implementation language
Python

Why:
- strongest ecosystem for OpenCV + InsightFace + MediaPipe integration
- easier scripting and experimentation for model/calibration work

## Planned modules
- `preprocess.py`
- `detect_align.py`
- `landmarks.py`
- `calibrate.py`
- `server.py`
- `schemas/`
- `configs/`
