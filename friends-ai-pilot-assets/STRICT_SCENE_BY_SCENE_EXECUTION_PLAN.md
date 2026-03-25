# NOT A COUPLE — STRICT SCENE-BY-SCENE EXECUTION PLAN

## Purpose
Replace the current loose rebuild path with a deterministic scene plan tied to the actual workspace files.

This plan assumes the current best proof cut is:
- `friends-ai-pilot-assets/exports/friends-ai-not-a-couple-v6-open-on-motion.mp4`

And the current assembler output is:
- `friends-ai/assembler/output/not-a-couple-v1-auto.mp4`

## Current audit verdict

### What is materially true in the workspace
- The current assembler config is still legacy-oriented and uses **9 shots**:
  - `friends-ai/assembler/config/not-a-couple-v1.json`
- All motion clips currently in `friends-ai-pilot-assets/motion-clips/` are about **5.04s** long.
- The current assembler config stretches several shots to **6–10 seconds**, which conflicts with the final rebuild spec and is the exact pattern that creates weak hold energy.
- Current existing visuals are useful as **references only**, not publish-grade finals.

### Actual asset inventory now
- still board present:
  - `story-shots/01-central-peak-master.png`
  - `story-shots/02-couples-night-sign.png`
  - `story-shots/03-group-notices-sign.png`
  - `story-shots/04-mon-chance.png`
  - `story-shots/05-russ-rachelle.png`
  - `story-shots/06-jojo-fufu.png`
  - `story-shots/07-ensemble-payoff.png`
- upload-ready stills present for shots 01–07 in:
  - `friends-ai-pilot-assets/upload-ready/`
- motion references present for shots 03–09 in:
  - `friends-ai-pilot-assets/motion-clips/`

## Hard operating rule
Do not try to rescue the pilot by extending weak 5-second clips to carry 7–10 second performance beats.

If a shot cannot survive its required runtime at premium quality, regenerate upstream.

---

# Shot plan with pass/fail gates

## SHOT 01 — Central Peak establish

### Existing references
- still: `friends-ai-pilot-assets/story-shots/01-central-peak-master.png`
- upload-ready ref: `friends-ai-pilot-assets/upload-ready/01-central-peak-master-upload.jpg`
- old segment export: `friends-ai-pilot-assets/exports/segments/01-central-peak-master.mp4`

### Target
- duration: **3.0–4.0s**
- final asset type: premium still + subtle premium motion, or true short live shot

### Pass gate
- premium opening image immediately clears trust bar
- motion is subtle, intentional, non-cheap
- no dead air open

### Fail gate
- rough/slideshow opening
- overlong hold
- cheap zoom look

### Status now
**FAIL / REGENERATE**

---

## SHOT 02 — Couples Night sign insert

### Existing references
- still: `friends-ai-pilot-assets/story-shots/02-couples-night-sign.png`
- upload-ready ref: `friends-ai-pilot-assets/upload-ready/02-couples-night-sign-upload.jpg`
- old segment export: `friends-ai-pilot-assets/exports/segments/02-couples-night-sign.mp4`

### Target
- duration: **2.0–2.8s**
- final asset type: crisp insert with light parallax / subtle motion

### Pass gate
- instantly readable sign beat
- premium insert quality
- syncs tightly to Jojo line

### Fail gate
- muddy text / prop feel
- ornamental linger
- still looks like a temp insert

### Status now
**FAIL / REGENERATE**

---

## SHOT 03 — Group notices sign

### Existing references
- still: `friends-ai-pilot-assets/story-shots/03-group-notices-sign.png`
- upload-ready ref: `friends-ai-pilot-assets/upload-ready/03-group-notices-sign-upload.jpg`
- motion ref: `friends-ai-pilot-assets/motion-clips/03-group-notices-sign-motion.mp4`

### Target
- duration: **3.5–4.5s**
- final asset type: true ensemble motion

### Pass gate
- six-character reaction read is clear
- ensemble micro-reactions visible
- social problem lands immediately

### Fail gate
- sign insert mistaken for true group reaction
- generic drift instead of acting
- dead ensemble frame

### Status now
**FAIL / REGENERATE**

---

## SHOT 04 — Mon + Chance hero chemistry shot

### Existing references
- still: `friends-ai-pilot-assets/story-shots/04-mon-chance.png`
- upload-ready ref: `friends-ai-pilot-assets/upload-ready/04-mon-chance-upload.jpg`
- motion ref: `friends-ai-pilot-assets/motion-clips/04-mon-chance-motion.mp4`
- hero-lock prep folder: `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/`

### Target
- duration: **6.0–7.5s**
- final asset type: approved premium still first, then motion

### Pass gate
- still alone clears premium benchmark bar
- Mon reads guarded/affected
- Chance reads amused/provocative
- real chemistry visible without dialogue
- motion improves tension without face drift

### Fail gate
- mascot/cartoon/fursuit softness
- generic attractive-couple vibe
- flat promo-poster composition
- motion weakens faces or identity

### Status now
**FAIL / NOT LOCKED YET**

### Next action
Use the deterministic package in:
- `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/`

This is the current highest-leverage shot in the project.

---

## SHOT 05 — Russ + Rachelle awkward engine

### Existing references
- still: `friends-ai-pilot-assets/story-shots/05-russ-rachelle.png`
- upload-ready ref: `friends-ai-pilot-assets/upload-ready/05-russ-rachelle-upload.jpg`
- motion ref: `friends-ai-pilot-assets/motion-clips/05-russ-rachelle-motion.mp4`

### Target
- duration: **6.0–7.5s**
- final asset type: true pair motion

### Pass gate
- Russ visibly overcareful
- Rachelle visibly precise / amused
- line timing fits the shot without stretch hacks

### Fail gate
- generic pair shot
- weak acting readability
- clip cannot survive full line pair

### Status now
**FAIL / REGENERATE AFTER SHOT 04 LOCK**

---

## SHOT 06 — Jojo + Fufu comedy-chaos lift

### Existing references
- still: `friends-ai-pilot-assets/story-shots/06-jojo-fufu.png`
- upload-ready ref: `friends-ai-pilot-assets/upload-ready/06-jojo-fufu-upload.jpg`
- motion ref: `friends-ai-pilot-assets/motion-clips/06-jojo-fufu-motion.mp4`

### Target
- duration: **5.5–6.5s**
- final asset type: true pair motion

### Pass gate
- Fufu playful-dangerous
- Jojo warm/reactive
- energy lifts scene without breaking world style

### Fail gate
- noisy overacting
- low-grade fun instead of premium fun
- motion reads as generic float

### Status now
**FAIL / REGENERATE AFTER SHOT 04 LOCK**

---

## SHOT 07 — Group regather / social spiral setup

### Existing references
- best existing ensemble still ref: `friends-ai-pilot-assets/story-shots/07-ensemble-payoff.png`
- motion ref: `friends-ai-pilot-assets/motion-clips/08-group-regather-motion.mp4`

### Target
- duration: **5.0–6.0s**
- final asset type: true ensemble motion

### Pass gate
- at least 3+ characters readable at once
- room collision is visible
- overlapping discomfort feels authored

### Fail gate
- stretched weak clip
- ensemble is decorative rather than alive
- no readable social spiral

### Status now
**FAIL / REGENERATE**

---

## SHOT 08 — Final spiral / button shot

### Existing references
- best current ensemble still ref: `friends-ai-pilot-assets/story-shots/07-ensemble-payoff.png`
- motion refs:
  - `friends-ai-pilot-assets/motion-clips/07-ensemble-payoff-motion.mp4`
  - `friends-ai-pilot-assets/motion-clips/09-group-couples-night-motion.mp4`

### Target
- duration: **6.5–8.0s**
- final asset type: true ensemble motion

### Pass gate
- can carry final reaction chain and Chance button
- premium ensemble clarity
- strongest shot class in the package

### Fail gate
- final beat feels appended
- ensemble read collapses
- shot needs artificial hold rescue

### Status now
**FAIL / REGENERATE AFTER SHOT 04 LOCK**

---

# Required production order
1. Lock **Shot 04 Mon + Chance still**
2. Animate **Shot 04** only
3. Lock **Shot 08** ensemble button quality
4. Lock **Shot 03** notice/read quality
5. Regenerate **Shots 05, 06, 07**
6. Regenerate supporting **Shots 01, 02**
7. Run premium voice pass
8. Assemble a true final 8-shot cut

# Explicit blockers
- No locked Mon/Chance still yet that credibly clears the benchmark
- Current assembler timeline is still based on stretched legacy logic
- Existing motion clips are too short to honestly carry the intended dialogue beats without visible trust loss

# Immediate next action
Generate and review Mon + Chance hero-still candidates using the package in:
- `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/`

Do not move to package-wide final generation until Shot 04 passes still gate.