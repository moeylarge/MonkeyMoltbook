# HANDOFF.md

## Project
Social Clip OS

## Current state
Social Clip OS exists in the active workspace and currently has at least one concrete reusable overlay/template flow in place for Kick clips.

What currently exists:
- reusable Kick lower-third template assets under `templates/kick/`
- a Python generator for streamer-specific lower-thirds
- preview rendering workflow for visual inspection
- ffmpeg overlay instructions for compositing onto clips

What is still true:
- this project is less well-documented than LooksMaxx
- memory continuity is thinner here than the main app project
- prior notes suggest the current lower-third implementation was not yet considered fully shippable

## Focus areas
- clip branding overlays
- reusable lower-third templates
- generator-based asset production
- ffmpeg compositing flow

## How to run / verify
From `social-clip-os/templates/kick/`:

Generate a new lower-third:
- `python3 generate_kick_lower_third.py Clavicular`
- `python3 generate_kick_lower_third.py AdinRoss`
- `python3 generate_kick_lower_third.py xQc --url kick.com/xqc`

Render a PNG preview on macOS:
- `qlmanage -t -s 1600 -o preview kick-lower-third-clavicular.svg >/dev/null 2>&1`

Overlay onto a clip with ffmpeg:
- `ffmpeg -i input.mp4 -i preview/kick-lower-third-clavicular.svg.png \
  -filter_complex "[1:v]scale=1080:-1[ov];[0:v][ov]overlay=0:H-h:format=auto" \
  -c:a copy output-with-kick-branding.mp4`

## Important files
- `templates/kick/README.md`
- `templates/kick/generate_kick_lower_third.py`
- `templates/kick/kick-lower-third-clavicular.svg`
- `templates/kick/preview/`

## Current next steps
1. Generate and inspect fresh sample outputs to verify current visual quality
2. Decide whether the lower-third style is good enough to keep or should be rebuilt
3. If resumed seriously, document the broader Social Clip OS pipeline beyond the Kick template slice

## Known issues / risks
- continuity is currently thinner than UFC and LooksMaxx
- project intent is only partially captured in root memory files
- visual implementation may still not be polished enough for real use

## Recovery order
1. Read this file
2. Read `templates/kick/README.md`
3. Generate a fresh sample lower-third
4. Inspect outputs visually before making design decisions
