from io import BytesIO
from typing import Any, Dict

import cv2
import numpy as np
from PIL import Image
from pillow_heif import register_heif_opener

register_heif_opener()


def _load_image(image_bytes: bytes) -> np.ndarray:
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)


def run_preprocess(image_bytes: bytes) -> Dict[str, Any]:
    image = _load_image(image_bytes)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    blur = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(np.mean(gray))
    contrast = float(np.std(gray))
    height, width = gray.shape[:2]

    normalized = cv2.resize(image, (min(width, 1024), min(height, 1024)))

    return {
        "width": width,
        "height": height,
        "brightness": round(brightness, 4),
        "contrast": round(contrast, 4),
        "blurScore": round(blur, 4),
        "normalizedShape": list(normalized.shape),
    }
