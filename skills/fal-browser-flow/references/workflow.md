# FAL Browser Flow — Workflow Reference

## Purpose

Use this reference when a FAL task mixes browser generation with local file prep and local assembly.

This workflow exists because the browser is good at:
- generation
- result actions
- model switching

while the workspace is better for:
- file naming
- compression
- manifests
- exports
- assembly

---

## 1. Pre-stage assets locally

Before uploading anything to FAL:
- identify the exact source image/video needed
- create a smaller upload-ready copy if browser upload limits matter
- place upload-ready assets in a dedicated folder

Recommended naming:
- `01-central-peak-master-upload.jpg`
- `04-mon-chance-upload.jpg`
- `07-ensemble-payoff-upload.jpg`

Why:
- prevents repeated oversized upload failures
- keeps the browser step short
- reduces confusion about which image should be uploaded

---

## 2. Use the browser only for generation-critical steps

Use browser actions for:
- opening the correct FAL result page
- pressing **Make Video**
- changing model type
- pasting the exact prompt
- running the generation
- downloading the output

Avoid doing long-term organization in the browser.

---

## 3. Keep prompts scoped by shot type

### Still image generation
Use prompt language for:
- character identity
- environment identity
- composition
- wardrobe consistency

### Motion / image-to-video
Use prompt language for:
- subtle motion only
- restrained camera movement
- stable faces
- emotional readability
- no chaotic motion

Do not reuse still-image prompts blindly for motion generation.

---

## 4. Naming rule after every successful generation

Rename outputs immediately after they land in the workspace.

Examples:
- `04-mon-chance-motion.mp4`
- `05-russ-rachelle-motion.mp4`
- `07-ensemble-payoff-motion.mp4`
- `08-group-regather-motion.mp4`

Do not leave outputs as:
- `output.mp4`
- `output (1).mp4`
- `image.png`

Those names destroy continuity fast.

---

## 5. Assembly rule

Once enough assets exist:
- stop generating for a moment
- assemble a real cut locally
- review the cut
- identify the single biggest gap
- generate only the next highest-leverage asset

Do **not** keep generating random new assets without testing the current sequence.

---

## 6. Best browser-human split

Use the assistant for:
- prompt design
- file prep
- naming
- manifests
- assembly
- diagnosing the next bottleneck

Use the human for:
- drag-and-drop uploads
- subjective keeper selection
- recovering browser state fast
- quick result-page actions when browser UI is brittle

---

## 7. Recovery rules

If a generation goes wrong, first ask:
1. Was the wrong source image uploaded?
2. Was the wrong FAL model selected?
3. Was the shot supposed to be still or motion?
4. Was the result dropped into the correct local folder?
5. Was the asset renamed clearly?

Fix the smallest upstream mistake first.

---

## 8. Recommended folder pattern

Inside the project folder:
- `story-shots/`
- `upload-ready/`
- `motion-clips/`
- `audio-temp/`
- `exports/`

This keeps browser work separate from local assembly.

---

## 9. Practical stop conditions

Stop the browser loop when one of these is true:
- the needed shot exists and is named
- the next bottleneck is assembly, not generation
- the cut needs review before more prompting
- the remaining issue is voice or timing, not visuals

At that point, return to local edit work.
