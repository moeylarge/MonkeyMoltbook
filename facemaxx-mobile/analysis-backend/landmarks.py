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


def _point(p):
    return {"x": round(p.x, 6), "y": round(p.y, 6), "z": round(p.z, 6)}


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
    preview = [_point(p) for p in points[:12]]

    left_eye = points[33]
    right_eye = points[263]
    nose_tip = points[1]
    mouth = points[13]
    left_cheek = points[234]
    right_cheek = points[454]
    chin = points[152]
    forehead = points[10]

    interocular_ratio = abs(right_eye.x - left_eye.x)
    jaw_width_ratio = abs(right_cheek.x - left_cheek.x)
    face_width = jaw_width_ratio if jaw_width_ratio > 0 else 0.0001
    face_height = abs(chin.y - forehead.y) if abs(chin.y - forehead.y) > 0 else 0.0001
    upper_third = abs(left_eye.y - forehead.y) / face_height
    mid_third = abs(nose_tip.y - left_eye.y) / face_height
    lower_third = abs(chin.y - nose_tip.y) / face_height
    nose_center_offset = abs(nose_tip.x - ((left_cheek.x + right_cheek.x) / 2)) / face_width
    eye_height_delta = abs(left_eye.y - right_eye.y) / face_height
    left_distance = abs(nose_tip.x - left_eye.x)
    right_distance = abs(right_eye.x - nose_tip.x)
    left_right_distance_delta = abs(left_distance - right_distance) / face_width
    cheek_to_jaw_proxy_ratio = abs(right_cheek.x - left_cheek.x) / face_width
    facial_width_height_ratio = face_width / face_height
    symmetry_score = max(0.0, 1.0 - (nose_center_offset * 1.6 + eye_height_delta * 1.8 + left_right_distance_delta))

    return {
        "available": True,
        "landmarkCount": len(points),
        "preview": preview,
        "warning": None,
        "keyAnchors": {
            "leftEye": _point(left_eye),
            "rightEye": _point(right_eye),
            "noseTip": _point(nose_tip),
            "mouthCenter": _point(mouth),
            "leftCheek": _point(left_cheek),
            "rightCheek": _point(right_cheek),
            "chin": _point(chin),
            "forehead": _point(forehead),
        },
        "measurements": {
            "facialWidthHeightRatio": round(facial_width_height_ratio, 6),
            "interocularRatio": round(interocular_ratio, 6),
            "jawWidthRatio": round(jaw_width_ratio, 6),
            "upperThirdRatio": round(upper_third, 6),
            "midThirdRatio": round(mid_third, 6),
            "lowerThirdRatio": round(lower_third, 6),
            "noseCenterOffsetRatio": round(nose_center_offset, 6),
            "eyeHeightDelta": round(eye_height_delta, 6),
            "leftRightDistanceDelta": round(left_right_distance_delta, 6),
            "cheekToJawProxyRatio": round(cheek_to_jaw_proxy_ratio, 6),
            "symmetryScore": round(symmetry_score, 6),
        },
    }
