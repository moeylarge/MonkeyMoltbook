# COMPONENT_SYSTEM.md

## Purpose
Define the concrete reusable UI building blocks for MVP implementation.

## Core components

### 1. AppShell
Shared safe-area wrapper, background, and padding logic.

### 2. ScreenHeader
- back action (optional)
- title
- subtitle (optional)
- right-side action slot (optional)

### 3. PrimaryButton
- full width
- gradient background
- loading state
- disabled state

### 4. SecondaryButton
- bordered/tinted dark surface

### 5. InsightCard
Reusable card for strengths, weaknesses, action blocks, premium teaser.

### 6. PhotoTile
- image preview
- rank badge (optional)
- remove icon
- selected/primary state
- weak-photo state

### 7. UploadDropzone
- empty state icon
- upload CTA
- accepted-count helper text

### 8. ScoreHero
- large score
- label
- confidence pill
- summary sentence

### 9. LeadPhotoCard
- large hero image
- why-it-wins copy
- recommendation badge

### 10. RankedPhotoList
- list of PhotoTile rows/cards
- strongest and weakest visual emphasis

### 11. TraitList
- icon + short sentence rows
- used for strengths and weaknesses

### 12. ActionPlanList
- numbered or bullet recommendations
- concise imperative copy

### 13. PremiumTeaserCard
- premium value bullets
- CTA button

### 14. AnalysisStatus
- loading animation zone
- rotating analysis text

### 15. SessionCard
- saved analysis preview with score/date/thumbnail

### 16. EmptyStateCard
Used for no saved sessions, no uploads, or failure-recovery states.

## Component rules
- all components must work in dark theme first
- avoid visual drift between screens
- cards carry hierarchy; text should stay concise
- button language must stay direct and outcome-focused
- components should be implementation-light and composable

## Copy rules inside components
- confident
- modern
- direct
- credible
- no fake scientific claims
- no cheesy dating-app slang overload
