from io import BytesIO
from typing import Any, Dict

import numpy as np
from PIL import Image

try:
    from insightface.app import FaceAnalysis
except Exception:  # pragma: no cover
    FaceAnalysis = None

_APP = None


def _get_app():
    global _APP
    if _APP is None and FaceAnalysis is not None:
        _APP = FaceAnalysis(name="buffalo_l")
        _APP.prepare(ctx_id=0, det_size=(640, 640))
    return _APP


def run_detection(image_bytes: bytes, preprocess: Dict[str, Any]) -> Dict[str, Any]:
    image = np.array(Image.open(BytesIO(image_bytes)).convert("RGB"))
    app = _get_app()
    if app is None:
        return {
            "available": False,
            "faceCount": 0,
            "primaryFace": None,
            "warning": "InsightFace not available yet",
        }

    faces = app.get(image)
    if not faces:
        return {
            "available": True,
            "faceCount": 0,
            "primaryFace": None,
            "warning": "No face detected",
        }

    primary = faces[0]
    bbox = primary.bbox.tolist() if hasattr(primary, "bbox") else None
    kps = primary.kps.tolist() if hasattr(primary, "kps") else None
    embedding = primary.embedding.tolist()[:16] if hasattr(primary, "embedding") and primary.embedding is not None else None

    return {
        "available": True,
        "faceCount": len(faces),
        "primaryFace": {
            "bbox": bbox,
            "keypoints": kps,
            "embeddingPreview": embedding,
        },
        "warning": None,
    }
