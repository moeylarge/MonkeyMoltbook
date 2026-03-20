# FACEMAXX Analysis Backend Usage

## Install dependencies
```bash
cd facemaxx-mobile/analysis-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run backend
```bash
cd facemaxx-mobile/analysis-backend
./run_backend.sh
```

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
- FACEMAXX calibration layer

Further work is still required for:
- real environment setup
- model downloads
- stronger calibration logic
- app/backend integration
