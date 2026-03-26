# Page Template System

## Objective
Provide a repeatable page factory for owned-source lead generation pages with high conversion intent and clean attribution.

## Core rule
Every page must do one job:
- attract one intent
- explain one problem
- present one offer
- drive one CTA
- feed one funnel

## Template families

### 1. Main vertical landing page
Use for:
- /merchant-cash-advance
- /debt-settlement

Sections:
- headline
- subheadline
- CTA above fold
- fit bullets
- how it works
- benefits / options
- short qualification block
- FAQ
- CTA repeat

### 2. Niche page
Use for industry-specific MCA pages.

Sections:
- niche pain headline
- niche-specific funding examples
- fit bullets
- CTA
- short qualifier
- FAQ

### 3. City/state page
Use for geo intent pages.

Sections:
- geo headline
- local credibility angle
- who it helps
- CTA
- qualifier form
- local FAQ

### 4. Qualification page
Use for “Do I qualify?” pages.

Sections:
- headline
- fit checklist
- quick qualification form
- what happens next
- CTA

### 5. Calculator page
Use for debt pressure or payment comparison tools.

Sections:
- tool headline
- calculator inputs
- instant result summary
- CTA to assessment
- form capture

### 6. Comparison / education page
Use for debt options pages.

Sections:
- topic headline
- options comparison
- when each path fits
- CTA
- FAQ

## Shared page components
- source/utm capture on load
- CTA click event
- form start event
- form submit event
- sticky CTA on mobile
- short trust block
- disclosure block where required
- related page links with conversion purpose only

## CTA rules
- one primary CTA label per page
- CTA appears above the fold
- CTA repeats after explanation and near footer
- CTA routes to the correct funnel step

## Form placement rules
- short form above the fold on highest-intent pages
- calculator first, capture second on tool pages
- no multi-screen overcomplication unless qualification quality clearly improves

## Performance rules
- readable in under 5 seconds
- no heavy visual clutter
- no generic filler copy
- no content blocks without conversion purpose

## Required page metadata stored
- page_slug
- vertical
- page_family
- target_intent
- primary_cta
- form_version
- consent_version if applicable
