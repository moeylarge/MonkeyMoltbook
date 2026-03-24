# STATUS.md

## CURRENT PHASE
Launch Execution / App Store Submission Prep

## WHAT IS DONE
- Tightened real ranking/feedback calibration another step in `app/src/analysisApi.ts`
- Added stronger set-confidence derivation and top-of-set calibration logic
- Sharpened launch-facing copy and result framing across onboarding, upload, loading, and results
- Created launch artifact docs:
  - `LAUNCH_QA.md`
  - `LAUNCH_COPY_NOTES.md`
  - `SCREENSHOT_PLAN.md`
  - `LAUNCH_POLISH_SUMMARY.md`
  - `NATIVE_PROOF_BLOCKER.md`
- Captured real screenshot deliverables into `rizz-maxx/screenshots/`:
  - `01-onboarding.png`
  - `02-upload.png`
  - `03-results.png`
  - `04-saved.png`
  - `05-compare.png`
- Re-proved the main web flow after these changes
- Proved native iOS simulator launch and completed a practical native smoke test pass with user-confirmed results

## WHAT IS VERIFIED
- TypeScript compile passes (`npx tsc --noEmit`)
- Expo web export succeeds (`npx expo export --platform web`)
- Real adapter health still succeeds
- Launch-facing screenshot files now exist in the workspace
- In the app web proof flow:
  - onboarding renders
  - upload renders
  - calibrated result flow renders
  - saved history renders
  - compare flow renders
- The deeper ranking/feedback calibration pass did not break the real analysis path and still produced `REAL LOCAL ANALYSIS`
- Native iOS simulator launch is proven
- Native smoke test is now complete enough for launch confidence:
  - onboarding passed
  - upload passed
  - analysis passed
  - results passed
  - saved reopen passed
  - compare passed
  - premium screen/unlock state worked, while real purchase action remains intentionally unimplemented

## WHAT IS UNVERIFIED
- Android runtime is still unverified
- Real native device-library image picking is still only as proven as the simulator run and has not been validated on a physical device
- Persistence is still local-first only; no shared backend/account sync exists yet
- Real ranking/feedback quality is improved but still heuristic, not calibrated against real dating outcome data
- Real payment processing / store integration is not implemented
- Full native-device visual QA on physical hardware is not complete

## CURRENT BLOCKER
No hard blocker. The free-first launch candidate is much stronger now. The main remaining gaps are deeper calibration, physical-device validation, and real billing/provider integration later.

## NEXT EXACT STEP
Best next moves are:
1. deeper ranking/feedback calibration from real-world testing data
2. physical-device native proof/QA on an actual iPhone
3. final launch asset refinement if needed
the LLC today
- We are waiting for the articles of incorporation to open the bank account
- Current locked price points are:
  - `$9.99`
  - `$29.99`
- John also confirmed recent proof of the app fully built in Expo

## NEXT EXACT STEP
Immediate next moves are:
1. finish the RizzMaxx checklist
2. complete the full iPhone screenshot set (7 total)
3. complete the full iPad screenshot set (7 total)
4. keep business setup moving once articles of incorporation arrive so bank account setup can follow
