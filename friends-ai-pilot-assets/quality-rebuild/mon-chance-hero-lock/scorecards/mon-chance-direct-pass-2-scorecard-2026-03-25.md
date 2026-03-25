# Mon + Chance Candidate Scorecard — Direct Pass 2

## Candidate
- id: mon-chance-direct-pass-2
- model: fal-ai/nano-banana-pro/edit
- mode: still
- source seed/reference: `fal-input/04-mon-chance-upload-ref-close.jpg` bound as the **only** `image_urls` item via direct API call using a local data URI
- prompt: `hero-still-prompt-v4-surgical.md`
- date: 2026-03-25 14:40 PDT
- saved output: `outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-2.png`
- request metadata: `outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-2.json`

## Binding integrity gate
- direct API path used instead of browser playground: pass
- approved close reference was the only bound source image: pass
- deterministic request payload saved locally for audit: pass

## Still gate
- composition clear medium two-shot: pass
- Mon readability: controlled / guarded / affected: **near miss**
- Chance readability: amused / provocative / relaxed: pass
- emotional tension legible without dialogue: **near miss**
- premium finish quality: **near miss**
- no mascot/cartoon softness drift: fail
- no anatomy/background corruption: pass
- Central Peak world fit: fail

## Episode-fit gate
- can carry Chance line: **near miss**
- can carry Mon response: fail
- strong enough to become style anchor: fail

## Final decision
- REJECT

## Exact reason
This pass tightened Mon somewhat, but it still fails the keeper rubric for two hard reasons: **(1) scene continuity breaks because the background explicitly drifts into `Central Perk` / generic sitcom-cafe homage rather than preserved Central Peak continuity, and (2) Mon still retains enough softened mascot-cute rounding that the guarded micro-expression does not land at benchmark strength.** The pair reads cleaner than pass 1, but not honestly passable.

## Notes
Useful signal from this pass:
- direct single-image binding still behaves deterministically
- surgical prompt tightening can sharpen Mon and Chance without blowing up anatomy
- the next bottleneck is now explicit: enforce **Central Peak anti-homage / no sign drift** while pushing Mon further away from soft mascot roundness and toward tighter facial severity
