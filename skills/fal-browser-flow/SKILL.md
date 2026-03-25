---
name: fal-browser-flow
description: Operate FAL browser-based image and image-to-video workflows with lower-friction handoffs. Use when working in fal.ai through the browser for character generation, environment generation, image-to-video, result retrieval, upload-ready asset preparation, or motion-clip assembly—especially when the workflow mixes browser actions, local files, upload limits, and repeated model/result navigation.
---

# Fal Browser Flow

## Overview

Use this skill to keep FAL work deterministic when the browser UI is involved.

The main goal is to reduce fragile back-and-forth between:
- browser navigation
- local file prep
- upload size limits
- result retrieval
- naming/organizing outputs

Read `references/workflow.md` before doing multi-step FAL work or when the session needs a clean FAL handoff.

## Core rule

Treat FAL work as two systems:
1. **browser state** — model selection, result pages, make-video actions, downloads
2. **workspace state** — upload-ready images, motion clips, exports, manifests, renamed assets

Do not let those two states drift apart.

## Operating workflow

1. Prepare or compress local assets first.
2. Put upload-ready copies in a predictable folder.
3. Use the browser only for the generation step that truly requires it.
4. Immediately rename and organize outputs after generation.
5. Rebuild edits locally from organized files instead of relying on browser memory.

## When to use human help

Ask the user to intervene only for browser actions that are faster or more reliable by hand:
- picking the exact generated result
- dragging a local file into the browser upload surface
- confirming subjective creative choices between candidate images/videos
- fixing browser state when the wrong image/model/result page is open

Keep those requests minimal and explicit.

## Output folders

Default recommended structure inside the workspace:
- `upload-ready/` for compressed browser-upload copies
- `motion-clips/` for generated video clips
- `story-shots/` for ordered still story assets
- `exports/` for assembled cuts

## Stop rule

Once the assets are named, organized, and locally reusable, stop browser archaeology and move to local assembly.
