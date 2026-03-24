# STATUS.md

## CURRENT PHASE
Phase 9 — Premium Entitlement State

## WHAT IS DONE
- Added a structured local premium entitlement model in storage
- Added product selection for premium monthly vs lifetime in the premium screen
- Added local purchase-state handling:
  - unlock selected product
  - restore entitlement state
  - reset entitlement state
- Preserved honesty: this is entitlement-state prototype logic, not real billing provider integration
- Kept results gating wired to the entitlement state

## WHAT IS VERIFIED
- TypeScript compile passes (`npx tsc --noEmit`)
- Expo web export succeeds (`npx expo export --platform web`)
- Real adapter health still succeeds
- In the app web proof flow:
  - premium screen opens
  - product selection works
  - unlock works
  - restore path works against stored entitlement state
  - reset path works
  - unlocked entitlement still changes the results screen correctly
- The premium local entitlement flow is now real enough for product proof without pretending billing exists

## WHAT IS UNVERIFIED
- Native iOS/Android runtime remains unverified / environment-blocked on this machine
- Real native device-library image picking is still unproven on device/simulator
- Persistence is still local-first only; no shared backend/account sync exists yet
- Real ranking/feedback quality is still heuristic, not calibrated against real dating outcome data
- Real payment processing / subscription provider integration is not implemented
- Full native-device visual QA is not complete

## CURRENT BLOCKER
No hard blocker. Premium entitlement behavior is now implemented locally. Real store billing and purchase verification are intentionally deferred because launch strategy is free-first for the first few weeks.

## NEXT EXACT STEP
Do not treat billing as the next active phase. During the free-first launch window, focus on product quality, result quality, and launch polish. Reopen real billing/provider integration later when monetization is actually being turned on.
