# DATABASE_SCHEMA.md

## Entities

### users
- id (uuid, pk)
- created_at
- email (nullable for MVP if anonymous/local mode exists)
- display_name (nullable)
- premium_status (enum: free, premium)
- settings_json

### analyses
- id (uuid, pk)
- user_id (fk users.id)
- created_at
- overall_score (int)
- confidence_level (enum: low, medium, high)
- recommended_primary_photo_id (fk uploaded_photos.id)
- weakest_photo_id (fk uploaded_photos.id)
- summary_json
- premium_unlocked (boolean)

### uploaded_photos
- id (uuid, pk)
- analysis_id (fk analyses.id)
- storage_url
- local_uri (nullable for local mode)
- original_order (int)
- final_rank (int, nullable until scored)
- removed_before_analysis (boolean default false)
- metadata_json

### photo_scores
- id (uuid, pk)
- photo_id (fk uploaded_photos.id)
- clarity_score (int)
- confidence_score (int)
- lighting_score (int)
- framing_score (int)
- style_score (int)
- expressiveness_score (int)
- approachability_score (int)
- lead_photo_strength_score (int)
- notes_json

### profile_reports
- id (uuid, pk)
- analysis_id (fk analyses.id)
- strengths_json
- weaknesses_json
- action_plan_json
- replacement_suggestions_json
- archetype_json (nullable/premium)

### premium_unlocks
- id (uuid, pk)
- user_id (fk users.id)
- analysis_id (fk analyses.id, nullable)
- provider (text)
- provider_ref (text)
- status (enum: pending, active, failed, refunded)
- created_at

### sessions
- id (uuid, pk)
- user_id (fk users.id)
- created_at
- last_seen_at
- device_info_json

## MVP storage rule
Keep schema lean. Use JSON columns/objects for report payloads until patterns stabilize.
