# FRIENDS AI
## PRODUCTION STACK MAP V1

This document maps the full production tool landscape for creating the 4-minute pilot at high quality.

Purpose:
- identify every major tool category that could matter
- separate essential tools from optional tools
- identify where API access is actually needed
- avoid random tool sprawl
- define a recommended stack for an impeccable pilot

Important rule:
Do **not** assume we need every tool listed here.
This is the full landscape map first, then we choose the actual stack.

---

# 1) PRODUCTION PIPELINE CATEGORIES

To produce the pilot cleanly, the work breaks into these categories:

1. writing / scripting
2. visual development / concept art
3. character identity lock
4. environment / set identity lock
5. image generation
6. image editing / cleanup / compositing
7. image-to-video / text-to-video
8. talking-character / facial performance / lip sync
9. voice generation
10. sound design / SFX
11. music
12. editing / assembly
13. subtitles / captions
14. upscaling / enhancement
15. storage / asset management / prompt tracking
16. optional automation / orchestration via API

---

# 2) FULL PLATFORM LANDSCAPE BY CATEGORY

## A) Writing / scripting / planning
These are not all required, but they are common options.

### Candidate tools
- OpenAI / ChatGPT
- Claude
- Gemini
- Notion
- Google Docs
- Obsidian

### Role
- script drafting
- rewrite passes
- beat-sheet refinement
- dialogue sharpening
- prompt-writing support

### API needed?
- optional
- not required if used manually

### Recommendation
For this pilot, writing is already largely handled in the workspace docs.
No new paid writing API is necessary right now.

---

## B) Concept art / visual development / still generation

### Major candidate tools
- Midjourney
- Ideogram
- Flux ecosystem (Replicate, Fal, Together, local wrappers)
- OpenAI image generation
- Leonardo AI
- Krea
- Playground
- Recraft
- Magnific (more enhancement than pure ideation)
- Stable Diffusion local / ComfyUI

### Role
- character look development
- lineup generation
- world/set keyframes
- poster/key art
- style exploration

### API needed?
- sometimes yes, sometimes no
- Midjourney = no standard direct API in the normal mainstream sense; usually Discord/web workflow
- Replicate / Fal / Together / OpenAI image APIs = yes
- Leonardo / Krea / Recraft may be UI-first depending workflow and plan
- local Stable Diffusion / ComfyUI = no external API required if run locally

### Strong candidate choices
For this project, the strongest likely lanes are:
- **Midjourney** for premium concept-art ideation / vibe
- **Flux via Replicate or Fal** for API-friendly still generation
- **ComfyUI / local SD workflow** if we need deep control and repeatability

### Recommendation
For an impeccable pilot, do **not** rely on one still-image platform alone.
Best structure:
- one platform for fast style exploration
- one platform for controlled repeatable identity locking

---

## C) Image editing / cleanup / compositing

### Candidate tools
- Photoshop
- Photopea
- Figma (light utility use)
- Canva (light utility use)
- Affinity Photo
- GIMP
- Runway image tools
- Magnific for enhancement / detail cleanup

### Role
- fixing hands / artifacts
- compositing backgrounds
- cleaning lineup sheets
- adjusting wardrobe consistency
- making presentation boards

### API needed?
- usually no
- manual UI workflow is normal

### Recommendation
For quality control, **Photoshop** is the most reliable serious tool here.

---

## D) Video generation (text-to-video / image-to-video)

### Major candidate tools
- Kling
- Runway
- Luma Dream Machine
- Pika
- Haiper
- PixVerse
- Genmo
- Hailuo / MiniMax video tools
- OpenAI Sora (if available in your access tier)
- ComfyUI video workflows (advanced / unstable depending setup)

### Role
- turning keyframes into moving shots
- performance animation
- camera movement
- establishing shots
- dialogue scene motion

### API needed?
- depends on platform
- many are UI-first, some have API or partner access
- availability changes quickly

### Strong candidate choices
For this pilot, strongest likely options are:
- **Kling** for high-end cinematic/control style results
- **Runway** for established creative tooling and polish
- **Luma** as a secondary option for motion style experimentation

### Recommendation
For an impeccable pilot, expect to test at least **2 video engines**, not just 1.

---

## E) Talking-character / lip sync / facial performance

### Candidate tools
- Hedra
- HeyGen
- Synthesia
- D-ID
- Runway performance tools
- Sync / lip-sync tools inside other platforms
- LivePortrait and related open-source tools
- AnimateDiff / ComfyUI-based workflows

### Role
- character dialogue scenes
- mouth sync
- facial animation
- performance consistency

### API needed?
- maybe
- some platforms have APIs, some are UI-first, some are open source

### Important note
For a sitcom, this category is critical.
Bad facial performance will destroy the pilot faster than weak background art.

### Recommendation
We likely need one dedicated facial/dialogue animation solution instead of hoping a generic video model handles all acting well.
Strong candidates to investigate first:
- **Hedra**
- **HeyGen**
- **D-ID**
- high-control open-source alternatives if quality is sufficient

---

## F) Voice generation

### Candidate tools
- ElevenLabs
- Cartesia
- PlayHT
- OpenAI TTS / Realtime voices
- RVC / local voice workflows
- Coqui / XTTS local options
- Fish Audio

### Role
- give each character a distinct voice
- consistent dialogue performance
- emotional line delivery
- iteration on tone and pacing

### API needed?
- often yes, if automating
- manual UI may also work for some vendors

### Strong candidate choices
- **ElevenLabs** is the most obvious serious candidate for premium voice quality
- **Cartesia** is worth evaluating if lower-latency / different voice texture matters
- local/open-source tools are backup, not likely first choice for impeccable quality

### Recommendation
For this pilot, **ElevenLabs** is the most likely anchor voice platform unless another already-proven house preference exists.

---

## G) Sound design / SFX

### Candidate tools
- Epidemic Sound
- Artlist
- Envato Elements
- Adobe Stock audio
- Soundly
- Boom Library
- Freesound (careful with consistency/licensing)
- ElevenLabs / AI SFX tools
- Runway audio tools

### Role
- café ambience
- room tone
- footsteps
- cup/plate sounds
- transitions
- comic texture

### API needed?
- usually no
- mostly manual asset sourcing / editing

### Recommendation
A simple licensed library + manual editorial use is enough here.
No complex API system needed.

---

## H) Music

### Candidate tools
- Suno
- Udio
- royalty-free library sources (Epidemic, Artlist, etc.)
- custom composer / producer

### Role
- original intro tone
- background cues
- emotional transitions
- end button support

### API needed?
- maybe, but not necessary at first

### Important rule
Do **not** assume that “AI” makes direct theme-song mimicry safe.
For a clean production plan, we should prefer:
- original-but-adjacent comfort music
- or licensed library tracks

### Recommendation
For the pilot, either:
- **custom original cue**, or
- **Suno/Udio for exploratory original cue generation**, then refine manually

---

## I) Editing / assembly

### Candidate tools
- Premiere Pro
- Final Cut Pro
- DaVinci Resolve
- CapCut
- Descript
- Runway editor

### Role
- cut scenes together
- pace dialogue
- layer music/SFX/voices
- subtitles
- final export

### API needed?
- no

### Recommendation
For serious quality:
- **Premiere Pro** or **DaVinci Resolve**
For speed/social packaging:
- CapCut as secondary utility only

---

## J) Upscaling / enhancement

### Candidate tools
- Topaz Video AI
- Topaz Gigapixel / Photo AI
- Magnific
- Runway enhancement tools
- local ESRGAN / enhancement workflows

### Role
- sharpen stills
- improve detail consistency
- upscale final shots / exports

### API needed?
- usually no

### Recommendation
Topaz + Magnific are the strongest practical enhancement candidates.

---

## K) Storage / asset management / tracking

### Candidate tools
- Google Drive
- Dropbox
- Notion database
- Airtable
- local folder structure in workspace
- Frame.io for review

### Role
- track prompt versions
- store approved canon looks
- store scene outputs
- review passes

### API needed?
- no, unless you want heavy automation

### Recommendation
For this pilot, a clean local folder structure plus one cloud review/storage layer is enough.

---

# 3) WHAT ACTUALLY NEEDS API ACCESS?

## Likely true API-needed categories
If we want automation or repeatability, these are the categories where API access matters most:

1. **still-image generation**
2. **video generation**
3. **voice generation**
4. optionally **music generation**

## Categories where manual/UI use is fine
- editing
- compositing
- sound effects sourcing
- prompt review
- drift review
- final cut assembly

## Important strategic rule
Do **not** chase API access for platforms that are better used manually.
A clean hybrid workflow is better than “API for everything.”

---

# 4) LEAN STACK VS IMPECCABLE STACK

## A) Lean fastest-path stack
If the goal is speed with respectable quality:

- writing/planning: workspace docs + ChatGPT/Claude
- still generation: Midjourney or Flux API
- video generation: Kling or Runway
- voice: ElevenLabs
- music: Udio/Suno or licensed library
- editing: Premiere / CapCut / Resolve
- enhancement: Topaz or Magnific

This is enough to make a pilot.

## B) Impeccable pilot stack
If the goal is highest quality with serious iteration:

### Core recommended stack
- **Writing / planning:** workspace docs + manual script iteration
- **Still image / character lock:** Midjourney + Flux API workflow
- **Controlled image refinement / cleanup:** Photoshop + Magnific
- **Video generation:** Kling + Runway
- **Talking-character / facial performance:** Hedra or HeyGen (to be tested)
- **Voice generation:** ElevenLabs
- **Music:** original cue exploration via Suno/Udio + manual selection or custom cue
- **SFX / ambience:** licensed library + manual edit
- **Editing / final assembly:** Premiere Pro or DaVinci Resolve
- **Enhancement:** Topaz Video AI / Magnific where needed

This is the strongest current conceptual stack.

---

# 5) RECOMMENDED STACK FOR THIS PROJECT RIGHT NOW

## Best current recommendation
If we are serious about an impeccable pilot, I recommend this stack path:

### Visual development
- **Midjourney** for initial vibe exploration
- **Flux API path** (Replicate or Fal) for controllable identity-lock generation

### Video / shot generation
- **Kling** as primary cinematic motion engine
- **Runway** as secondary / polish / alternative motion engine

### Character dialogue performance
- **Hedra or HeyGen** test pass
- whichever gives the best believable facial/dialogue performance for anthropomorphic characters

### Voices
- **ElevenLabs**

### Music
- **Suno or Udio** for original exploratory cues
- possibly replace with a more polished original cue later

### Cleanup / compositing
- **Photoshop**
- **Magnific**

### Editing
- **Premiere Pro** or **DaVinci Resolve**

### Enhancement
- **Topaz Video AI**

---

# 6) ACCESS CHECKLIST

Use this to track what actually needs to be acquired/verified.

## Still-image generation access
- [ ] Midjourney account access
- [ ] Flux API access via Replicate / Fal / alternative

## Video generation access
- [ ] Kling access
- [ ] Runway access
- [ ] optional Luma / secondary engine access

## Facial/dialogue animation access
- [ ] Hedra access
- [ ] HeyGen access
- [ ] optional D-ID / alternate access

## Voice access
- [ ] ElevenLabs access
- [ ] optional secondary voice tool access

## Music access
- [ ] Suno or Udio access
- [ ] or licensed library account

## Editing / enhancement access
- [ ] Photoshop
- [ ] Premiere or Resolve
- [ ] Topaz
- [ ] Magnific (optional but recommended)

---

# 7) WHAT WE SHOULD DO BEFORE TRYING TO GET EVERYTHING

Before rushing to obtain every API key or subscription, we should:

1. lock the actual recommended stack
2. mark each tool as:
   - essential
   - useful
   - optional
3. identify which platforms are UI-only vs API-worthwhile
4. only then start gathering access intentionally

Because otherwise we risk buying or wiring too many overlapping tools.

---

# 8) ESSENTIAL / USEFUL / OPTIONAL

## Essential
- one strong still generator
- one strong backup still generator or controlled image path
- one strong video generator
- one strong voice generator
- one serious editor

## Useful
- second video generator
- image cleanup/enhancement tool
- music generator
- facial animation specialist

## Optional
- extra concept-art tools
- multiple extra editing tools
- excessive automation before the look is locked

---

# 9) IMMEDIATE RECOMMENDATION

## Next best move from this doc
Now that the production stack map exists, the clean next step is:

1. convert this into a **tool decision matrix**
2. choose the actual stack
3. create an **API / access tracker**
4. only then begin access acquisition and generation work

That is better than trying to get access to everything blindly.

---

# 10) RECOMMENDED NEXT DOCS

Best next documents after this:
1. `TOOL_DECISION_MATRIX.md`
2. `API_ACCESS_TRACKER.md`
3. `IDENTITY_LOCK_RUNBOOK.md`

That will turn this from a list into an executable production plan.
