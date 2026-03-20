# FACEMAXX Model Plan

## v1 model recommendation
Use a multi-head model, not a single black-box score.

### Inputs
1. image embedding from pretrained vision backbone
2. structured measurement vector from `measurement_schema.json`
3. quality/confidence vector

### Outputs
- overall score
- category scores
- archetype classification
- confidence estimate
- optional potential-upside estimate

## Training strategy
- start from pretrained vision model
- fuse with structured features
- train lightweight output heads
- evaluate against mean human ratings

## Core evaluation metrics
- score MAE / RMSE
- category MAE
- confidence calibration error
- archetype accuracy
- agreement vs mean human rating

## Confidence / rejection layer
Do not always score every input.

Reject or down-rank if:
- no face detected
- multiple faces detected
- low lighting
- low face size ratio
- extreme pose
- low landmark confidence
- high occlusion risk

## Integration plan
1. measurement extraction
2. offline dataset collection
3. model training/evaluation
4. API or on-device inference wrapper
5. UI calibration
