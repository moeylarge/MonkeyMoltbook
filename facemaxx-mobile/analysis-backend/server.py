from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

from preprocess import run_preprocess
from detect_align import run_detection
from landmarks import run_landmarks
from calibrate import run_calibration

app = FastAPI(title="FACEMAXX Analysis Backend", version="0.1.0")


@app.get("/health")
def health():
    return {"ok": True, "service": "facemaxx-analysis-backend"}


@app.post("/analyze")
async def analyze(image: UploadFile = File(...)):
    image_bytes = await image.read()

    pre = run_preprocess(image_bytes)
    det = run_detection(image_bytes, pre)
    lm = run_landmarks(image_bytes, det)
    facemaxx = run_calibration(pre, det, lm)

    return JSONResponse(
        {
            "quality": pre,
            "detection": det,
            "landmarks": lm,
            "facemaxx": facemaxx,
        }
    )
