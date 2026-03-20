from typing import Any, Dict


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def run_calibration(pre: Dict[str, Any], det: Dict[str, Any], lm: Dict[str, Any]) -> Dict[str, Any]:
    brightness = pre.get("brightness", 128)
    contrast = pre.get("contrast", 32)
    blur = pre.get("blurScore", 50)
    face_count = det.get("faceCount", 0)
    landmark_count = lm.get("landmarkCount", 0)

    confidence = clamp((brightness * 0.18) + (contrast * 0.22) + (min(blur, 200) * 0.15) + (landmark_count * 0.08), 0, 100)

    rejection_reason = None
    warnings = []
    if face_count == 0:
        rejection_reason = "No face detected"
    elif face_count > 1:
        rejection_reason = "Multiple faces detected"
    elif landmark_count < 50:
        rejection_reason = "Weak landmark coverage"

    if brightness < 65:
        warnings.append("Lighting appears weak")
    if contrast < 28:
        warnings.append("Contrast appears low")
    if blur < 25:
        warnings.append("Image may be too soft/blurry")

    base_score = clamp(52 + (contrast * 0.25) + (landmark_count * 0.03), 0, 100)
    if rejection_reason:
        base_score = max(0, base_score - 12)

    jawline = clamp(base_score - 3, 0, 100)
    eyes = clamp(base_score + 1, 0, 100)
    skin = clamp(base_score - 5 + (brightness * 0.05), 0, 100)
    symmetry = clamp(base_score - 1 + (landmark_count * 0.01), 0, 100)
    hair = clamp(base_score - 2, 0, 100)
    harmony = clamp((jawline + eyes + skin + symmetry + hair) / 5, 0, 100)

    score = round((jawline + eyes + skin + symmetry + hair + harmony) / 6)
    if score < 55:
        tier = "Normie"
    elif score < 72:
        tier = "Above Average"
    elif score < 82:
        tier = "Attractive"
    elif score < 92:
        tier = "Elite"
    else:
        tier = "Genetic Outlier"

    archetypes = ["Chadlite", "Pretty Boy", "Model Type A", "Boy Next Door", "Rugged Masculine"]
    archetype = archetypes[score % len(archetypes)]

    return {
        "score": score,
        "tier": tier,
        "archetype": archetype,
        "confidence": round(confidence, 2),
        "rejectionReason": rejection_reason,
        "warnings": warnings,
        "breakdown": {
            "jawline": round(jawline, 2),
            "eyes": round(eyes, 2),
            "skin": round(skin, 2),
            "symmetry": round(symmetry, 2),
            "hairFraming": round(hair, 2),
            "facialHarmony": round(harmony, 2),
        },
    }
