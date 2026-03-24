# API_SPEC.md

## API style
Simple REST API for MVP. Local-first compatible.

## Endpoints

### POST /v1/analyses
Create a new analysis session.
Request:
- photo_count
- user_id (optional in local mode)
Response:
- analysis_id
- upload_urls or upload instructions

### POST /v1/analyses/:id/photos
Attach uploaded photo metadata.
Request:
- storage_url or local reference
- original_order
Response:
- photo_id

### POST /v1/analyses/:id/run
Trigger analysis.
Response:
- status: queued | running | completed | failed

### GET /v1/analyses/:id
Return full analysis result.
Response includes:
- overall_score
- confidence_level
- recommended_primary_photo_id
- weakest_photo_id
- ranked_photos
- strengths
- weaknesses
- action_plan
- premium_preview

### GET /v1/analyses
Return saved analyses for current user.

### GET /v1/analyses/:id/premium
Return premium-only details if unlocked.

### POST /v1/premium/unlock
Create/confirm premium unlock.

### GET /v1/me
Return basic user/profile state.

### PATCH /v1/me/settings
Update basic settings.

## Error rules
- no vague generic failures
- upload failures should be recoverable
- analysis failure should preserve session and allow retry

## MVP contract rule
Do not expose fake claims of scientific certainty. Response language should stay grounded in profile effectiveness and first-impression optimization.
