# NOW.md

## What to do next
Primary mode:
- use LooksMaxxing like a real product
- gather real-world friction before making more big changes

## Watch list
- score stability across similar photos
- confidence/rejection behavior on weak images
- battle-mode believability
- history/progress trustworthiness
- any awkward leftover wording in live use

## Do not forget
- frontend web preview:
  - `http://localhost:8081`
  - phone: `http://192.168.4.52:8081`
- backend:
  - `./run_backend.sh`
  - LAN-enabled on port `8089`

## If something breaks
Check in this order:
1. is frontend running on `:8081`?
2. is backend health live on `127.0.0.1:8089/health`?
3. is phone using the LAN URL instead of localhost?
4. are scan requests reaching backend logs?
5. is a fallback/local path being triggered instead of backend analyze?

## Current strategic decision
Keep the current local stack:
- OpenCV
- InsightFace
- MediaPipe
- local calibration layer

Do not switch to a hosted third-party API right now.
