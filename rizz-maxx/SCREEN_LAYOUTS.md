# SCREEN_LAYOUTS.md

## Purpose
Translate the design system into concrete mobile screen structure before app-shell implementation.

---

## 1. Welcome / Onboarding Screen

### Goal
Make the value obvious within seconds and drive the user into upload.

### Layout
- Top safe-area spacing
- Small brand mark / wordmark
- Hero headline
- Short supporting copy
- Visual card preview of ranked-photo/report outcome
- 3 compact value bullets
- Primary CTA: `Optimize my profile`
- Secondary trust line at bottom

### Hierarchy
1. Promise
2. Outcome preview
3. Why it matters
4. CTA

### Suggested copy direction
- Headline: `Your dating profile is only as strong as your weakest photo.`
- Support: `RIZZ MAXX ranks your photos, picks your best lead, and shows exactly what to fix.`

---

## 2. Upload Photos Screen

### Goal
Make photo selection feel premium, easy, and intentional.

### Layout
- Top nav with back + title
- Guidance copy: `Upload 4-10 photos`
- Large upload dropzone/card
- Thumbnail grid below
- Each tile supports:
  - preview
  - drag handle/reorder affordance
  - remove button
  - replace action on long press or tile actions
- Sticky bottom CTA: `Analyze my profile`

### States
- Empty
- Partially filled
- Ready to analyze
- Invalid (<4 photos)

### UX notes
- Use strong visual distinction for the primary CTA
- Show subtle count indicator: `6 of 10 added`

---

## 3. Review Set Screen

### Goal
Give user a final confidence checkpoint before analysis.

### Layout
- Header
- Summary text: `This is the set we’re scoring`
- Larger ordered photo strip/grid
- Small note explaining ranking + lead-photo recommendation
- Primary CTA: `Start analysis`
- Secondary action: `Edit photos`

### Hierarchy
1. Confirm set
2. Reinforce what user is about to get
3. Start analysis

---

## 4. Analysis Loading Screen

### Goal
Turn waiting into anticipation.

### Layout
- Dark full-screen focus state
- Animated progress ring/bar
- Rotating status lines
- Small visual pulse or stacked card animation

### Status line examples
- `Ranking your strongest first impression...`
- `Looking for your best lead photo...`
- `Flagging photos that weaken the set...`
- `Building your improvement plan...`

### Rules
- No fake technical jargon
- No exaggerated precision claims
- Keep the user emotionally engaged

---

## 5. Results Screen

### Goal
Deliver the core emotional payoff and premium desire.

### Layout order
1. Score hero section
2. Recommended lead photo card
3. Ranked photos strip/list
4. Strengths card
5. Weaknesses card
6. Action plan card
7. Replace/remove suggestions card
8. Premium unlock card
9. Save / retry actions

### 5.1 Score hero
- Large numeric score
- supporting label: `Profile strength`
- confidence pill
- short summary statement

### 5.2 Lead photo card
- large image
- label: `Best first photo`
- short why-it-wins explanation

### 5.3 Ranking block
- vertical list or horizontal cards
- top photo visually elevated
- weakest photo visually marked in red

### 5.4 Strengths card
- top 3 strengths with icons

### 5.5 Weaknesses card
- top 3 weaknesses with sharper visual treatment

### 5.6 Action plan
- 3-5 direct actions
- concise, practical, emotionally charged but credible

### 5.7 Replace/remove suggestions
- explicit `Remove these`
- explicit `Add one like this`

### 5.8 Premium unlock
- headline: unlock deeper profile strategy
- bullet summary of premium value
- clear CTA

### 5.9 Bottom actions
- `Save analysis`
- `Try again with better photos`

---

## 6. Saved Analyses Screen

### Goal
Support repeat behavior and improvement loops.

### Layout
- Header
- Card list of prior reports
- Each card shows:
  - date
  - score
  - lead photo thumbnail
  - one-line summary
- CTA for new analysis

---

## 7. Premium Unlock Screen

### Goal
Convert interest into purchase without cheapening the product.

### Layout
- Header
- Premium report visual preview
- 4-6 premium benefits
- purchase CTA
- restore purchase
- trust/legal footer

### Benefits block
- Best 6-photo order
- Per-photo breakdown
- Deeper vibe/archetype read
- Better replacement guidance
- Stronger profile strategy

---

## 8. Settings / Profile Screen

### Goal
Keep account/settings minimal and low-noise.

### Layout
- account state
- premium status
- restore purchase
- notifications/preferences (optional lightweight)
- support
- privacy / terms

---

## Global component zones
- sticky bottom CTA area
- reusable metric chips
- reusable insight cards
- reusable photo tiles
- reusable premium CTA block
