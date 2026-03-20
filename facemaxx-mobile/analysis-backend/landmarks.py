from io import BytesIO
from typing import Any, Dict

import numpy as np
from PIL import Image

try:
    import mediapipe as mp
except Exception:  # pragma: no cover
    mp = None

_FACE_MESH = None


def _get_mesh():
    global _FACE_MESH
    if _FACE_MESH is None and mp is not None:
        _FACE_MESH = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
        )
    return _FACE_MESH


def run_landmarks(image_bytes: bytes, detection: Dict[str, Any]) -> Dict[str, Any]:
    image = np.array(Image.open(BytesIO(image_bytes)).convert("RGB"))
    mesh = _get_mesh()
    if mesh is None:
        return {"available": False, "landmarkCount": 0, "warning": "MediaPipe not available yet"}

    result = mesh.process(image)
    if not result.multi_face_landmarks:
        return {"available": True, "landmarkCount": 0, "warning": "No landmarks detected"}

    points = result.multi_face_landmarks[0].landmark
    preview = [{"x": round(p.x, 6), "y": round(p.y, 6), "z": round(p.z, 6)} for p in points[:12]]

    return {
        "available": True,
        "landmarkCount": len(points),
        "preview": preview,
        "warning": None,
    }
