import hashlib
import imghdr
import logging

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

from preprocess import run_preprocess
from detect_align import run_detection
from landmarks import run_landmarks
from calibrate import run_calibration

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("looksmaxxing.analysis")

app = FastAPI(title="LooksMaxxing Analysis Backend", version="0.1.0")


@app.get("/health")
def health():
    return {"ok": True, "service": "looksmaxxing-analysis-backend"}


@app.post("/analyze")
async def analyze(image: UploadFile = File(...)):
    image_bytes = await image.read()
    detected_format = imghdr.what(None, h=image_bytes)
    request_debug = {
        "filename": image.filename,
        "contentType": image.content_type,
        "byteLength": len(image_bytes),
        "detectedFormat": detected_format,
        "sha256Prefix": hashlib.sha256(image_bytes).hexdigest()[:16] if image_bytes else None,
    }

    logger.info("/analyze upload debug: %s", request_debug)

    pre = run_preprocess(image_bytes)
    det = run_detection(image_bytes, pre)
    lm = run_landmarks(image_bytes, det)
    looksmaxxing = run_calibration(pre, det, lm)

    logger.info(
        "/analyze processed debug: width=%s height=%s faceCount=%s landmarks=%s score=%s confidence=%s",
        pre.get("width"),
        pre.get("height"),
        det.get("faceCount"),
        lm.get("landmarkCount"),
        looksmaxxing.get("score"),
        looksmaxxing.get("confidence"),
    )

    return JSONResponse(
        {
            "request": request_debug,
            "quality": pre,
            "detection": det,
            "landmarks": lm,
            "looksmaxxing": looksmaxxing,
        }
    )
