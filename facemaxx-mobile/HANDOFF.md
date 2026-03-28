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

## Session addendum — 2026-03-27 App Store resubmission with real product fixes
- Prior review history clarified:
  - `1.0.0` was submitted on 2026-03-23 and Apple requested changes.
  - an earlier `1.0.1` build from 2026-03-25 was approved, but it did **not** contain today's fixes.
- Today's real app changes were made locally and verified in Expo before rebuild:
  - moved the red primary CTA up so it is visible without scrolling on key flow pages
  - added a real capture button on the camera page
  - hardened photo upload/capture flow with fallback handling
  - added LooksMaxx App Store link to the share text flow
  - changed the icon/thumbnail direction to use the person image from the first page
  - restored the first-page hero/person image explicitly using `training/Confident portrait of a young man.png`
  - made library/camera action buttons use the same red primary style
- App Store metadata cleanup performed today:
  - created a new App Store version entry `1.0.1`
  - public display name had to be set to **LooksMax Pro** because `LooksMaxx` alone was not available in App Store Connect
  - replaced warped screenshots with corrected 1284×2778 uploads derived from fresh phone screenshots
- Build/submission path issues resolved today:
  - Expo free-tier queue/concurrency caused long stalls
  - local Xcode archive path was blocked by signing/profile confusion and was intentionally abandoned
  - Expo Starter plan was purchased so EAS could get a usable build slot
  - App Store submission failures were diagnosed precisely:
    - reused build number error on `1.0.1`
    - closed app version error on `1.0.0`
  - versioning was corrected in `app.json` to:
    - app version `1.0.1`
    - iOS build number `1.0.3`
- Important versioning commits from today:
  - `905390d` — `Bump iOS build number to 1.0.2`
  - `0591ae2` — `Bump LooksMaxx to version 1.0.1 build 1.0.3`
- Final verified App Store Connect state at end of today:
  - version: **1.0.1**
  - build: **1.0.3**
  - status: **Waiting for Review**
- Resume rule from here:
  - do **not** rebuild or change App Store metadata again unless Apple requests changes or John explicitly reopens the submission
  - next work for LooksMaxx is to wait for Apple review outcome and respond only if needed

## Session addendum — 2026-03-28 App Review privacy fix + scoring spread investigation
- Apple rejection details for `1.0.1 (1.0.3)` were reviewed in App Store Connect.
- Real rejection substance was privacy / face-data disclosure, not just a generic completeness issue.
- Response sent to App Review clarified:
  - users may upload face photos
  - photos are processed by the app's own backend
  - raw face photos are not retained after processing
  - analysis results / scan history may be stored with the account
  - deletion requests can be sent to `moeylarge@gmail.com`
- Privacy policy page was updated live at:
  - `https://looksmaxx-site.vercel.app/privacy`
- In-app face-data consent prompt was added before analysis in `App.tsx`.
- New iOS build was created and resubmitted:
  - version: `1.0.1`
  - build: `1.0.4`
  - App Store Connect state after resubmission: **Ready for Review**
- Important scoring issue discovered from real-world use:
  - multiple different people all received a score of `74` in the App Store version currently installed on phone
  - diagnosis indicates backend score compression in `analysis-backend/calibrate.py`, not a simple frontend hardcoded-value bug
- Backend scoring patch applied:
  - widened final score spread while keeping sub-scores unchanged
  - added `rawScore` to backend output for debugging
  - commit: `c4d82dc` — `Widen LooksMaxx backend score spread`
- Important caveat:
  - the phone test was run on stale App Store version `1.0.0`, so it did **not** validate the new scoring patch
  - Expo/simulator testing was attempted but was not the clean path for verifying real behavior
- Correct resume point from here:
  1. wait for Apple approval / availability of the newer app version
  2. install the newer approved build on phone
  3. retest score spread on 2–3 different faces
  4. only if the spread still looks wrong, continue calibration tuning and then decide whether another submission is needed
