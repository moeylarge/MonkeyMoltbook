from typing import Any, Dict


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def widen_score(raw_score: float, quality_gate: float) -> float:
    centered = raw_score - 70.0
    if centered >= 0:
        expanded = 72.0 + (centered * 1.55)
    else:
        expanded = 72.0 + (centered * 1.35)

    quality_adjust = (quality_gate - 0.82) * 12.0
    return clamp(expanded + quality_adjust, 35.0, 95.0)


def run_calibration(pre: Dict[str, Any], det: Dict[str, Any], lm: Dict[str, Any]) -> Dict[str, Any]:
    brightness = float(pre.get("brightness", 128))
    contrast = float(pre.get("contrast", 32))
    blur = float(pre.get("blurScore", 50))
    width = float(pre.get("width", 1) or 1)
    height = float(pre.get("height", 1) or 1)
    face_count = int(det.get("faceCount", 0))
    significant_face_count = int(det.get("significantFaceCount", face_count))
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

    bbox = ((det.get("primaryFace") or {}).get("bbox") or []) if det else []
    face_width = max(0.0, float(bbox[2]) - float(bbox[0])) if len(bbox) == 4 else 0.0
    face_height = max(0.0, float(bbox[3]) - float(bbox[1])) if len(bbox) == 4 else 0.0
    face_size_ratio = (face_width * face_height) / max(1.0, width * height)

    lighting_quality = clamp((brightness - 45) / 55, 0.0, 1.0)
    contrast_quality = clamp((contrast - 18) / 22, 0.0, 1.0)
    blur_quality = clamp((min(blur, 180) - 12) / 70, 0.0, 1.0)
    landmark_quality = clamp(landmark_count / 478, 0.0, 1.0)
    framing_quality = clamp((face_size_ratio - 0.05) / 0.16, 0.0, 1.0)
    pose_quality = clamp(1.0 - nose_center_offset * 7.5 - eye_height_delta * 10.0, 0.0, 1.0)

    confidence = clamp(
        (
            (lighting_quality * 22)
            + (contrast_quality * 18)
            + (blur_quality * 16)
            + (landmark_quality * 26)
            + (framing_quality * 10)
            + (pose_quality * 8)
        ),
        0,
        100,
    )

    rejection_reason = None
    warnings = []
    if face_count == 0:
        rejection_reason = "No face detected"
    elif significant_face_count > 1:
        rejection_reason = "Multiple faces detected"
    elif face_size_ratio < 0.075:
        rejection_reason = "Face too small in frame"
    elif pose_quality < 0.28:
        rejection_reason = "Angle too strong for reliable scoring"
    elif landmark_count < 120:
        rejection_reason = "Weak landmark coverage"

    if lighting_quality < 0.42:
        warnings.append("Lighting appears weak")
    if contrast_quality < 0.42:
        warnings.append("Contrast appears low")
    if blur_quality < 0.34:
        warnings.append("Image may be too soft/blurry")
    if face_size_ratio < 0.1:
        warnings.append("Face is reading small in frame, which may suppress structural confidence")
    if nose_center_offset > 0.08:
        warnings.append("Face centering is weak, which may reduce structural confidence")
    if eye_height_delta > 0.04 or pose_quality < 0.45:
        warnings.append("Head tilt or asymmetric angle may be affecting the read")

    thirds_balance_penalty = abs(upper_third_ratio - mid_third_ratio) + abs(mid_third_ratio - lower_third_ratio)
    harmony_signal = clamp(72 - thirds_balance_penalty * 84 + contrast * 0.06 + symmetry_score * 6, 0, 100)
    jaw_signal = clamp(50 + jaw_width_ratio * 82 + contrast * 0.08 + symmetry_score * 4, 0, 100)
    eye_signal = clamp(51 + interocular_ratio * 92 + brightness * 0.035 + pose_quality * 8, 0, 100)
    skin_signal = clamp(44 + brightness * 0.09 + contrast * 0.12 + blur_quality * 10, 0, 100)
    symmetry_signal = clamp(46 + symmetry_score * 40 - nose_center_offset * 72 - eye_height_delta * 55, 0, 100)
    hair_signal = clamp(49 + contrast * 0.07 + blur_quality * 12 + framing_quality * 6, 0, 100)

    quality_gate = clamp(
        0.62
        + (lighting_quality * 0.1)
        + (contrast_quality * 0.08)
        + (blur_quality * 0.08)
        + (landmark_quality * 0.08)
        + (framing_quality * 0.04),
        0.55,
        1.0,
    )

    raw_score = (jaw_signal + eye_signal + skin_signal + symmetry_signal + hair_signal + harmony_signal) / 6
    score = round(widen_score(raw_score, quality_gate))
    if rejection_reason:
        score = max(0, score - 8)

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
        "qualityGate": round(quality_gate, 6),
        "rawScore": round(raw_score, 6),
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
