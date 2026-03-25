# NOT A COUPLE — SHOT ANIMATION PROMPTS

## Purpose

This file contains the first-pass animation prompt language for converting the strongest still shots into moving clips.

These prompts are for **image-to-video / shot animation** style generation.

The goal is not explosive movement.
The goal is:
- subtle life
- emotionally readable motion
- premium sitcom feel
- controlled camera language

---

## Global animation rules

### Motion quality
Ask for motion that is:
- subtle
- character-driven
- premium
- emotionally readable
- stable and coherent

### Avoid
- exaggerated body motion
- random floaty AI movement
- rubbery faces
- chaotic gestures
- dramatic swooping cameras
- music-video energy
- fantasy sparkle / stylization drift

### Camera rule
Prefer:
- slight push-in
- very light drift
- locked or nearly locked camera
- sitcom readability

Avoid:
- whip pans
- crash zooms
- handheld chaos

### Character rule
Motion should come from:
- glances
- posture shifts
- reaction timing
- small facial changes
- subtle interpersonal tension

Not from:
- full-body overacting
- random limb movement
- exaggerated gesticulation

---

# PHASE 1 — HIGHEST PRIORITY SHOTS

## SHOT 04 — Mon + Chance

### Source still
`04-mon-chance.png`

### Goal
Turn the chemistry from a still image into a live moment.

### Prompt
```text
Animate this premium comfort-sitcom shot with subtle natural motion. Mon and Chance are standing together in Central Peak with clear romantic-comedy tension. Keep the composition, character identity, and wardrobe consistent. Add only small emotionally readable motion: slight eye movement, tiny posture shift, subtle breathing, a very small lean or change in distance, and restrained face reactions. Chance should feel amused and dry. Mon should feel controlled, slightly tense, and affected. Use a gentle cinematic push-in or very slight camera drift. Keep the motion premium, stable, and realistic for an animated sitcom. No exaggerated gestures, no chaotic movement, no rubbery faces, no dramatic camera moves.
```

### What success looks like
- the eye contact feels live
- the tension increases slightly
- nothing breaks or warps
- it feels like a held sitcom moment, not a generated gimmick

---

## SHOT 07 — ensemble payoff

### Source still
`07-ensemble-payoff.png`

### Goal
Make the final room reaction feel alive.

### Prompt
```text
Animate this ensemble comfort-sitcom shot with subtle natural group motion. Keep exactly the same six characters, same composition, same environment, and same wardrobe. The moment should feel like the room is reacting to a charged final line. Add small believable reaction movement: brief head turns, tiny eye shifts, subtle body tension, restrained posture changes, and a slight spreading reaction through the group. Mon’s reaction should read strongest, Chance should remain sly and calm, Russ should look awkward, Rachelle poised and amused, Jojo warm and confused, Fufu delighted by the chaos. Use a locked camera or extremely subtle push-in. Keep everything stable, premium, and readable. No duplicate characters, no flailing, no exaggerated gestures, no floaty AI motion, no dramatic camera moves.
```

### What success looks like
- the room feels socially alive
- the final beat spreads through the cast
- Mon’s reaction anchors the clip
- motion is controlled, not noisy

---

## SHOT 03 — group notices sign

### Source still
`03-group-notices-sign.png`

### Goal
Make the first ensemble reaction feel like a real moment in time.

### Prompt
```text
Animate this group shot inside Central Peak with subtle ensemble reaction movement. Keep the same six characters, same composition, same sign placement, same costumes, and same environment. The scene should feel like everyone is noticing the Couples Night sign for the first time. Add small readable motion only: slight head turns toward the sign, tiny posture adjustments, visible reaction changes, restrained eye movement, and natural breathing. Fufu should look delighted, Mon slightly tense, Chance amused, Russ awkward and processing, Rachelle intrigued, Jojo confused but game. Use stable premium sitcom camera language with only a very slight push-in if needed. No exaggerated reaction animation, no flailing, no duplicate animals, no chaos, no warping faces.
```

### What success looks like
- the room feels like it just collectively clocked the sign
- every character remains readable
- the shot gains life without becoming busy

---

## SHOT 01 — Central Peak master

### Source still
`01-central-peak-master.png`

### Goal
Make the world feel lived in before character-heavy motion starts.

### Prompt
```text
Animate this Central Peak establishing shot with subtle premium environmental motion. Keep the same cozy sitcom composition, same cafe layout, same couch zone, and same warm lighting. Add gentle ambient life only: a slight cinematic push-in, subtle lighting warmth, small environmental movement if possible, and a calm lived-in feeling. The space should feel welcoming and real, not busy. No dramatic camera motion, no chaotic background movement, no exaggerated animation, no stylistic drift.
```

### What success looks like
- the cafe feels alive
- the shot feels like the beginning of a real scene
- movement is understated and premium

---

# PHASE 2 — OPTIONAL CHARACTER SHOTS

## SHOT 05 — Russ + Rachelle

### Source still
`05-russ-rachelle.png`

### Prompt
```text
Animate this premium comfort-sitcom pair shot with subtle awkward romantic motion. Keep Russ and Rachelle consistent in identity, wardrobe, and composition. Add only small expressive changes: slight eye movement, gentle posture shift, a tiny nervous adjustment from Russ, and a poised amused reaction from Rachelle. Keep the camera nearly locked or use a very slight push-in. Preserve warmth, awkwardness, and sweetness. No exaggerated flirting, no big gestures, no unstable motion.
```

## SHOT 06 — Jojo + Fufu

### Source still
`06-jojo-fufu.png`

### Prompt
```text
Animate this premium comfort-sitcom pair shot with subtle comedy-chaos motion. Keep Jojo and Fufu consistent in identity, wardrobe, and composition. Add small readable motion: Jojo’s warm amused reaction, Fufu’s playful expressive movement, tiny posture changes, natural breathing, and slight eye shifts. The scene should feel lively but controlled. Use a very subtle push-in if needed. No exaggerated gesturing, no chaotic AI wobble, no unstable faces.
```

---

# SHOT LENGTH TARGETS

Use these motion clip targets as a first pass:
- Shot 01 — 3 to 5 seconds
- Shot 03 — 4 to 6 seconds
- Shot 04 — 5 to 8 seconds
- Shot 07 — 5 to 8 seconds
- Shot 05 — 4 to 6 seconds (optional)
- Shot 06 — 4 to 6 seconds (optional)

---

# PRODUCTION ORDER

Generate in this order:
1. Mon + Chance
2. ensemble payoff
3. group notices sign
4. Central Peak master
5. Russ + Rachelle (optional)
6. Jojo + Fufu (optional)

Why:
- chemistry first
- final payoff second
- group life third
- environment fourth

---

# QUALITY CHECK AFTER EACH GENERATED CLIP

Ask:
- does the clip feel more alive than the still?
- do faces remain stable?
- does motion increase emotion rather than distract from it?
- does it still feel like the same show?
- is the camera understated enough?

If the answer is no, do not keep generating random variants.
Tighten the prompt and try once more.

---

# STOP RULE

Stop phase 1 once:
- Mon + Chance works
- ensemble payoff works

At that point, the pilot will already feel materially more real.

---

# NEXT STEP AFTER THIS

Once the first motion clips exist, create:
- `MOTION_REVIEW.md`

That file should score each animated shot:
- usable
- needs one retry
- discard
