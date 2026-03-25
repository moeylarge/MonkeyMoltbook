# Friends AI Assembler v1

Automated episode builder for `Friends AI` using the current `Not a Couple` pilot as the reference format.

## What v1 does

- assembles a cut from approved stills and motion clips
- places dialogue automatically from a timeline config
- can generate synthetic temp voices with macOS `say`
- can render one voice-approval sample per character
- exports a finished mp4 without manual `.wav` handling

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

### 3) Build the synthetic temp-voice cut

```bash
python3 friends-ai/assembler/build_episode.py build \
  --episode friends-ai/assembler/config/not-a-couple-v1.json \
  --voice-map friends-ai/assembler/config/voice-map-v1.json \
  --tts
```

Output:
- `friends-ai/assembler/output/not-a-couple-v1-auto.mp4`

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

## Current v1 limits

- uses macOS `say` voices for temp dialogue, not a premium character-voice stack yet
- uses a simple built-in ambience layer
- no subtitle burn-in yet
- no automatic dialogue retiming based on measured line duration yet
- no episode-schema validation yet

## Next upgrades

- better ambience/music routing
- subtitle / caption export
- auto-retime shots from dialogue duration
- per-character voice comparison packs
- higher-quality TTS backend after voice approval
