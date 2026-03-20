from io import BytesIO
from typing import Any, Dict

import numpy as np
from PIL import Image, ImageOps


def _face_area_ratio(bbox, image_width: int, image_height: int) -> float:
    if not bbox or image_width <= 0 or image_height <= 0:
        return 0.0
    width = max(0.0, float(bbox[2]) - float(bbox[0]))
    height = max(0.0, float(bbox[3]) - float(bbox[1]))
    return (width * height) / float(image_width * image_height)

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
    image = np.array(ImageOps.exif_transpose(Image.open(BytesIO(image_bytes))).convert("RGB"))
    image_width = int(preprocess.get("width") or image.shape[1] or 0)
    image_height = int(preprocess.get("height") or image.shape[0] or 0)
    app = _get_app()
    if app is None:
        return {
            "available": False,
            "faceCount": 0,
            "significantFaceCount": 0,
            "primaryFace": None,
            "faces": [],
            "warning": "InsightFace not available yet",
        }

    faces = app.get(image)
    if not faces:
        return {
            "available": True,
            "faceCount": 0,
            "significantFaceCount": 0,
            "primaryFace": None,
            "faces": [],
            "warning": "No face detected",
        }

    face_entries = []
    for idx, face in enumerate(faces):
        bbox = face.bbox.tolist() if hasattr(face, "bbox") else None
        kps = face.kps.tolist() if hasattr(face, "kps") else None
        area_ratio = _face_area_ratio(bbox, image_width, image_height)
        face_entries.append(
            {
                "index": idx,
                "bbox": bbox,
                "keypoints": kps,
                "areaRatio": round(area_ratio, 6),
            }
        )

    face_entries.sort(key=lambda item: item.get("areaRatio", 0), reverse=True)
    primary_entry = face_entries[0]
    primary_area_ratio = float(primary_entry.get("areaRatio") or 0.0)
    significant_faces = [
        face
        for face in face_entries
        if (face.get("areaRatio") or 0.0) >= 0.04
        or ((face.get("areaRatio") or 0.0) >= primary_area_ratio * 0.33 and primary_area_ratio > 0)
    ]

    primary = faces[0]
    embedding = primary.embedding.tolist()[:16] if hasattr(primary, "embedding") and primary.embedding is not None else None

    return {
        "available": True,
        "faceCount": len(face_entries),
        "significantFaceCount": len(significant_faces),
        "primaryFace": {
            "bbox": primary_entry.get("bbox"),
            "keypoints": primary_entry.get("keypoints"),
            "embeddingPreview": embedding,
            "areaRatio": primary_entry.get("areaRatio"),
        },
        "faces": face_entries,
        "warning": None,
    }
