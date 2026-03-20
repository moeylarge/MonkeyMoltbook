# FACEMAXX Training Backlog

## Immediate
- [ ] Finalize measurement schema
- [ ] Expand current face-detection code to log structured measurement vectors
- [ ] Decide on storage format for captured training samples
- [ ] Draft rating rubric for human evaluators

## Dataset
- [ ] Build sample manifest format
- [ ] Collect first 100 internal test samples
- [ ] Validate measurement stability across repeat photos
- [ ] Expand to 1k+ samples with multiple ratings per image

## Model
- [ ] Choose pretrained vision backbone
- [ ] Define feature fusion architecture
- [ ] Train v1 overall score head
- [ ] Train category heads
- [ ] Train archetype head
- [ ] Add confidence head

## Calibration
- [ ] Define rejection thresholds
- [ ] Define confidence buckets
- [ ] Map output score to FACEMAXX tiers
- [ ] Calibrate explanation templates to low/high confidence states

## Product integration
- [ ] Replace current heuristic scoring path with model inference path
- [ ] Surface confidence/rejection states in UI
- [ ] Update battle mode to compare confidence-adjusted scores
- [ ] Update improvement recommendations to use calibrated measured weaknesses
