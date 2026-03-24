# NATIVE_PROOF_BLOCKER.md

## Current blocker
Native iOS simulator/runtime proof cannot be completed on this host.

## Verified environment facts
- `xcode-select -p` resolves to Command Line Tools only
- `xcrun --find simctl` fails
- `/Applications/Xcode.app` is not present
- `/Applications/Simulator.app` is not present
- `nodes status` reports no paired nodes/devices available through this environment

## Consequence
The app cannot be honestly proven on iOS simulator or a paired mobile device from this machine/session.

## What is needed to finish native proof
One of:
1. install full Xcode + Simulator on this machine
2. connect a paired mobile device/node to this environment
3. run the app on a different machine that has working Xcode/Simulator tooling

## Current recommendation
Do not block product work on this. Treat native proof as environment-blocked, not product-blocked.
