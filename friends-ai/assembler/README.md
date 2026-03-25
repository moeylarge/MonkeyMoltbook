# Friends AI Assembler v1

Automated episode builder for `Friends AI` using the current `Not a Couple` pilot as the reference format.

## What v4 does

- assembles a cut from approved stills and motion clips
- places dialogue automatically from a timeline config
- can generate synthetic temp voices with macOS `say`
- can render one voice-approval sample per character
- auto-retimes shots to spoken dialogue length
- exports sidecar subtitles automatically
- uses a neutral generated room-tone bed instead of the old system sound
- supports batch/queue builds from one config file

## Core files

- `build_episode.py` — main CLI
- `config/not-a-couple-v1.json` — episode timeline / asset / dialogue spec
- `config/voice-map-v1.json` — approved-or-pending voice map

## Commands

### 1) List available system voices

```bash
python3 friends-ai/assembler/build_episode.py list-voices
```

### 2) Render approval samples

```bash
python3 friends-ai/assembler/build_episode.py render-voice-samples \
  --episode friends-ai/assembler/config/not-a-couple-v1.json \
  --voice-map friends-ai/assembler/config/voice-map-v1.json
```

Output:
- `friends-ai/assembler/voices/approval-samples/`

### 3) Render multi-option audition packs per character

```bash
python3 friends-ai/assembler/build_episode.py render-voice-auditions \
  --episode friends-ai/assembler/config/not-a-couple-v1.json \
  --candidates friends-ai/assembler/config/voice-candidates-v2.json
```

Output:
- `friends-ai/assembler/voices/auditions-v2/`

### 4) Build the synthetic temp-voice cut

```bash
python3 friends-ai/assembler/build_episode.py build \
  --episode friends-ai/assembler/config/not-a-couple-v1.json \
  --voice-map friends-ai/assembler/config/voice-map-v2-picked.json \
  --tts \
  --auto-retime \
  --clean-ambience \
  --burn-subtitles
```

Output:
- `friends-ai/assembler/output/not-a-couple-v1-auto.mp4`
- `friends-ai/assembler/build/not-a-couple-v1-auto/not-a-couple-v1-auto.srt`

### 5) Build a queue of episodes

```bash
python3 friends-ai/assembler/build_episode.py build-batch \
  --batch friends-ai/assembler/config/batch-v1.json
```

Output:
- builds every job listed in the batch file

## Design rule

The human should only need to:
- approve voice choices
- approve assets when needed
- review exports

The agent should handle:
- timeline assembly
- TTS generation
- audio placement
- export/rebuilds

## Current limits

- still uses macOS `say` voices for temp dialogue, not a premium character-voice stack yet
- subtitle burn-in falls back to sidecar SRT on this host because the installed ffmpeg lacks the `subtitles` filter
- no episode-schema validation yet
- queue mode exists, but multi-episode libraries/configs still need to be populated

## Next upgrades

- higher-quality TTS backend after voice approval
- richer ambience presets / music routing
- stricter schema validation
- batch library growth beyond the pilot
