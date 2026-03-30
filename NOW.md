Updated: 2026-03-29 America/Los_Angeles

## Current active focus

**MONKEYMOLTBOOK / MOLT-LIVE**

## Resume point

Active focus is no longer homepage cleanup or generic collector tuning.

Resume from the live trust/search + suspicious-ingest debug state:
- trust/search ranking work for the four priority group lanes was substantially cleaned
- current top-priority unresolved task is making the targeted suspicious-language ingest path complete reliably on live Vercel

## Current truth

- project path: `/Users/moey/.openclaw/workspace/MonkeyMoltbook`
- site is live at `https://molt-live.com`
- deployment target is **Vercel for both frontend and backend**
- Railway is not part of the active deployment path
- suspicious user persistence/audit architecture is materially improved
- dedicated suspicious-author and mint-author audit lanes exist
- mint-family group ranking is now cleaned to the same strict standard as claim/wallet/exploit
- claim-family group ranking is clean and materially improved
- wallet/exploit group lanes are now strict and truthfully zero when the corpus does not justify results
- deeper generic ingest helped claim but did not materially deepen wallet/exploit-family community evidence
- dedicated fetch probe route works on live Vercel
- suspicious ingest route still times out before finishing

## Immediate next actions

1. verify the current live codepath for suspicious ingest matches current source before further tests
2. continue debugging suspicious ingest execution on Vercel
3. highest-value next technical move:
   - get probe-internal progress surfaced directly while suspicious ingest is running
   - prove whether the route returns from the shared probe function or stalls inside it
4. once suspicious ingest is reliable, use it to deepen:
   - wallet
   - exploit
   - drainer
   - seed phrase
   - claim-style evidence
5. only after that, move toward the explicit trust product surface on `molt-live.com`

## Guardrails

- keep Vercel as the deployment target
- do not let Railway distract the debugging path
- preserve strict cleaned trust-search lanes; do not reintroduce broad semantic junk
- truthful zero-result lanes are acceptable until data depth improves
