# HANDOFF.md

## Project
LooksMaxxing mobile app

## Current state
LooksMaxxing is in a strong working local-build state.

What is working now:
- desktop web app flow
- mobile web app flow over LAN
- local analysis backend over LAN
- photo library upload
- phone camera capture handoff
- live scan flow
- clearer rejection / caution reasons
- battle mode with real second-photo analysis
- history/progress behavior
- share flow copy
- home hero image and loading screen polish

## Core architecture
UI/app shell:
- Expo / React Native app in `facemaxx-mobile/`

Local analysis backend:
- `facemaxx-mobile/analysis-backend/`
- stack:
  - OpenCV
  - InsightFace
  - MediaPipe
  - local LooksMaxxing calibration layer

Important note:
- this is a local/self-run engine built on third-party CV libraries
- it is **not** a hosted third-party looks-analysis API

## Important runtime URLs
Frontend web preview:
- desktop: `http://localhost:8081`
- phone on same Wi-Fi: `http://192.168.4.52:8081`

Backend:
- LAN/local: `http://192.168.4.52:8089`
- local host health check: `http://127.0.0.1:8089/health`

## How to run
### Frontend
From `facemaxx-mobile/`:
- `npm run web`

### Backend
From `facemaxx-mobile/analysis-backend/`:
- `./run_backend.sh`

Backend currently listens on:
- `0.0.0.0:8089`

## Important implementation decisions
- keep the current **local stack**
- do **not** switch to a hosted third-party analysis service right now
- improve trustworthiness through local calibration rather than outsourcing the engine
- visible "Clavicular" branding/copy was removed from user-facing UI text
- current hero image uses `training/clav.png` copied into `assets/clavicular-brand.png`

## Recovery priorities if context is lost
Read these first:
1. `HANDOFF.md`
2. `NOW.md`
3. `STATUS.md`
4. `analysis-backend/README.md`
5. `LOOKSMAXXING_V2_ROADMAP.md`

## Most important recent work completed
- mobile LAN scan flow fixed end-to-end
- backend exposed on LAN instead of localhost-only
- web/mobile backend URL routing fixed
- landmark fallback and EXIF-aware loading added
- multi-face detection made less trigger-happy via significant-face filtering
- caution/rejection reasons made clearer and more specific
- battle screen copy cleaned up
- home hero image reframed and loading screen made more premium
- local calibration tightened so weak photos suppress scores more intelligently
- scan exports were made more training-schema-ready, though dataset collection is not the immediate priority

## Current recommended next mode
Use the app as a real product for a while.

Do not over-polish blindly.
Watch for:
- real scoring inconsistency
- repeated UX friction
- battle-mode weirdness
- trust issues across similar photos

If something feels off twice, log it and then fix it.


## Session addendum — launch / monetization / brand update
- Brand direction now settled on **LooksMaxx**.
- New main logo asset: `assets/looksmaxx-logo.png` sourced from `training/Stylish _LooksMaxx_ logo design (1).png`.
- Launch strategy was later clarified: LooksMaxx should launch as a **free product first** for **2–4 weeks** or until roughly **1000 users**.
- Apple submission checklist and App Store listing block were already created and should be treated as active launch-prep documents.
- App Store naming block:
  - `LooksMaxx`
  - `LooksMaxx: Looks Rater`
  - `LooksMaxx: Looks Rating System`
- Subtitle:
  - `Looks rating, face analysis, beauty scan`
- Launch rule:
  - no new feature ideas
  - no random redesigns
  - only fix real launch blockers
  - submit
- Current one-time paid funnel still exists in-product, but near-term launch strategy is now free-first for learning/traction.
- Share page now supports native share on phone and fallback copy/share behavior on web.
- Important recent commits in this stretch: `84629d1`, `6953b92`, `d966753`, `4ee0e85`, `8cf4405`, `7b3354e`, `4158578`, `05a4ebe`, `1e1b189`, `70291d0`.

## Session addendum — 2026-03-23 App Store submission completed
- LooksMaxx iOS build succeeded through EAS after removing `expo-face-detector`, which had been breaking native iOS compilation with `EXLogError` / `EXLogWarn` build failures.
- Important build-fix commit:
  - `ec99812` — `Remove expo-face-detector to unblock iOS build`
- Additional launch-prep commits from this session:
  - `31cad88` — `Add LooksMaxx App Store web pages and submission pack`
  - `accf390` — `Add deployable LooksMaxx static site for App Store URLs`
- Live public URLs currently used in App Store Connect:
  - marketing: `https://looksmaxx-site.vercel.app`
  - privacy: `https://looksmaxx-site.vercel.app/privacy`
  - support: `https://looksmaxx-site.vercel.app/support`
- Draft screenshot folders created in project:
  - `screenshots-draft/`
  - `screenshots-appstore-1284x2778/`
  - `screenshots-appstore-ipad-2064x2752/`
- App Store Connect submission state reached successfully:
  - build uploaded
  - metadata filled
  - iPhone screenshots uploaded
  - iPad screenshots uploaded
  - App Privacy completed
  - Digital Services Act completed via non-trader / not distributing in EU path
  - submission completed
- Current App Store Connect status at end of session:
  - **Waiting for Review**
- Launch/review rule from here:
  - stop changing submission settings unless Apple asks for something specific
  - next work is only to react to Apple review outcome (approval or rejection notes)
