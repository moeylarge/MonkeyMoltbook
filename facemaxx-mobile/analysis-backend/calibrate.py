from typing import Any, Dict


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def run_calibration(pre: Dict[str, Any], det: Dict[str, Any], lm: Dict[str, Any]) -> Dict[str, Any]:
    brightness = float(pre.get("brightness", 128))
    contrast = float(pre.get("contrast", 32))
    blur = float(pre.get("blurScore", 50))
    face_count = int(det.get("faceCount", 0))
    landmark_count = int(lm.get("landmarkCount", 0))
    m = lm.get("measurements", {}) or {}

    symmetry_score = float(m.get("symmetryScore", 0.5))
    facial_width_height_ratio = float(m.get("facialWidthHeightRatio", 0.75))
    interocular_ratio = float(m.get("interocularRatio", 0.12))
    jaw_width_ratio = float(m.get("jawWidthRatio", 0.32))
    upper_third_ratio = float(m.get("upperThirdRatio", 0.32))
    mid_third_ratio = float(m.get("midThirdRatio", 0.33))
    lower_third_ratio = float(m.get("lowerThirdRatio", 0.35))
    nose_center_offset = float(m.get("noseCenterOffsetRatio", 0.03))
    eye_height_delta = float(m.get("eyeHeightDelta", 0.01))

    confidence = clamp(
        (brightness * 0.16)
        + (contrast * 0.18)
        + (min(blur, 200) * 0.12)
        + (landmark_count * 0.06)
        + (symmetry_score * 18),
        0,
        100,
    )

    rejection_reason = None
    warnings = []
    if face_count == 0:
        rejection_reason = "No face detected"
    elif face_count > 1:
        rejection_reason = "Multiple faces detected"
    elif landmark_count < 120:
        rejection_reason = "Weak landmark coverage"

    if brightness < 65:
        warnings.append("Lighting appears weak")
    if contrast < 28:
        warnings.append("Contrast appears low")
    if blur < 25:
        warnings.append("Image may be too soft/blurry")
    if nose_center_offset > 0.08:
        warnings.append("Face centering is weak, which may reduce structural confidence")
    if eye_height_delta > 0.04:
        warnings.append("Head tilt or asymmetric angle may be affecting the read")

    thirds_balance_penalty = abs(upper_third_ratio - mid_third_ratio) + abs(mid_third_ratio - lower_third_ratio)
    harmony_signal = clamp(78 - thirds_balance_penalty * 100 + contrast * 0.08, 0, 100)
    jaw_signal = clamp(48 + jaw_width_ratio * 100 + contrast * 0.12, 0, 100)
    eye_signal = clamp(52 + interocular_ratio * 120 + brightness * 0.05, 0, 100)
    skin_signal = clamp(45 + brightness * 0.12 + contrast * 0.16, 0, 100)
    symmetry_signal = clamp(44 + symmetry_score * 48 - nose_center_offset * 100, 0, 100)
    hair_signal = clamp(50 + contrast * 0.1 + blur * 0.04, 0, 100)

    score = round((jaw_signal + eye_signal + skin_signal + symmetry_signal + hair_signal + harmony_signal) / 6)
    if rejection_reason:
        score = max(0, score - 10)

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

    if jaw_signal >= 78 and symmetry_signal >= 76:
        archetype = "Rugged Masculine"
    elif eye_signal >= 78 and harmony_signal >= 76:
        archetype = "Pretty Boy"
    elif harmony_signal >= 80:
        archetype = "Model Type A"
    elif score < 68:
        archetype = "Boy Next Door"
    else:
        archetype = "Chadlite"

    return {
        "score": score,
        "tier": tier,
        "archetype": archetype,
        "confidence": round(confidence, 2),
        "rejectionReason": rejection_reason,
        "warnings": warnings,
        "measurements": {
            "facialWidthHeightRatio": round(facial_width_height_ratio, 6),
            "interocularRatio": round(interocular_ratio, 6),
            "jawWidthRatio": round(jaw_width_ratio, 6),
            "upperThirdRatio": round(upper_third_ratio, 6),
            "midThirdRatio": round(mid_third_ratio, 6),
            "lowerThirdRatio": round(lower_third_ratio, 6),
            "noseCenterOffsetRatio": round(nose_center_offset, 6),
            "eyeHeightDelta": round(eye_height_delta, 6),
            "symmetryScore": round(symmetry_score, 6),
        },
        "breakdown": {
            "jawline": round(jaw_signal, 2),
            "eyes": round(eye_signal, 2),
            "skin": round(skin_signal, 2),
            "symmetry": round(symmetry_signal, 2),
            "hairFraming": round(hair_signal, 2),
            "facialHarmony": round(harmony_signal, 2),
        },
    }
