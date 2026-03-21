# STATUS.md

## Overall status
Strong working local build.

## Product status
Working:
- scan flow
- mobile web flow over LAN
- local backend analysis
- battle mode
- history/progress
- share flow
- improved caution/rejection messaging

## Visual/UI status
Working and recently polished:
- home hero image
- home hero copy
- upload placeholder copy
- loading screen treatment
- battle screen copy
- removal of visible Clavicular wording

## Engine status
Current stack:
- OpenCV preprocessing
- InsightFace detection
- MediaPipe landmarks
- local calibration logic

Recent engine improvements:
- LAN backend exposure
- landmark fallback path
- EXIF-aware image handling
- significant-face filtering
- tighter confidence gating
- smarter photo-quality suppression

## Recovery safety status
Good locally because:
- project lives in files
- changes are committed in git
- handoff/recovery docs now exist

Still recommended for maximum safety:
- push to a private remote git repo

## Current risk
Main risk is not total project loss from chat reset.
Main risk is future confusion if changes continue without a clear milestone and remote backup.
