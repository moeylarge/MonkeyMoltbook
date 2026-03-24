# LAUNCH_QA.md

## Scope
Focused launch-critical QA for the free-first launch window.

## Core loop
- [x] onboarding renders and CTA advances
- [x] upload screen renders
- [x] sample set can load in web proof mode
- [x] analyze action completes
- [x] result screen renders

## Result trust / emotional arc
- [x] hero result now uses sharper framing
- [x] best-photo section is explicit
- [x] weakest-photo section is explicit
- [x] action plan is clearly separated
- [x] premium preview remains visible but not blocking in free-first mode

## Empty / weak states
- [x] empty upload state renders
- [x] below-minimum-photo gating exists
- [x] invalid non-image upload rejection is handled at adapter level
- [x] no-usable-face case is handled as degraded/low-signal path

## Persistence / history
- [x] save analysis works
- [x] reopen saved analysis works
- [x] delete single saved analysis works
- [x] clear saved analyses works
- [x] compare view opens

## Premium states
- [x] locked premium preview renders
- [x] local premium unlock works
- [x] restore/reset state works in local prototype mode
- [x] unlocked premium details appear on results

## Remaining known gaps
- native runtime proof still blocked on this machine
- native device-library proof still unverified
- full App Store screenshot set not yet exported/captured as final assets
- ranking quality still needs real-world calibration beyond heuristic proof
