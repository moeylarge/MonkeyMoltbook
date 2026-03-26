# System Overview

## System name
Owned-Source Hot Lead Generation System

## Mission
Generate hot leads from owned-source inbound assets and lawful MCA public-data prospecting assets, then convert them into buyer-ready records with proof, scoring, and reviewability.

## Required lead paths

### Path 1 — MCA Owned Inbound
MCA landing page -> form/quiz -> qualification -> scoring -> dashboard -> buyer-ready lead

### Path 2 — MCA Owned Prospecting
Public business source -> enrichment -> scoring -> dedupe -> review queue -> buyer-ready lead

### Path 3 — Debt Owned Inbound
Debt landing page -> quiz/calculator/form -> consent capture -> scoring -> dashboard -> buyer-ready lead

## Core modules
1. Page factory
2. Funnel routing layer
3. Attribution capture layer
4. Lead intake datastore
5. Scoring engine
6. Temperature engine
7. Deduplication engine
8. Review queue
9. Lead detail view
10. Dashboard
11. Export-ready buyer feed
12. Verification/logging layer

## Data split
- inbound leads table
- prospect leads table
- page catalog table
- source events table
- consent records table
- scoring snapshots table
- review actions table
- export batches table

## Required proof outputs
- where the lead came from
- what was submitted or collected
- why the lead scored the way it did
- why the lead is hot
- whether it is export-ready

## Operator goals
- generate hot leads from pages we own
- review only high-value prospects
- reject junk quickly
- export buyer-ready records cleanly
- avoid loops and unnecessary rework
