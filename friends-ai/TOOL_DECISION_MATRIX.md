# FRIENDS AI
## TOOL DECISION MATRIX

This doc converts the broad tool landscape into an actual decision framework for the pilot.

Decision rule:
Choose the smallest stack that can still plausibly produce an impeccable 4-minute pilot.

---

# 1) DECISION COLUMNS

For each category, evaluate by:
- role in pipeline
- candidate tools
- required now vs later
- API importance
- quality potential
- control / repeatability
- speed
- cost / subscription burden
- recommendation

---

# 2) DECISION MATRIX

## A) Still image / identity lock generation
### Role
- character look lock
- lineup generation
- set identity lock
- visual canon establishment

### Candidates
- Midjourney
- Flux via Replicate
- Flux via Fal
- local ComfyUI / SD
- OpenAI image API

### Evaluation
**Midjourney**
- quality potential: very high for vibe / taste
- control / repeatability: medium
- speed: high
- API importance: low / not ideal for automation
- cost burden: moderate
- use case: first-pass look exploration, vibe discovery

**Flux via Replicate/Fal**
- quality potential: high
- control / repeatability: high
- speed: medium-high
- API importance: high
- cost burden: usage-based
- use case: canonical identity-lock generation and repeatable still workflow

**ComfyUI / local SD**
- quality potential: medium-high depending workflow
- control / repeatability: very high
- speed: variable
- API importance: none externally
- cost burden: setup time / local compute
- use case: backup control path, deeper iteration later

### Decision
**Chosen stack:**
- Primary exploration: **Midjourney**
- Primary repeatable still generation: **Flux API path** (Replicate or Fal)
- Backup control path: **ComfyUI / local SD** only if needed later

### Why
This gives both:
- strong taste discovery
- controllable repeatability

---

## B) Video generation
### Role
- moving shots
- establishing shots
- scene motion
- camera movement
- performance base for pilot sequence

### Candidates
- Kling
n- Runway
- Luma
- Pika
- PixVerse

### Evaluation
**Kling**
- quality potential: very high
- control: medium-high
- cinematic output potential: strong
- API importance: medium depending access
- use case: primary cinematic shot generation

**Runway**
- quality potential: high
- control: high in broader workflow ecosystem
- polish / creative tooling: strong
- API importance: medium
- use case: alternate shot generation, refinement, secondary engine

**Luma**
- quality potential: medium-high
- control: medium
- use case: optional third engine for experimentation

### Decision
**Chosen stack:**
- Primary video engine: **Kling**
- Secondary / backup video engine: **Runway**
- Optional fallback: **Luma**

### Why
An impeccable pilot should not depend on a single motion engine.

---

## C) Character dialogue / facial performance
### Role
- lip sync
- believable dialogue animation
- emotional face performance
- speaking shots

### Candidates
- Hedra
- HeyGen
- D-ID
- open-source alternatives

### Evaluation
**Hedra**
- quality potential: promising for expressive performance work
- control: medium
- API importance: medium
- use case: likely best early test candidate

**HeyGen**
- quality potential: high for talking-character workflows
- control: medium-high
- API importance: medium-high
- use case: strong contender if character fidelity works

**D-ID**
- quality potential: workable but may feel less premium depending result
- use case: fallback

### Decision
**Chosen approach:**
- Test **Hedra vs HeyGen** before locking
- Keep **D-ID** as tertiary fallback only

### Why
This category is too important to decide blindly without a side-by-side test.

---

## D) Voice generation
### Role
- final character voices
- dialogue performance
- emotional delivery

### Candidates
- ElevenLabs
- Cartesia
- PlayHT
- OpenAI TTS

### Evaluation
**ElevenLabs**
- quality potential: very high
- voice quality / emotional performance: strong
- API importance: high if automating
- recommendation strength: strongest current candidate

**Cartesia**
- quality potential: promising
- use case: secondary comparison if needed

**OpenAI TTS / others**
- useful but less likely first choice for best emotional performance here

### Decision
**Chosen stack:**
- Primary voice platform: **ElevenLabs**
- Optional comparison: **Cartesia** if needed later

---

## E) Music
### Role
- intro-adjacent warmth
- cue beds
- emotional transitions

### Candidates
- Suno
- Udio
- licensed library
- custom cue

### Evaluation
**Suno / Udio**
- useful for exploratory original cues
- not final by default unless quality truly lands

**Licensed library**
- lower creative novelty, higher reliability

**Custom cue**
- strongest long-term if pilot proves worth it

### Decision
**Chosen approach:**
- exploratory generation via **Suno or Udio**
- final selection may still come from a licensed or custom path

---

## F) Image cleanup / compositing
### Role
- repair artifacts
- consistency cleanup
- compositing
- scene polish

### Candidates
- Photoshop
- Magnific
- Photopea

### Decision
**Chosen stack:**
- Primary cleanup: **Photoshop**
- Enhancement/detail pass: **Magnific**

---

## G) Editing / assembly
### Role
- final cut
- pacing
- SFX/music layering
- subtitles
- export

### Candidates
- Premiere Pro
- DaVinci Resolve
- CapCut

### Decision
**Chosen stack:**
- Primary editor: **Premiere Pro or DaVinci Resolve**
- Secondary social utility only: **CapCut**

### Note
This choice can stay unresolved until actual edit stage if John already has a preferred editor.

---

## H) Enhancement / upscale
### Role
- sharpen images
- upscale final shots
- smooth quality inconsistencies

### Candidates
- Topaz Video AI
- Magnific
- Runway enhancement

### Decision
**Chosen stack:**
- Primary video enhancement: **Topaz Video AI**
- still/detail assist: **Magnific**

---

# 3) FINAL RECOMMENDED STACK

## Locked recommendation for now
### Still images
- Midjourney
- Flux API path (Replicate or Fal)

### Video
- Kling
- Runway

### Dialogue animation
- Hedra vs HeyGen test decision still required

### Voices
- ElevenLabs

### Music
- Suno or Udio exploration

### Cleanup
- Photoshop
- Magnific

### Edit
- Premiere Pro or DaVinci Resolve

### Enhancement
- Topaz Video AI

---

# 4) WHAT IS ACTUALLY LOCKED VS STILL OPEN

## Locked enough to plan around
- Midjourney as vibe tool
- Flux API path as repeatable still path
- Kling + Runway as dual video lane
- ElevenLabs as primary voice lane
- Photoshop + Magnific for cleanup
- Topaz for enhancement

## Still open / requires test or user preference
- Hedra vs HeyGen
- Suno vs Udio
- Premiere vs Resolve
- Replicate vs Fal for Flux access

---

# 5) IMMEDIATE DECISIONS NEEDED FROM ACCESS STANDPOINT

The fastest way to unblock production is to determine whether we have or can get access to:
1. Midjourney
2. one Flux API path (Replicate or Fal)
3. Kling
4. Runway
5. Hedra and/or HeyGen
6. ElevenLabs
7. Suno or Udio
8. Photoshop
9. Topaz
10. Magnific

---

# 6) NEXT STEP

Use `API_ACCESS_TRACKER.md` to mark:
- already have
- need account access
- need API key
- optional / later
- not needed right now
