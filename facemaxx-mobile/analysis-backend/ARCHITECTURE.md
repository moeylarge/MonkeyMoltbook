# LooksMaxxing Analysis Backend Architecture

## Request flow
1. App sends image
2. OpenCV preprocesses quality/normalization
3. InsightFace detects + aligns face
4. MediaPipe extracts landmarks/geometry
5. LooksMaxxing calibration layer maps features to:
   - score
   - category breakdowns
   - tier
   - archetype
   - confidence
   - rejection reason
6. Response returns structured analysis payload

## Suggested response schema
```json
{
  "quality": {},
  "detection": {},
  "landmarks": {},
  "measurements": {},
  "confidence": {},
  "facemaxx": {
    "score": 0,
    "tier": "",
    "archetype": "",
    "breakdown": []
  }
}
```

## Design rules
- each layer should be debuggable on its own
- keep raw measurements separate from calibrated product outputs
- never hide rejection reasons
- preserve structured outputs for dataset logging
