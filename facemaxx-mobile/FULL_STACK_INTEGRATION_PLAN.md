# LooksMaxxing Full Stack Integration Plan

Updated: 2026-03-20

## Chosen backend direction
Use the fuller local stack immediately:
- OpenCV
- InsightFace
- MediaPipe
- LooksMaxxing scoring calibration layer

This is the higher-overhead route, but it gives LooksMaxxing a stronger analysis backbone from day one.

---

## System roles

### 1. OpenCV
Responsible for:
- image loading / normalization
- resize / crop prep
- blur detection
- lighting analysis
- contrast analysis
- image quality screening
- preprocessing before landmark/detection passes

### 2. InsightFace
Responsible for:
- robust face detection
- face alignment
- embeddings
- cleaner face crop normalization
- stronger comparison/battle support

### 3. MediaPipe
Responsible for:
- dense facial landmarks
- geometric measurements
- facial ratios
- pose/alignment cues
- symmetry-related features

### 4. LooksMaxxing calibration layer
Responsible for:
- overall score
- category scores
- tier assignment
- archetype assignment
- confidence / rejection outputs
- improvement recommendation mapping
- battle outcome logic

---

## Recommended architecture

### App layer
Current mobile UI remains the product shell.

### Analysis service layer
Create a local or self-hosted analysis service that accepts an image and returns:
- quality metrics
- face detection/alignment results
- landmark measurements
- embeddings (if needed)
- calibrated LooksMaxxing outputs

### Output schema
The service should eventually produce:
- measurement vector
- confidence + rejection state
- overall score
- category breakdowns
- archetype
- tier
- recommendations seed data

---

## Build order

### Phase 1 — OpenCV preprocessing module
Implement:
- blur score
- brightness score
- contrast score
- input normalization
- crop prep

### Phase 2 — InsightFace module
Implement:
- face detection
- face alignment
- normalized face crop output
- embeddings output
- multiple-face handling

### Phase 3 — MediaPipe module
Implement:
- dense landmarks
- facial ratios
- thirds
- symmetry metrics
- pose-derived features

### Phase 4 — LooksMaxxing calibration module
Implement:
- score mapping
- category score mapping
- tier mapping
- archetype mapping
- confidence / rejection mapping
- recommendation trigger logic

### Phase 5 — App integration
Replace current app-side heuristic analysis with service-backed outputs.

---

## Immediate next engineering tasks
1. scaffold `analysis-backend/`
2. choose Python stack for OpenCV + InsightFace + MediaPipe
3. define request/response schema
4. implement preprocessing module first
5. then face detection/alignment
6. then landmark extraction
7. then calibration layer

---

## Reality check
This is now backend/computer-vision engineering work, not just app product work.

The likely cleanest implementation path is:
- Python service for CV stack
- LooksMaxxing mobile app calls service locally or over LAN/dev host during development

That is the most practical way to use OpenCV + InsightFace + MediaPipe together.
