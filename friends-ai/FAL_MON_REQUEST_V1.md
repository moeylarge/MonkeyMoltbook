# FRIENDS AI
## FAL MON REQUEST V1

This is the first direct Fal request format for generating Mon.

## Endpoint
- `https://fal.run/fal-ai/flux/schnell`

## Why this model first
- fast
- cheap enough for early identity-lock passes
- good for first-pass character exploration before moving to tighter canon selection

## Request shape

### Shell script
Use:
- `friends-ai/FAL_MON_REQUEST_V1.sh`

Run it with:
```bash
cd /Users/moey/.openclaw/workspace/friends-ai
bash FAL_MON_REQUEST_V1.sh
```

### Expected behavior
- loads `FAL_KEY` from `.env`
- sends one generation request to Fal
- asks for `4` image variants
- returns JSON with image URLs if successful

## Current settings
- model: `fal-ai/flux/schnell`
- `image_size`: `portrait_4_3`
- `num_images`: `4`
- `sync_mode`: `true`

## Why these settings
- portrait framing is better for character identity lock
- 4 variants gives enough comparison without wasting credits
- sync mode makes first-pass review simpler

## Review rule
After generation, do not move on emotionally.
Score the outputs using:
- `friends-ai/DRIFT_REVIEW_FRAMEWORK.md`

Keep only if Mon feels:
- elegant
- controlled
- premium
- original
- sitcom-usable

If she drifts, tighten the prompt instead of just rerolling blindly.
