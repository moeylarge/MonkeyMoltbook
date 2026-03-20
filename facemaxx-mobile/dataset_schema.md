# LooksMaxxing Dataset Schema

## Objective
Create a small, high-quality labeled dataset for training the LooksMaxxing v1 scoring model.

## Recommended initial size
- 1,000–5,000 face images
- 3+ human ratings per image minimum

## Per-sample fields
- `image_id`
- `image_path` or storage URI
- `consent_status`
- `source`
- `capture_type` (camera|upload|other)
- `feature_vector_path` or embedded measurement JSON
- `quality_flags`
- `overall_rating_mean`
- `overall_rating_variance`
- `jawline_rating_mean`
- `eyes_rating_mean`
- `skin_rating_mean`
- `symmetry_rating_mean`
- `hair_framing_rating_mean`
- `facial_harmony_rating_mean`
- `archetype_label`
- `review_notes`

## Rating guidance
- multiple raters per image
- use averaged labels, not single-person truth
- track disagreement
- flag low-consensus samples for review

## Data quality filters
Reject or tag images if:
- no visible face
- multiple faces
- face too small
- heavy occlusion
- extreme angle
- heavy beauty filter / strong edit
- extremely low resolution

## Recommended splits
- train: 70%
- validation: 15%
- test: 15%

Split by identity/source where possible to reduce leakage.
