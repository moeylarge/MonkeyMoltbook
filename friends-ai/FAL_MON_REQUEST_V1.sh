#!/usr/bin/env bash
set -euo pipefail

cd /Users/moey/.openclaw/workspace/friends-ai
set -a
source ./.env
set +a

curl -X POST "https://fal.run/fal-ai/flux/schnell" \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "prompt": "Create Mon, an elegant anthropomorphic swan woman for a premium comfort-sitcom ensemble. She has a long graceful neck, refined posture, poised body language, controlled facial expressions, and a polished upscale presence. Her energy is elegant, organized, slightly intense, emotionally controlled, and subtly high-strung. She should look like someone who cares too much and hides it under perfect composure. Wardrobe should be tailored, tasteful, and refined — soft luxury, structured silhouettes, ivory, champagne, muted emerald, black accents, and clean elegant styling. The overall image should feel warm, premium, stylish, emotionally readable, and original, set in a cozy upscale urban comfort-sitcom world with soft amber lighting, creamy neutrals, warm wood, muted green, brushed brass, and subtle cinematic polish.",
    "negative_prompt": "Avoid childish cartoon proportions, cheap furry fandom styling, Disney-princess energy, fantasy swan queen aesthetics, bridal styling, mascot design, exaggerated bird features, plastic CGI surfaces, loud costume design, neon palette overload, generic editorial fashion pose, cold lifeless expression, exact resemblance to any copyrighted sitcom character, or messy/sloppy wardrobe.",
    "image_size": "portrait_4_3",
    "num_images": 4,
    "enable_safety_checker": true,
    "sync_mode": true
  }'
