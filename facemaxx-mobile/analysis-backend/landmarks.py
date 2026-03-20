from io import BytesIO
from pathlib import Path
from typing import Any, Dict
from urllib.request import urlretrieve

import numpy as np
from PIL import Image

try:
    import mediapipe as mp
    from mediapipe.tasks.python import vision
except Exception:  # pragma: no cover
    mp = None
    vision = None

_FACE_LANDMARKER = None
_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
_MODEL_PATH = Path(__file__).resolve().parent / "models" / "face_landmarker.task"


def _ensure_model() -> str | None:
    try:
        _MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        if not _MODEL_PATH.exists():
            urlretrieve(_MODEL_URL, _MODEL_PATH)
        return str(_MODEL_PATH)
    except Exception:
        return None


def _get_landmarker():
    global _FACE_LANDMARKER
    if mp is None or vision is None:
        return None
    if _FACE_LANDMARKER is None:
        model_path = _ensure_model()
        if not model_path:
            return None
        base_options = mp.tasks.BaseOptions(model_asset_path=model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            num_faces=1,
        )
        _FACE_LANDMARKER = vision.FaceLandmarker.create_from_options(options)
    return _FACE_LANDMARKER


def run_landmarks(image_bytes: bytes, detection: Dict[str, Any]) -> Dict[str, Any]:
    image = np.array(Image.open(BytesIO(image_bytes)).convert("RGB"))
    landmarker = _get_landmarker()
    if landmarker is None:
        warning = "MediaPipe Tasks FaceLandmarker unavailable or model download failed" if mp is not None else "MediaPipe not available yet"
        return {"available": False, "landmarkCount": 0, "warning": warning}

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)
    result = landmarker.detect(mp_image)
    if not result.face_landmarks:
        return {"available": True, "landmarkCount": 0, "warning": "No landmarks detected"}

    points = result.face_landmarks[0]
    preview = [{"x": round(p.x, 6), "y": round(p.y, 6), "z": round(p.z, 6)} for p in points[:12]]

    return {
        "available": True,
        "landmarkCount": len(points),
        "preview": preview,
        "warning": None,
    }
