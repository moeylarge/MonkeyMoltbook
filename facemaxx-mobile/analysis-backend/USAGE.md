# LooksMaxxing Analysis Backend Usage

## Install dependencies
```bash
cd looksmaxxing-mobile/analysis-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run backend
```bash
cd looksmaxxing-mobile/analysis-backend
./run_backend.sh
```

`run_backend.sh` uses the local `.venv` interpreter directly so the backend runs against the installed project dependencies instead of whatever global `python3` happens to be first on PATH.

## Health check
Open:
- `http://127.0.0.1:8089/health`

## Analyze endpoint
POST multipart form-data to:
- `http://127.0.0.1:8089/analyze`

Field name:
- `image`

## Current state
This is an initial scaffold.
It wires together:
- OpenCV preprocessing
- InsightFace detection/alignment scaffold
- MediaPipe landmark scaffold
- LooksMaxxing calibration layer

Further work is still required for:
- real environment setup
- model downloads
- stronger calibration logic
- app/backend integration
