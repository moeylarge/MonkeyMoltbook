# FRIENDS AI
## IDENTITY LOCK RUNBOOK

This is the last planning-to-execution bridge before actual generation.

Purpose:
- define which chosen tool to use for each first-pass asset
- define execution order
- define review checkpoints
- define when to regenerate vs move on

Important rule:
Do not attempt full pilot-shot generation until this runbook is completed successfully.

---

# 1) CHOSEN STACK FOR IDENTITY LOCK PHASE

## Primary still-image stack
- **Midjourney** = vibe exploration / premium taste pass
- **Flux via Replicate** = repeatable canonical still generation

## Backup still path
- **Flux via Fal** or local ComfyUI only if Replicate is unavailable or underperforms

## Review / cleanup support
- **DRIFT_REVIEW_FRAMEWORK.md** = scoring and regeneration decisions
- **Photoshop** = optional cleanup only after identity lock, not before core selection

## Not used yet in this phase
- Kling
- Runway
- Hedra
- HeyGen
- ElevenLabs
- Suno/Udio
- Topaz

Those come after look/world canon is locked.

---

# 2) PHASE GOAL

By the end of identity lock, we need:
1. all 7 characters visually locked enough for continuity
2. a clean lineup image
3. Central Peak locked
4. apartment 2A locked
5. apartment 2B locked
6. hallway locked
7. enough confidence to start pilot masters without visual drift

---

# 3) EXECUTION ORDER

## Stage 0 — access verification
Before generation:
- verify Midjourney access
- verify Replicate access for Flux
- if Replicate unavailable, choose Fal as substitute

Do not proceed until at least:
- one vibe tool is usable
- one repeatable still-generation path is usable

---

## Stage 1 — character vibe exploration in Midjourney
Generate first-pass look exploration for:
1. Mon
2. Chance
3. Russ
4. Rachelle
5. Jojo
6. Fufu
7. Gunty

### Why this order
- Mon + Chance define the core chemistry lane fastest
- Russ + Rachelle define the romantic softness
- Jojo + Fufu define warmth/comedy range
- Gunty defines supporting-world realism

### Output target
For each character:
- 2 to 4 strong identity-lock variants max
- do not overgenerate endlessly

### Review checkpoint A
After each character batch:
- score with `DRIFT_REVIEW_FRAMEWORK.md`
- choose:
  - one provisional favorite
  - one backup if needed

### Move-on rule
Move on when a character gets:
- at least one **4/5+** variant

If not:
- tighten prompt
- rerun only that character

---

## Stage 2 — canonical still lock in Flux via Replicate
Using the chosen Midjourney vibe direction, regenerate the selected character canon looks in a more repeatable pipeline.

Generate in same order:
1. Mon
2. Chance
3. Russ
4. Rachelle
5. Jojo
6. Fufu
7. Gunty

### Output target
For each character:
- 1 to 2 canonical candidates
- not broad exploration, but locking

### Review checkpoint B
Score each with `DRIFT_REVIEW_FRAMEWORK.md`.

### Keep rule
Keep only if:
- overall score is **4/5 or higher**
- silhouette and tone are trustworthy
- production continuity usefulness is high

### Regenerate rule
Regenerate only if:
- the canonical Flux version loses the character compared to the exploration version
- or if continuity usefulness drops below 4

---

## Stage 3 — lineup generation
Once all 7 characters have provisional canon looks:
- generate the full lineup

### Tool
- Flux via Replicate first
- Midjourney only if lineup composition is failing aesthetically

### What to review
- silhouette separation
- color separation
- cast cohesion
- Gunty as support
- premium tone

### Move-on gate
Do not continue to set generation unless lineup feels:
- coherent
- premium
- clearly one show

If 2+ characters feel wrong in the lineup:
- go back and fix character canon first

---

## Stage 4 — world identity lock
Generate in this order:
1. Central Peak
2. apartment 2A
3. apartment 2B
4. hallway

### Primary tool
- Midjourney for taste exploration
- Flux via Replicate for repeatable canonical lock

### Review after each set
Use the set section of `DRIFT_REVIEW_FRAMEWORK.md`.

### Must-lock goals
- Central Peak = iconic social hearth
- 2A = polished emotional hub
- 2B = relaxed comedic hub
- hallway = useful sitcom mini-stage

### Regenerate rule
Only regenerate the set that drifted.
Do not rerun all locations because one failed.

---

# 4) EXACT REVIEW CHECKPOINTS

## Checkpoint A — after each character exploration batch
Ask:
- Is the species clearly right?
- Is the personality readable at a glance?
- Does it feel premium rather than furry/cartoon?
- Is this worth translating into canonical repeatable still generation?

## Checkpoint B — after each canonical character lock
Ask:
- Would I trust this design for future shot continuity?
- Is the face stable enough?
- Is wardrobe logic right?
- Is the emotional tone correct?

## Checkpoint C — after lineup
Ask:
- Do these 7 belong to the same show?
- Is anyone too weak or too loud?
- Can I identify everyone instantly?

## Checkpoint D — after each set
Ask:
- Is this location iconic enough?
- Can scenes actually happen here?
- Is it distinct from the other spaces?
- Is it original enough while still serving the comfort-sitcom function?

---

# 5) WHEN TO REGENERATE VS MOVE ON

## Regenerate when
- overall score under 4
- species or silhouette unclear
- premium tone breaks
- image feels too derivative
- image feels too furry/cartoon/cheap
- room or character would poison continuity if reused

## Move on when
- the asset is at least 4/5
- the weaknesses are minor and non-structural
- the asset is usable canon

## Hard rule
Do not chase perfection emotionally.
Lock what is:
- correct
- useful
- repeatable
- good enough to support the next step

---

# 6) SUGGESTED FOLDER OUTPUTS

Store outputs in a structure like:
- `friends-ai/assets/identity-lock/characters/mon/`
- `friends-ai/assets/identity-lock/characters/chance/`
- `friends-ai/assets/identity-lock/characters/russ/`
- `friends-ai/assets/identity-lock/characters/rachelle/`
- `friends-ai/assets/identity-lock/characters/jojo/`
- `friends-ai/assets/identity-lock/characters/fufu/`
- `friends-ai/assets/identity-lock/characters/gunty/`
- `friends-ai/assets/identity-lock/lineup/`
- `friends-ai/assets/identity-lock/sets/central-peak/`
- `friends-ai/assets/identity-lock/sets/2a/`
- `friends-ai/assets/identity-lock/sets/2b/`
- `friends-ai/assets/identity-lock/sets/hallway/`

If desired, add a simple `notes.md` in each folder with:
- chosen prompt
- rejected drift
- locked version name

---

# 7) COMPLETION CONDITION

Identity lock is complete only when:
- all 7 characters are locked enough for continuity
- lineup feels castable and premium
- Central Peak is locked
- 2A is locked
- 2B is locked
- hallway is locked
- drift review says the world is consistent enough to begin pilot masters

---

# 8) WHAT HAPPENS NEXT

After identity lock succeeds:
1. begin pilot masters
2. generate priority shots from `PROMPT_PACK_V1.md`
3. review with the drift framework again
4. then move into motion/video generation

That is the correct handoff from still-canon work into actual pilot production.
ot production.
