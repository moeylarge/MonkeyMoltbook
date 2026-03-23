# STATUS.md

Updated: 2026-03-23 America/Los_Angeles

## Summary
LooksMaxx (formerly FACEMAXX / LooksMaxxing in older notes) is the strongest-preserved project in the workspace and is currently in a strong local-build state. The app is no longer just a mock flow: it now has a working local analysis backend, real image-driven scan behavior, battle mode with second-image analysis, and a much more product-like UI surface.

## Working now
- desktop web app flow
- mobile web app flow over LAN
- photo library upload
- direct in-app camera capture / camera handoff
- live scan flow
- clearer caution / rejection reasons
- battle mode with real second-photo analysis
- history / progress behavior
- share flow copy and premium-style polish
- backend-connected scan flow with fallback behavior if backend is unavailable

## Backend state
- local analysis backend lives in `analysis-backend/`
- stack:
  - OpenCV
  - InsightFace
  - MediaPipe
  - local LooksMaxx calibration layer
- host health check: `http://127.0.0.1:8089/health`
- app prefers backend analysis for scans and battle analysis
- `/analyze` has been verified end-to-end on a real face test image

## Recent completed work
- restored `facemaxx-mobile/` into the active workspace
- added image picker / upload flow and persisted scan history
- upgraded score logic toward image-derived local analysis instead of simple mock/hash behavior
- added direct in-app camera capture
- upgraded battle mode to support a real second uploaded image
- deepened mapping from backend quality/measurement signals into visible UI explanations and stored measurement data
- exposed richer backend measurements in the UI via a measurement panel / geometry readout
- pushed archetype/recommendation logic toward more measurement-driven behavior
- tightened copy, spacing, labels, and general product framing
- settled brand direction around **LooksMaxx**

## Product / business direction
- launch strategy changed: LooksMaxx should go out as a **free product first** for **2–4 weeks** or until roughly **1000 users**
- immediate goal is learning/traction/feedback, not squeezing monetization too early
- App Store listing block and screenshot order were already defined for submission
- do not switch to a hosted third-party looks-analysis API right now
- use the app like a real product for a while and log repeated friction before over-polishing blindly
- launch rule: no new feature ideas, no random redesigns, only fix real launch blockers, then submit

## In progress
- continued visual review and polish
- continued refinement of backend-to-UI mapping
- preparing for first real labeled sample collection / merge flow

## Next steps
1. Run a fresh visual/product review using `REVIEW_CHECKLIST.md`
2. Tighten any weak copy, labels, or UX friction revealed by that review
3. Continue backend/app refinement so more measurement-driven behavior feels trustworthy and less hand-tuned
4. Start collecting the first batch of real labeled/exported samples when ready

## Risks / issues to watch
- scoring inconsistency across similar photos
- battle mode weirdness or mismatch in reasoning quality
- weak or developer-ish labels leaking into user-facing UI
- trust issues when backend quality is low or rejection/caution logic feels arbitrary

## Validation checklist
- frontend web flow verified previously
- mobile/LAN flow verified previously
- backend health check passes
- `/analyze` end-to-end verified previously
- still worth doing another deliberate visual review pass before major launch moves

## 2026-03-23 launch submission update
- LooksMaxx is no longer only in launch-prep mode; the iOS app was built, uploaded, and submitted to Apple.
- Current App Store Connect state: **Waiting for Review**.
- The major native build blocker during submission was `expo-face-detector`; it was removed to unblock the EAS iOS build.
- Public App Store metadata URLs are currently served from:
  - `https://looksmaxx-site.vercel.app`
  - `https://looksmaxx-site.vercel.app/privacy`
  - `https://looksmaxx-site.vercel.app/support`
- Draft submission screenshots were generated locally and saved under:
  - `screenshots-draft/`
  - `screenshots-appstore-1284x2778/`
  - `screenshots-appstore-ipad-2064x2752/`
- Immediate next step is no longer launch prep; it is monitoring Apple review and responding only if Apple requests changes.
