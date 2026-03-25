# FRIENDS AI
## IDENTITY LOCK BATCH

This file is the first execution batch after `PROMPT_PACK_V1.md`.

Purpose:
- lock character identity
- lock environment identity
- catch drift early
- tighten prompts before full pilot-shot generation

Do **not** attempt the full episode until this batch is reviewed.

---

# 1) MASTER INSTRUCTIONS FOR EVERY GENERATION

## Base style prompt
> Create a premium cozy ensemble sitcom world featuring anthropomorphic animal-coded characters in a warm, stylish, emotionally readable urban comfort setting. The tone should feel inviting, witty, nostalgic in emotion but modern in finish, with soft amber lighting, creamy neutrals, warm wood, muted green, terracotta, brushed brass, and lamp-lit intimacy. The world should feel like a beloved comfort sitcom without literally recreating any existing show sets, character identities, or copyrighted visual compositions. Prioritize warmth, chemistry, repeatable staging, readable silhouettes, and emotionally clear blocking. Avoid cartoon-kids energy, cheap furry aesthetics, hyper-saturated colors, neon social-media chaos, and uncanny inconsistency.

## Negative prompt
> Avoid exact replication of any existing sitcom set, exact lookalike copyrighted characters, soundstage-copy compositions, cheap furry fandom styling, childish cartoon proportions, exaggerated mascot design, plastic CGI surfaces, neon palette overload, horror uncanny faces, random wardrobe drift, inconsistent species features, and visually noisy meme aesthetics.

## Continuity prompt
> Maintain strict continuity with previously established Friends AI visual canon: Central Peak is the warm social café hub; apartment 2A belongs to Mon and Rachelle and is polished and curated; apartment 2B belongs to Chance and Jojo and is warm, casual, and slightly messy; the hallway connects 2A and 2B directly across from one another. Mon remains elegant and controlled, Russ remains tall and awkwardly sincere, Jojo remains open and warm, Chance remains sleek and dry, Fufu remains highly expressive and theatrical, Rachelle remains glamorous and socially magnetic, and Gunty remains grounded and deadpan. Preserve species, face shape, posture, palette logic, wardrobe identity, and room layout across all generations.

---

# 2) BATCH ORDER

## Stage A — Character identity lock
Generate in this exact order:
1. Mon
2. Russ
3. Jojo
4. Chance
5. Fufu
6. Rachelle
7. Gunty
8. full cast lineup

## Stage B — World identity lock
Generate in this exact order:
9. Central Peak
10. Apartment 2A
11. Apartment 2B
12. hallway between 2A and 2B

## Stage C — Drift check
Review all 12 outputs before moving on.

---

# 3) CHARACTER GENERATION PROMPTS

## 3.1 Mon — Swan
> Create Mon, an elegant anthropomorphic swan woman for a premium comfort-sitcom ensemble. She should have a long graceful neck, refined posture, poised body language, controlled facial expressions, and a polished upscale presence. Her energy is elegant, organized, slightly intense, and emotionally controlled. Wardrobe should be tailored, tasteful, and refined — soft luxury, structured silhouettes, ivory, champagne, muted emerald, black accents, and clean elegant styling. She should look composed, precise, tasteful, and subtly high-strung, never sloppy or cartoonish.

### Must-lock traits
- long elegant neck
- upright poised posture
- controlled expression
- tailored wardrobe
- ivory / champagne / muted emerald palette

### Drift to reject
- too cute
- too Disney / kids animation
- too severe and cold
- furry fandom styling
- messy or loud wardrobe

---

## 3.2 Russ — Giraffe
> Create Russ, an anthropomorphic giraffe man with a tall awkward silhouette, gentle warm eyes, sincere expression, and lovable slightly unsure posture. He should feel thoughtful, romantic, earnest, and unintentionally funny. His wardrobe should be soft casual and approachable: muted earth tones, tan, soft blue, understated green, comfortable layers, nothing slick or too fashion-forward. He should look deeply kind, emotionally open, and slightly overthinking even when still.

### Must-lock traits
- tall awkward silhouette
- gentle warm eyes
- sincere face
- soft-casual wardrobe
- emotionally open posture

### Drift to reject
- goofy caricature
- creepy intensity
- overly buff / hyper-masculine vibe
- slick stylish heartthrob look

---

## 3.3 Jojo — Golden Retriever
> Create Jojo, an anthropomorphic golden retriever man with a warm open smile, relaxed posture, approachable energy, and easy social warmth. He should feel charming, funny, impulsively friendly, and instantly lovable. Wardrobe should be casual, inviting, warm-toned, and low-pressure: honey, cream, faded blue, soft green, relaxed everyday style. He should look like the easiest person in the room to be around.

### Must-lock traits
- easy smile
- relaxed body language
- warm color logic
- instantly approachable energy

### Drift to reject
- dumb-cartoon himbo look
- hyper-athletic influencer vibe
- sloppy low-quality styling
- childish mascot design

---

## 3.4 Chance — Fox
> Create Chance, an anthropomorphic fox man with a lean sleek silhouette, sharp expression, subtle half-smiles, and socially fluid confidence. He should feel witty, dry, observant, attractive, and emotionally evasive. Wardrobe should be understated but stylish: rust, olive, charcoal, black accents, minimal clean lines, quiet confidence. He should look composed, slightly guarded, and naturally magnetic without trying too hard.

### Must-lock traits
- lean sleek silhouette
- restrained half-smile expression
- minimal stylish wardrobe
- guarded magnetism

### Drift to reject
- villain-coded fox
- smug cartoon trickster energy
- overfashioned luxury model look
- loud flashy styling

---

## 3.5 Fufu — Cockatoo
> Create Fufu, an anthropomorphic cockatoo woman with strong expressive silhouette, bright emotional readability, dynamic crest/feather shape, theatrical gestures, and whimsical but grounded style. She should feel eccentric, funny, emotionally intuitive, and impossible to ignore. Wardrobe can include playful statement elements but should still fit a premium sitcom world. Use bright white base with coral, citrus, pink-red, or lively accent colors. She should feel like a joyful social disruption force, not a random cartoon.

### Must-lock traits
- dynamic expressive silhouette
- strong crest/feather readability
- theatrical but grounded energy
- playful wardrobe with premium finish

### Drift to reject
- random chaos goblin energy
- clownish costume styling
- children’s character look
- visual noise without elegance

---

## 3.6 Rachelle — Peacock
> Create Rachelle, an anthropomorphic peacock woman with glamorous elegance, polished posture, socially magnetic expression, and visually luxurious presence. She should feel stylish, romantic, socially aware, and emotionally perceptive beneath the glamour. Wardrobe should be fashionable, camera-friendly, flattering, and high polish: jewel blue, teal, peacock green, rich neutrals, soft gold accents. She should look like attention naturally finds her.

### Must-lock traits
- glamorous elegant silhouette
- polished social expression
- jewel-toned wardrobe logic
- magnetic but not desperate energy

### Drift to reject
- shallow pageant energy only
- oversexualized styling
- loud gaudy palette
- generic fashion model with no warmth

---

## 3.7 Gunty
> Create Gunty, a recurring café worker in a premium cozy sitcom world. He should feel grounded, observant, familiar, and dry. His silhouette should be simpler and more practical than the main six. Wardrobe should be café-worker appropriate: apron, grounded neutral palette, espresso, dark green, black apron, warm neutral shirt tones. He should look like he belongs to the café as much as the furniture does.

### Must-lock traits
- grounded practical silhouette
- subtle expression
- café-worker wardrobe
- familiarity / stability

### Drift to reject
- overdesigned quirky barista gimmick
- cartoon sidekick energy
- too stylish / too glamorous
- scene-stealing look

---

## 3.8 Full cast lineup
> Create a polished ensemble lineup of six anthropomorphic sitcom characters plus one recurring café worker in a premium cozy comfort-comedy world. Include: Mon the elegant swan woman, Russ the awkward sincere giraffe man, Jojo the warm golden retriever man, Chance the sleek witty fox man, Fufu the expressive cockatoo woman, Rachelle the glamorous peacock woman, and Gunty the grounded café worker. Keep each silhouette immediately readable, each wardrobe consistent with personality, and the overall image stylish, warm, and premium rather than childish or cartoonishly furry.

### What to verify in the lineup
- silhouette separation
- palette separation
- nobody feels like the same character in a different costume
- main six feel like a cast, Gunty feels like a supporting anchor

---

# 4) WORLD GENERATION PROMPTS

## 4.1 Central Peak
> Create Central Peak, the iconic café/lounge at the heart of a premium comfort sitcom. It should feel half coffee shop, half living room: warm, stylish, couch-centered, inviting, conversation-friendly, and lived-in. Use creamy walls, warm wood, muted green, brass accents, soft terracotta seating, chalkboard signage, practical amber lamps, layered shelves, visible coffee counter, and a signature couch zone where the friend group naturally gathers. The atmosphere should feel socially alive, emotionally safe, and instantly returnable, without directly copying any famous sitcom café set.

### Must-lock traits
- iconic couch zone
- visible counter
- warm café/lounge energy
- cream / wood / muted green / brass palette
- emotionally inviting, premium cozy

### Drift to reject
- exact Central Perk copy
- trendy sterile coffee shop
- rustic farmhouse café
- dim moody indie bar

---

## 4.2 Apartment 2A — Mon + Rachelle
> Create apartment 2A, the polished emotional hub shared by Mon and Rachelle in a premium comfort sitcom. It should feel curated, elegant, aesthetically strong, soft-luxury, stylish, and aspirational but believable. Include a beautiful couch area, carefully styled table surfaces, organized shelving, tasteful greenery or flowers, refined décor, clean kitchen lines, and a sense of subtle perfectionism softened by glamour. The apartment should feel like Mon built the structure and Rachelle made it breathe.

### Must-lock traits
- polished curated beauty
- elegant couch area
- Mon structure + Rachelle glamour
- soft-luxury warmth

### Drift to reject
- empty luxury showroom
- generic influencer apartment
- overly feminine clutter chaos
- sterile minimalism

---

## 4.3 Apartment 2B — Chance + Jojo
> Create apartment 2B, the relaxed comedic hub shared by Chance and Jojo in a premium comfort sitcom. It should feel warm, comfortable, lived-in, slightly messy, socially open, and naturally hangout-friendly. Include a couch that feels used, looser furniture arrangement, casual clutter, snack evidence, layered textures, warmer browns, muted navy or denim accents, lamp warmth, and a believable sense that Russ is always over. It should feel like Chance edited the space and Jojo disrupted it.

### Must-lock traits
- warm lived-in comfort
- slightly messy but attractive
- clear Chance + Jojo blend
- believable Russ over-presence

### Drift to reject
- gross bachelor pad
- frat house energy
- empty minimalist male apartment
- ugly uninviting set

---

## 4.4 Hallway between 2A and 2B
> Create the hallway between apartments 2A and 2B in a warm urban apartment building, designed as an active sitcom mini-stage. The two doors should face each other directly across the hall, with enough space for near-collisions, overheard moments, and doorway conversations. Use warm practical wall lighting, inviting neutral tones, and enough visual depth for blocking and relationship geometry. It should feel intimate and socially charged, not sterile or dingy.

### Must-lock traits
- doors directly across from each other
- enough width for blocking
- warm apartment-building practicals
- clear mini-stage energy

### Drift to reject
- hotel corridor look
- horror hallway mood
- soulless rental hallway
- too narrow for scene work

---

# 5) DRIFT CHECKLIST

Review every output against this list.

## Character drift checklist
- species clearly correct
- silhouette clearly distinct
- face shape stable
- posture matches personality
- palette fits character
- wardrobe logic fits character
- no one looks too cartoonish
- no one looks like a direct copy of a copyrighted character

## World drift checklist
- Central Peak feels iconic and returnable
- 2A and 2B clearly feel different
- hallway clearly supports staging
- warm premium cozy tone remains intact
- nothing looks like a cheap AI visual experiment

## Ensemble drift checklist
- cast feels like one world
- no palette clashes that break tone
- no one character visually overwhelms the ensemble by accident
- Gunty reads as support, not lead

---

# 6) TIGHTENING RULES AFTER REVIEW

If drift appears:
- tighten silhouette language first
- then tighten wardrobe logic
- then tighten expression/posture
- then tighten color palette
- then regenerate only the weak asset, not the whole batch

Do not move to pilot shot generation until:
- all seven character looks feel locked
- the lineup feels coherent
- all four spaces feel canonical

---

# 7) COMPLETION CONDITION

Identity lock is complete only when:
1. Mon, Russ, Jojo, Chance, Fufu, Rachelle, and Gunty all feel individually correct
2. the lineup feels castable and premium
3. Central Peak feels iconic
4. 2A and 2B feel distinct and usable
5. the hallway works as a sitcom stage
6. there is no major furry/cartoon/cheap drift left in the batch

Once those are true, move to pilot masters.
