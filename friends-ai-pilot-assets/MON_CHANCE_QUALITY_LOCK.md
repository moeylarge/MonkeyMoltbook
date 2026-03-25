# MON + CHANCE — QUALITY LOCK PLAN

## Purpose

This document fixes the production order before more generation happens.

The objective is **not** to keep generating random variants.
The objective is to lock one hero shot for `Not a Couple` that is genuinely in the same quality class as the TikTok reference John provided.

Until this shot passes, the rest of the pilot should **not** move forward into full final-shot generation.

---

## Why this exists

Mon + Chance is the correct hero shot because:
- it is the strongest chemistry engine in the pilot
- if this shot looks cheap, the whole pilot looks cheap
- if this shot passes, it becomes the visual and emotional anchor for the rest of the scene

This is the style-lock shot.

---

## Current state

### Attempt summary
- Flux pass 1: generated but failed reference bar
- Flux pass 2: stricter prompt, but drifted into flatter illustrated/cartoon result
- Flux pass 3: clearer shot direction, but still not strong enough to trust as premium reference-grade base

### Diagnosis
The failure is **not just prompt quality**.
The failure is a combination of:
- wrong model taste for this specific target
- insufficiently locked show style
- trying to discover look + direct performance + generate finals all at once

---

# Non-negotiable rule

Do **not** proceed to the rest of the 8-shot package until Mon + Chance passes all quality gates below.

If the shot is merely:
- decent
- better than before
- usable
- promising

…it still fails.

---

# Quality target

The approved Mon + Chance hero shot must feel like:
- a premium AI-native episodic frame
- emotionally specific romantic-comedy tension
- polished enough that we would place it in the same quality class as the TikTok reference without making excuses

---

# Required pass criteria

## Gate 1 — Still frame pass
Before any animation, the still alone must pass all of these:

### Composition
- clear medium two-shot
- deliberate character spacing
- no accidental poster composition
- readable depth and visual hierarchy

### Character readability
- Mon reads controlled, guarded, affected
- Chance reads relaxed, amused, slightly provocative
- their relationship is legible at a glance

### Emotional tension
- the shot should communicate awkward romantic pressure without needing dialogue
- if it just looks like two attractive people in a cafe, it fails

### Finish quality
- premium, polished, intentional
- no generic AI prettiness
- no ad / glamour / fashion-shoot drift
- no mascot/fursuit/cartoon-softness drift

### Identity stability
- fully human faces
- attractive and consistent
- no warped anatomy
- no duplicate people
- no weird hands / limbs / background corruption

### Show-world fit
- warm Central Peak atmosphere
- sitcom-comfort world, not fantasy or hyper-luxury moodboard

If any of the above fails, the still fails.

---

## Gate 2 — Motion pass
Only animate an approved still.

The motion version must pass:

### Motion quality
- subtle, premium, natural movement
- no rubbery face drift
- no twitch / morphing / floating energy
- no fake slideshow feel

### Performance quality
- motion increases emotional tension instead of flattening it
- eye lines and micro reactions remain believable

### Visual integrity
- faces stay stable through the whole beat
- no collapse in identity after the first second

If the motion makes the shot worse, the motion fails.

---

## Gate 3 — Episode fit pass
After still + motion pass, the shot must also work as a scene beat.

It must:
- support the Mon/Chance dialogue beat
- feel like it belongs in the same show world as the rest of the pilot
- be strong enough to become the anchor for other shot generations

If it works alone but not as episode grammar, it still fails.

---

# Visual bible for this shot

## World
- Central Peak
- warm comfort-sitcom cafe
- clean but lived-in
- cinematic warmth, not glossy commercial polish

## Mon
- controlled
- sharp
- emotionally affected but hiding it
- guarded posture
- no glam posing
- no exaggerated anger

## Chance
- dry
- amused
- low-pressure confidence
- close enough to create tension, not dominance
- not smirking like a model shoot

## Camera language
- medium two-shot preferred
- subtle depth
- intimate but not melodramatic
- directed scene frame, not promo art

## Tone
- romantic-comedy discomfort
- emotional tension under social normalcy
- premium episodic style

---

# Model test order

This is the correct generation order.

## Attempt A — Nano Banana Pro
Use as the next primary still-generation / edit path.

### Why
- better semantic editing potential
- more likely to preserve directed intent
- better candidate for polishing into a premium frame than Flux for this shot type

### Goal
Use a stronger still-generation/edit workflow to create a frame that already feels like a finished episode shot.

---

## Attempt B — alternate high-end still path in fal
If Nano Banana still fails, test another stronger still-generation path that is more cinematic/character-oriented than Flux 2 Flex.

### Rule
Do not fall back to Flux just because it is familiar.

---

## Attempt C — motion model comparison
Only after a still passes.

Animate the winning still through:
1. Veo
2. Kling if Veo weakens the shot

### Why
Different motion models may be stronger for pair chemistry vs ensemble social reaction.

---

# Stop conditions

## Stop and continue to shot family only if:
- still pass = yes
- motion pass = yes
- episode-fit pass = yes

## Stop and revise upstream if:
- still quality misses target
- motion degrades faces
- shot looks generic or ad-like
- emotional read is weak

---

# Rejection rules

Reject immediately if the shot has:
- generic attractive AI-couple vibe instead of character tension
- over-stylized cartoon softness
- fashion campaign / poster energy
- background inconsistency strong enough to break scene trust
- faces that are stable but not emotionally right
- “better than before” but still not reference-grade finish

---

# Success definition

Mon + Chance is considered locked only when I can honestly say:

> This shot is strong enough that I would use it as the quality/style anchor for the rest of the pilot, and I would not be embarrassed to compare it against the TikTok reference class.

If I cannot say that cleanly, it is not locked.

---

# What happens after lock

Once Mon + Chance passes:

1. document exact winning recipe
   - model
   - prompt structure
   - aspect ratio
   - any edit/refinement notes
   - motion model choice

2. create style-anchor notes for the rest of the pilot
   - Russ + Rachelle should inherit finish and intimacy language
   - Jojo + Fufu should inherit world consistency with lighter energy
   - ensemble shots should inherit same lighting/finish/show identity

3. only then proceed to the rest of final-shot generation

---

# Operational rule for John-facing updates

Do **not** present another revised pilot as if it is ready until this quality-lock process is satisfied.

For interim updates, be explicit:
- passed still gate
- failed motion gate
- failed model taste
- next test is X

No vague optimism.
No pretending a maybe-pass is a pass.

---

## Immediate next action

Proceed to **Attempt A — Nano Banana Pro** for Mon + Chance still-generation / refinement.

Do not touch shot 02–08 final generation until Mon + Chance is locked.
