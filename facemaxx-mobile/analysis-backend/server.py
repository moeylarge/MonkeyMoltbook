import hashlib
import logging

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from preprocess import run_preprocess
from detect_align import run_detection
from landmarks import run_landmarks
from calibrate import run_calibration

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("looksmaxxing.analysis")

app = FastAPI(title="LooksMaxxing Analysis Backend", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def detect_image_format(image_bytes: bytes):
    if image_bytes.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if image_bytes.startswith((b"GIF87a", b"GIF89a")):
        return "gif"
    if image_bytes.startswith(b"RIFF") and image_bytes[8:12] == b"WEBP":
        return "webp"
    if len(image_bytes) > 12 and image_bytes[4:8] == b"ftyp" and image_bytes[8:12] in {b"heic", b"heix", b"hevc", b"hevx", b"mif1", b"msf1"}:
        return "heic"
    return None


def detect_declared_format(filename: str | None, content_type: str | None):
    normalized_type = (content_type or '').lower()
    if normalized_type.startswith('image/'):
        return normalized_type.split('/', 1)[1]

    normalized_name = (filename or '').lower()
    if '.' in normalized_name:
        ext = normalized_name.rsplit('.', 1)[1]
        if ext in {'jpg', 'jpeg'}:
            return 'jpeg'
        if ext in {'png', 'gif', 'webp'}:
            return ext
    return None


@app.get("/health")
def health():
    return {"ok": True, "service": "looksmaxxing-analysis-backend"}


@app.post("/analyze")
async def analyze(image: UploadFile = File(...)):
    image_bytes = await image.read()
    detected_format = detect_image_format(image_bytes)
    declared_format = detect_declared_format(image.filename, image.content_type)
    request_debug = {
        "filename": image.filename,
        "contentType": image.content_type,
        "byteLength": len(image_bytes),
        "declaredFormat": declared_format,
        "detectedFormat": detected_format,
        "formatMismatch": bool(declared_format and detected_format and declared_format != detected_format),
        "sha256Prefix": hashlib.sha256(image_bytes).hexdigest()[:16] if image_bytes else None,
    }

    logger.info("/analyze upload debug: %s", request_debug)

    pre = run_preprocess(image_bytes)
    det = run_detection(image_bytes, pre)
    lm = run_landmarks(image_bytes, det)
    looksmaxxing = run_calibration(pre, det, lm)

    logger.info(
        "/analyze processed debug: width=%s height=%s faceCount=%s significantFaceCount=%s landmarks=%s score=%s confidence=%s",
        pre.get("width"),
        pre.get("height"),
        det.get("faceCount"),
        det.get("significantFaceCount"),
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
