# FRIENDS AI
## ACCESS VERIFICATION SNAPSHOT — 2026-03-24

This file records what was actually verifiable from the current machine/session versus what still requires user/account confirmation.

Important distinction:
- **machine-verified** = detectable locally right now
- **account-verified** = requires logging into a provider account or confirming billing/API access

---

## 1) MACHINE-VERIFIED LOCAL STATE

### Available locally
- `ffmpeg` → present
- `python3` → present
- `node` → present
- `git` → present

These are helpful for:
- asset handling
- scripting
- batching
- file operations
- local conversion / assembly support

### Not detected locally as installed apps/CLIs
- Midjourney CLI → not detected
- Runway CLI → not detected
- Photoshop app → not detected in `/Applications`
- Premiere Pro app → not detected in `/Applications`
- DaVinci Resolve app → not detected in `/Applications`
- Topaz Video AI app → not detected in `/Applications`
- Discord app → not detected in `/Applications`

Important note:
- absence in this check does **not** prove the account/tool cannot be used
- it only means it was not machine-detectable in the simplest local locations/paths checked

### Environment/API presence check (presence only, not values)
Not detected in current environment:
- `REPLICATE_API_TOKEN`
- `FAL_KEY`
- `RUNWAY_API_KEY`
- `ELEVENLABS_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`

This means:
- no obvious API keys are currently exposed to this session via environment variables
- account/API access may still exist elsewhere, but it is **not verified here**

---

## 2) WHAT IS STILL UNVERIFIED / REQUIRES USER CONFIRMATION

These require account login, billing access, manual auth, or provider-specific confirmation.

### Still-image stack
- Midjourney account access
- Replicate account + billing + API token
- Fal account + billing + API key (optional fallback)

### Video stack
- Kling account access
- Runway account access
- optional Luma access

### Dialogue / facial animation
- Hedra account access
- HeyGen account access
- optional D-ID access

### Voices
- ElevenLabs account access / billing / API

### Music
- Suno account access
- Udio account access

### Editing / cleanup / enhancement
- Photoshop access
- Premiere Pro or DaVinci Resolve preference/access
- Magnific access
- Topaz Video AI access

---

## 3) CURRENT BEST VERIFIED TRUTH

### Confirmed on this machine right now
We can support:
- local scripting
- local file handling
- local ffmpeg operations
- workspace documentation / planning / prompt preparation

### Not confirmed yet
We do **not** yet have verified provider access for the actual chosen external stack:
- Midjourney
- Replicate/Fal
- Kling
- Runway
- Hedra/HeyGen
- ElevenLabs
- Suno/Udio
- Photoshop/Magnific/Topaz

So the next step is not more guessing.
The next step is explicit account/access confirmation.

---

## 4) RECOMMENDED NEXT ACTION

Go tool-by-tool through:
- `TOOL_DECISION_MATRIX.md`
- `API_ACCESS_TRACKER.md`

And mark for each tool:
- already have account
- already have billing
- already have API key
- need account setup
- need billing upgrade
- optional later

Once that is done, lock the real stack and start `IDENTITY_LOCK_RUNBOOK.md`.
