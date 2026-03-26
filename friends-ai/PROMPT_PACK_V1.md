# FRIENDS AI
## PROMPT PACK V1

> [!WARNING]
> **DEPRECATED / SUPERSEDED FOR LIVE PRODUCTION**
>
> This file is no longer the authoritative production prompt for Friends AI.
> It has been superseded by `friends-ai/PRODUCTION_PROMPT_AUTHORITY_V2.md`.
>
> Why it was superseded:
> - this V1 doc encourages broad prompt-pack / batch / full-episode style execution
> - the project now requires loop-safe, stage-gated production
> - production must run preproduction first, then look-lock, then stills, then motion, then editorial
> - production must stop after each stage for explicit approval unless told otherwise
>
> You may still reuse wording fragments from this file, but do **not** use it as the operating authority for current production runs.

This document turns the locked concept docs into practical generation prompts for character design, set creation, continuity control, and pilot-shot production.

Use this as the production bridge between:
- `MASTER_BIBLE.md`
- `CAST_BIBLE.md`
- `VISUAL_STYLE_GUIDE.md`
- `PILOT_SCRIPT_NOT_A_COUPLE_V2.md`
- `PRODUCTION_BEAT_SHEET_NOT_A_COUPLE.md`

---

# 1) GLOBAL MASTER STYLE PROMPT

Use this as the base style instruction across all image/video generations:

> Create a premium cozy ensemble sitcom world featuring anthropomorphic animal-coded characters in a warm, stylish, emotionally readable urban comfort setting. The tone should feel inviting, witty, nostalgic in emotion but modern in finish, with soft amber lighting, creamy neutrals, warm wood, muted green, terracotta, brushed brass, and lamp-lit intimacy. The world should feel like a beloved comfort sitcom without literally recreating any existing show sets, character identities, or copyrighted visual compositions. Prioritize warmth, chemistry, repeatable staging, readable silhouettes, and emotionally clear blocking. Avoid cartoon-kids energy, cheap furry aesthetics, hyper-saturated colors, neon social-media chaos, and uncanny inconsistency.

---

# 2) NEGATIVE / AVOIDANCE PROMPT

Use this with nearly every generation:

> Avoid exact replication of any existing sitcom set, exact lookalike copyrighted characters, soundstage-copy compositions, cheap furry fandom styling, childish cartoon proportions, exaggerated mascot design, plastic CGI surfaces, neon palette overload, horror uncanny faces, random wardrobe drift, inconsistent species features, and visually noisy meme aesthetics.

---

# 3) CHARACTER LOOK PROMPTS

These are for first-pass look development, key art, lineup generation, and identity locking.

## 3.1 Mon — Swan
> Create Mon, an elegant anthropomorphic swan woman for a premium comfort-sitcom ensemble. She should have a long graceful neck, refined posture, poised body language, controlled facial expressions, and a polished upscale presence. Her energy is elegant, organized, slightly intense, and emotionally controlled. Wardrobe should be tailored, tasteful, and refined — soft luxury, structured silhouettes, ivory, champagne, muted emerald, black accents, and clean elegant styling. She should look composed, precise, tasteful, and subtly high-strung, never sloppy or cartoonish.

## 3.2 Russ — Giraffe
> Create Russ, an anthropomorphic giraffe man with a tall awkward silhouette, gentle warm eyes, sincere expression, and lovable slightly unsure posture. He should feel thoughtful, romantic, earnest, and unintentionally funny. His wardrobe should be soft casual and approachable: muted earth tones, tan, soft blue, understated green, comfortable layers, nothing slick or too fashion-forward. He should look deeply kind, emotionally open, and slightly overthinking even when still.

## 3.3 Jojo — Golden Retriever
> Create Jojo, an anthropomorphic golden retriever man with a warm open smile, relaxed posture, approachable energy, and easy social warmth. He should feel charming, funny, impulsively friendly, and instantly lovable. Wardrobe should be casual, inviting, warm-toned, and low-pressure: honey, cream, faded blue, soft green, relaxed everyday style. He should look like the easiest person in the room to be around.

## 3.4 Chance — Fox
> Create Chance, an anthropomorphic fox man with a lean sleek silhouette, sharp expression, subtle half-smiles, and socially fluid confidence. He should feel witty, dry, observant, attractive, and emotionally evasive. Wardrobe should be understated but stylish: rust, olive, charcoal, black accents, minimal clean lines, quiet confidence. He should look composed, slightly guarded, and naturally magnetic without trying too hard.

## 3.5 Fufu — Cockatoo
> Create Fufu, an anthropomorphic cockatoo woman with strong expressive silhouette, bright emotional readability, dynamic crest/feather shape, theatrical gestures, and whimsical but grounded style. She should feel eccentric, funny, emotionally intuitive, and impossible to ignore. Wardrobe can include playful statement elements but should still fit a premium sitcom world. Use bright white base with coral, citrus, pink-red, or lively accent colors. She should feel like a joyful social disruption force, not a random cartoon.

## 3.6 Rachelle — Peacock
> Create Rachelle, an anthropomorphic peacock woman with glamorous elegance, polished posture, socially magnetic expression, and visually luxurious presence. She should feel stylish, romantic, socially aware, and emotionally perceptive beneath the glamour. Wardrobe should be fashionable, camera-friendly, flattering, and high polish: jewel blue, teal, peacock green, rich neutrals, soft gold accents. She should look like attention naturally finds her.

## 3.7 Gunty
> Create Gunty, a recurring café worker in a premium cozy sitcom world. He should feel grounded, observant, familiar, and dry. His silhouette should be simpler and more practical than the main six. Wardrobe should be café-worker appropriate: apron, grounded neutral palette, espresso, dark green, black apron, warm neutral shirt tones. He should look like he belongs to the café as much as the furniture does.

---

# 4) GROUP LINEUP PROMPT

Use this to generate a cast lineup for consistency checking:

> Create a polished ensemble lineup of six anthropomorphic sitcom characters plus one recurring café worker in a premium cozy comfort-comedy world. Include: Mon the elegant swan woman, Russ the awkward sincere giraffe man, Jojo the warm golden retriever man, Chance the sleek witty fox man, Fufu the expressive cockatoo woman, Rachelle the glamorous peacock woman, and Gunty the grounded café worker. Keep each silhouette immediately readable, each wardrobe consistent with personality, and the overall image stylish, warm, and premium rather than childish or cartoonishly furry.

---

# 5) SET / LOCATION PROMPTS

## 5.1 Central Peak
> Create Central Peak, the iconic café/lounge at the heart of a premium comfort sitcom. It should feel half coffee shop, half living room: warm, stylish, couch-centered, inviting, conversation-friendly, and lived-in. Use creamy walls, warm wood, muted green, brass accents, soft terracotta seating, chalkboard signage, practical amber lamps, layered shelves, visible coffee counter, and a signature couch zone where the friend group naturally gathers. The atmosphere should feel socially alive, emotionally safe, and instantly returnable, without directly copying any famous sitcom café set.

## 5.2 Apartment 2A — Mon + Rachelle
> Create apartment 2A, the polished emotional hub shared by Mon and Rachelle in a premium comfort sitcom. It should feel curated, elegant, aesthetically strong, soft-luxury, stylish, and aspirational but believable. Include a beautiful couch area, carefully styled table surfaces, organized shelving, tasteful greenery or flowers, refined décor, clean kitchen lines, and a sense of subtle perfectionism softened by glamour. The apartment should feel like Mon built the structure and Rachelle made it breathe.

## 5.3 Apartment 2B — Chance + Jojo
> Create apartment 2B, the relaxed comedic hub shared by Chance and Jojo in a premium comfort sitcom. It should feel warm, comfortable, lived-in, slightly messy, socially open, and naturally hangout-friendly. Include a couch that feels used, looser furniture arrangement, casual clutter, snack evidence, layered textures, warmer browns, muted navy or denim accents, lamp warmth, and a believable sense that Russ is always over. It should feel like Chance edited the space and Jojo disrupted it.

## 5.4 Hallway Between 2A and 2B
> Create the hallway between apartments 2A and 2B in a warm urban apartment building, designed as an active sitcom mini-stage. The two doors should face each other directly across the hall, with enough space for near-collisions, overheard moments, and doorway conversations. Use warm practical wall lighting, inviting neutral tones, and enough visual depth for blocking and relationship geometry. It should feel intimate and socially charged, not sterile or dingy.

---

# 6) CONTINUITY PROMPT

Use this to stabilize follow-up generations:

> Maintain strict continuity with previously established Friends AI visual canon: Central Peak is the warm social café hub; apartment 2A belongs to Mon and Rachelle and is polished and curated; apartment 2B belongs to Chance and Jojo and is warm, casual, and slightly messy; the hallway connects 2A and 2B directly across from one another. Mon remains elegant and controlled, Russ remains tall and awkwardly sincere, Jojo remains open and warm, Chance remains sleek and dry, Fufu remains highly expressive and theatrical, Rachelle remains glamorous and socially magnetic, and Gunty remains grounded and deadpan. Preserve species, face shape, posture, palette logic, wardrobe identity, and room layout across all generations.

---

# 7) CHARACTER INTERACTION PROMPTS

## 7.1 Mon + Chance
> Generate a scene of Mon and Chance in a premium cozy sitcom world, emphasizing flirt-banter, irritation with chemistry underneath, visual proximity, and dry conversational tension. Mon should feel controlled and elegant; Chance should feel relaxed, observant, and quietly amused. The scene should read romantically charged without becoming melodramatic.

## 7.2 Russ + Rachelle
> Generate a scene of Russ and Rachelle in a premium cozy sitcom world, emphasizing awkward romantic energy, sincerity versus polish, and playful social pressure. Russ should feel lovable and overthinking; Rachelle should feel amused, glamorous, and lightly encouraging. The chemistry should feel sweet rather than cynical.

## 7.3 Jojo + Fufu
> Generate a scene of Jojo and Fufu in a premium cozy sitcom world, emphasizing joyful chaos, warmth, comic acceleration, and emotionally intuitive silliness. Jojo should feel open and lovable; Fufu should feel theatrical and delightfully disruptive. The energy should be funny but still grounded in affection.

---

# 8) PILOT SHOT PROMPT TEMPLATE

Use this template for each shot in the beat sheet:

> Create shot [SHOT NUMBER] from the Friends AI pilot “Not a Couple.” Location: [LOCATION]. Framing: [FRAMING]. Action: [ACTION]. Emotional target: [EMOTION]. Keep strict continuity with all previously established character identities, wardrobe logic, room layout, lighting, and relationship geometry. Preserve premium cozy comfort-sitcom tone, warm lighting, readable blocking, and emotionally clear reactions. Dialogue context for performance: [DIALOGUE PAYLOAD].

---

# 9) HIGH-PRIORITY PILOT SHOT PROMPTS

These are the first shots I would generate before attempting the entire episode.

## 9.1 Establishing shot — Central Peak day
> Create the opening establishing shot of Central Peak for the Friends AI pilot. Wide shot. Show the warm café/lounge interior, iconic couch zone, counter, chalkboard sign area, warm wood, creamy walls, muted green accents, brass details, amber practical lighting, and a socially inviting premium comfort-sitcom atmosphere.

## 9.2 Core ensemble couch shot
> Create a medium ensemble shot in Central Peak showing Mon, Rachelle, Chance, Jojo, and Russ already occupying the main couch/table zone in their default energies before Fufu enters. Mon is composed, Rachelle polished, Chance sprawled with subtle confidence, Jojo relaxed and warm, Russ slightly awkward and not fully settled.

## 9.3 Fufu entrance shot
> Create a medium tracking shot of Fufu bursting into Central Peak with immediate expressive emotional energy, disrupting the calm social rhythm of the café while still fitting the premium cozy sitcom world.

## 9.4 Couples Night sign insert
> Create a close-up insert of a chalkboard sign inside Central Peak reading: “TONIGHT — COUPLES NIGHT — 2 FOR 1 DRINKS.” The sign should look stylish, café-authentic, and visually readable.

## 9.5 Pair seating geometry shot
> Create a visual proof shot showing the group unconsciously arranged in pair geometry at Central Peak: Mon and Chance seated too close, Russ angled toward Rachelle, Jojo and Fufu naturally shoulder-to-shoulder. The shot should make the relationship dynamics understandable even with no dialogue.

## 9.6 Apartment 2A establishing shot
> Create a wide establishing shot of apartment 2A, shared by Mon and Rachelle. The room should feel elegant, polished, curated, aspirational, soft-luxury, and emotionally intimate, with refined décor, beautiful couch area, flowers or tasteful greenery, organized shelves, and controlled warmth.

## 9.7 Apartment 2B establishing shot
> Create a wide establishing shot of apartment 2B, shared by Chance and Jojo. The room should feel warm, lived-in, relaxed, slightly messy, socially open, and casually charming, with a couch that feels used, mixed décor, snack evidence, and believable Russ hangout energy.

## 9.8 Hallway collision shot
> Create a medium-wide hallway shot showing Mon exiting apartment 2A at the exact same moment Chance exits apartment 2B, nearly colliding in the hallway. Preserve the across-the-hall geometry, warm apartment lighting, flirt-through-irritation energy, and sitcom intimacy.

## 9.9 Central Peak night seating shot
> Create a medium ensemble night shot in Central Peak during Couples Night, where the group unknowingly settles into the same three pairings: Mon beside Chance, Russ beside Rachelle, Jojo beside Fufu. The scene should feel like romantic geometry has become visually inevitable.

## 9.10 Final button close-up — Mon and Chance
> Create a final emotional button shot sequence from the pilot: first Chance delivering a dry amused line, then Mon trying not to smile. Keep the chemistry subtle, premium, and warm rather than melodramatic. This should feel like the hook into episode 2.

---

# 10) SHOT PROMPT BATCHING STRATEGY

Generate in this order:

## Batch 1 — Identity lock
- all seven character portraits / lineup
- Central Peak
- apartment 2A
- apartment 2B
- hallway

## Batch 2 — Relationship lock
- Mon + Chance
- Russ + Rachelle
- Jojo + Fufu
- Gunty in Central Peak

## Batch 3 — Pilot masters
- opening Central Peak wide
- couch ensemble
- Couples Night sign
- 2A wide
- 2B wide
- hallway wide
- Central Peak night wide

## Batch 4 — Dialogue coverage
- reaction close-ups
- two-shots
- insert shots
- button shots

## Batch 5 — Continuity cleanup
- wardrobe consistency
- lighting consistency
- seat position continuity
- prop and layout continuity
- facial identity consistency

---

# 11) EDIT / ASSEMBLY RULES

When assembling outputs into the pilot:
- prioritize chemistry over spectacle
- keep pacing brisk but breathable
- preserve reaction beats
- do not overcut
- let the pair geometry read clearly
- keep warmth stronger than sarcasm
- preserve the premium cozy tone in every transition

The audience should leave the pilot wanting:
- episode 2
- more time in Central Peak
- more Mon/Chance tension
- more Russ/Rachelle awkwardness
- more Jojo/Fufu chaos

---

# 12) NEXT CORRECT STEP AFTER THIS FILE

Once this prompt pack exists, the next move is:
1. generate the identity-lock batch
2. review visual consistency
3. tighten prompts where drift appears
4. only then start full pilot-shot generation
