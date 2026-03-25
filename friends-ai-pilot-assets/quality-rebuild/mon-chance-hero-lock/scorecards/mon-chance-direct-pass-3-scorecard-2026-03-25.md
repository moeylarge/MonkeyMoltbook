# Mon + Chance Candidate Scorecard — Direct Pass 3

## Candidate
- id: mon-chance-direct-pass-3
- model: fal-ai/nano-banana-pro/edit
- mode: still
- source seed/reference: `fal-input/04-mon-chance-upload-ref-close.jpg` bound as the **only** `image_urls` item via direct API call using a local data URI
- prompt: `hero-still-prompt-v5-anti-homage.md`
- date: 2026-03-25 14:49 PDT
- saved output: `outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-3.png`
- request metadata: `outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-3.json`

## Binding integrity gate
- direct API path used instead of browser playground: pass
- approved close reference was the only bound source image: pass
- deterministic request payload saved locally for audit: pass

## Still gate
- composition clear medium two-shot: pass
- Mon readability: controlled / guarded / affected: pass
- Chance readability: amused / provocative / relaxed: pass
- emotional tension legible without dialogue: near miss
- premium finish quality: pass
- no mascot/cartoon softness drift: near miss
- no anatomy/background corruption: pass
- Central Peak world fit: fail

## Episode-fit gate
- can carry Chance line: near miss
- can carry Mon response: near miss
- strong enough to become style anchor: fail

## Final decision
- REJECT

## Exact reason
This is the strongest direct pass so far on Mon’s face and overall finish, but it still fails on a hard continuity trigger: the background window preserves a clearly readable **`CENTRAL PERK`-style homage sign**, only mirrored, which still breaks Central Peak continuity. Because the anti-homage environment rule is a hard gate and the pair tension is still only near-miss rather than benchmark-locked, this candidate cannot honestly pass.

## Notes
Useful signal from this pass:
- the v5 prompt successfully pushed Mon away from cute softness toward a tighter, more guarded narrow-eyed read
- Chance remained stable and the pair geometry stayed trustworthy
- the main bottleneck is now even clearer: the bound source image itself carries too much sign memory, so prompt-only suppression is not enough to stop homage text drift
- next best move is to prepare or crop a same-geometry source reference that removes the window sign region before any further direct pass
