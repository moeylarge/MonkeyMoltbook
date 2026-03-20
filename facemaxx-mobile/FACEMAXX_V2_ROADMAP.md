# FACEMAXX v2 Roadmap

Updated: 2026-03-20

## Goal

Move FACEMAXX from a strong prototype into a real face-analysis product by building:
- a measurement pipeline
- a labeled dataset
- a trainable scoring model
- confidence/rejection logic
- calibrated outputs in the app UI

---

## Phase A — Measurement Pipeline

### Objective
Extract stable, interpretable facial features that can power both rule-based scoring and model training.

### Inputs
- captured image or uploaded image
- detected face bounds
- landmarks from face detector / landmark model

### Required outputs

#### Landmark outputs
- face bounds
- left eye center
- right eye center
- nose base / nose tip proxy
- mouth center / lip line proxy
- left cheek / right cheek proxies
- chin / jawline proxies if available
- face roll / tilt estimate

#### Ratio features
- face width / height ratio
- interocular distance ratio
- jaw width ratio
- lower third / middle third / upper third proportions
- nose centering ratio
- cheekbone-to-jaw proxy ratio
- eye-to-brow / eye-to-mouth vertical spacing proxies

#### Symmetry features
- nose center offset from face center
- eye height mismatch
- cheek/jaw horizontal asymmetry
- roll imbalance
- left/right landmark distance deltas

#### Quality / confidence features
- face count
- face size ratio in frame
- blur / sharpness proxy
- lighting quality proxy
- contrast quality proxy
- occlusion risk proxy
- angle / pose confidence
- landmark density / landmark confidence

### Deliverables
1. `measurement_schema.json`
2. feature extraction module
3. normalized feature vector format
4. logging format for training data generation

### Success criteria
- same image family produces stable features
- bad inputs are flagged as low-confidence
- feature vector is interpretable and debuggable

---

## Phase B — Small High-Quality Labeled Dataset

### Objective
Create a first useful dataset for training FACEMAXX v1 scoring.

### Target size
- initial target: 1,000–5,000 faces
- each face should ideally have multiple human ratings

### Per-sample data
- image id
- image path / storage reference
- measurement feature vector
- quality/confidence metrics
- overall attractiveness rating
- category ratings:
  - jawline
  - eyes
  - skin
  - symmetry
  - hair / framing
  - facial harmony
- archetype label or cluster label
- image quality label
- notes / moderation flags

### Labeling rules
- at least 3 raters per face, more if possible
- use averaged score and disagreement spread
- keep a confidence interval or rating variance
- track low-consensus samples separately

### Dataset constraints
- clear consent / legal source only
- no unknown scraping if product may become real
- avoid heavily filtered images where possible
- include varied lighting/angles, but mark them clearly

### Deliverables
1. `dataset_schema.md`
2. rating rubric
3. labeling guide
4. storage format for image + labels + features

---

## Phase C — v1 Scoring Model

### Objective
Train a model that predicts meaningful outputs from image + feature inputs.

### Model structure
Use a multi-head model instead of one black-box score.

#### Inputs
- image embedding from vision backbone
- measurement feature vector from Phase A
- quality/confidence vector

#### Outputs
- overall score
- category scores:
  - jawline
  - eyes
  - skin
  - symmetry
  - hair / framing
  - facial harmony
- archetype classification
- confidence score
- optional potential-upside estimate

### Recommended model strategy
- pretrained vision encoder
- fuse with structured landmark/ratio features
- train lightweight heads for each output

### Deliverables
1. training pipeline
2. experiment config
3. saved model versioning
4. evaluation metrics:
   - MAE / RMSE for scores
   - calibration error
   - class accuracy for archetypes
   - agreement vs human mean rating

---

## Phase D — Confidence + Rejection Logic

### Objective
Prevent bad inputs from producing overconfident bad outputs.

### Required rejection / warning states
- no face detected
- multiple faces detected
- face too small in frame
- extreme angle / non-frontal face
- low light
- low contrast
- blurry image
- occluded face
- low landmark confidence

### Output behavior
- either reject analysis
- or return low-confidence output with warnings

### Example UI messages
- "Face not clear enough for a confident read"
- "Lighting is suppressing skin and symmetry analysis"
- "Angle is too strong for reliable structural scoring"

### Deliverables
1. confidence score formula
2. rejection thresholds
3. fallback/warning messages
4. app-side display rules

---

## Phase E — Calibrate Into FACEMAXX UI

### Objective
Map scientific/technical outputs into the FACEMAXX product experience.

### UI outputs to calibrate
- overall score
- tier
- archetype
- category breakdowns
- improvement recommendations
- uncertainty prompts
- battle mode outcomes

### Calibration rules
- score should not jump wildly for minor image differences
- category scores must align with overall score
- archetype should be stable unless the image really changes
- low-confidence scans should visibly explain uncertainty
- battle mode should compare confidence-adjusted results

### Improvement recommendation logic
Recommendations should use:
- weak measured categories
- confidence level
- likely fixability
- image-quality suppression factors vs structural factors

### Deliverables
1. score-to-tier mapping
2. archetype assignment rules
3. calibrated explanation templates
4. confidence-aware recommendation layer

---

## Recommended build order from here

1. finalize measurement schema
2. implement measurement extraction module
3. log structured outputs from real app scans
4. define dataset schema + rater rubric
5. collect small labeled dataset
6. train v1 multi-head model
7. add confidence/rejection logic
8. plug calibrated outputs back into FACEMAXX UI

---

## Reality check

FACEMAXX is currently past prototype shell stage, but this roadmap is the bridge from:
- product theater
into
- real analysis product

Do not skip the measurement schema or dataset design. Those determine whether the model becomes trustworthy or noisy.
