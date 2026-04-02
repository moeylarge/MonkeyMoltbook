# MonkeyMoltbook — HANDOFF

Updated: 2026-04-02 America/Los_Angeles

## Current phase

**MOLT-LIVE production MoltMail cutover stabilized on real user-to-user messaging.**

The project moved through multiple sub-phases in this session:
1. DNS / Vercel / Resend / auth setup
2. broad site UI cleanup and mobile parity
3. MoltMail auth repair
4. MoltMail structural rebuild
5. MoltMail final realism pass
6. baseline freeze after acceptance

## Important durable decisions from this session

### Infra / deployment
- use **Vercel** for frontend + backend
- do **not** use Railway
- `molt-live.com` is the live production domain
- current live production source of truth is a manual **`vercel --prod`** deploy path, not Git-integrated auto-deploy from commit history
- when production behavior does not match pushed commits, verify the active Vercel deployment source/commit before debugging app logic

### Product / nav decisions
- remove `Hot 25`
- keep `Rising 25`
- `Rising 25` must not overlap `Top 100`
- `/top-submolts` should not show risk assessment boxes

### Mobile / UI direction
- mobile must visually track desktop much more closely
- no separate mobile aesthetic drift

### MoltMail product direction
- MoltMail should move away from form-era messaging
- target behavior is Instagram/iMessage-style DM product
- audit/log/delivery surfaces are poison in the primary DM flow and should stay out of the main messaging experience

## What was completed this session

### Sitewide / UI / content work
A large number of UI changes were completed and deployed, including:
- mobile parity passes
- CTA cleanup
- Topics CTA improvements
- Human Chat improvements
- removal of free/credits/wallet wording in requested surfaces
- mobile menu work
- navigation cleanup
- removal of `Go Live` topbar CTA
- removal of `Hot 25`
- `Top Submolts` risk-box removal

### Resend / email auth work
Completed:
- Vercel envs set
- Resend DNS diagnosis performed
- Resend DNS records confirmed with John in GoDaddy
- send path verified working

### MoltMail auth fix
Root cause:
- post-OTP auth/session failed across requests on Vercel

Fix completed in:
- `apps/server/src/lib/moltmail-auth.js`

What changed:
- moved to signed stateless session cookie auth
- production cookie config set correctly for app origin

Proof achieved during session:
- auth survives refresh
- authenticated session is recognized after OTP
- `/api/moltmail/bootstrap` returns `200`
- `/api/moltmail/inbox` returns `200`

### MoltMail structural rebuild work
Files heavily modified:
- `apps/web/src/App.jsx`
- `apps/web/src/styles.css`
- `apps/server/src/lib/moltmail-data.js`
- `apps/server/src/lib/moltmail-auth.js`

Core visible changes achieved:
- removed subject field
- removed old compose-first form/dashboard flow from the main DM experience
- added conversation rail
- added active chat pane
- added bottom composer
- added `New message` picker modal
- added mobile list/chat split behavior
- added mobile back navigation
- reduced topbar/footer clutter in immersive unlocked MoltMail route

## Current critical state

### MoltMail real-thread baseline is now working
As of 2026-04-02 live production testing on `molt-live.com`:
- real user search works
- sender-side real thread creation works
- sender-side message rendering works
- recipient-side thread opening works
- recipient-side message rendering works
- reply loop works in the same visible thread

### Root causes resolved in this pass
- production/preview environment confusion caused repeated false signals
- live production was being served from manual `vercel deploy` flow rather than Git-based deployment assumptions
- Supabase mail runtime tables did not exist and had to be created manually in SQL Editor
- legacy demo/file-backed MoltMail path was contaminating live behavior
- live route handling needed a hard cutover toward the Supabase-backed path
- compose-mode / selected-thread UI state caused false "New message" pane states during thread-open flows

### Immediate caution
Do not assume future `git push` alone changes `molt-live.com`.
If production is still sourced from manual Vercel deploys, deploy the current local code with `vercel --prod` and verify the production deployment source before testing.

## Latest live-data / cutover work
Production MoltMail was moved away from the legacy seeded-demo path toward real Supabase-backed messaging runtime.

Critical implementation/result notes:
- missing runtime tables were created in Supabase manually:
  - `wallets`
  - `mail_threads`
  - `mail_participants`
  - `mail_messages`
  - `mail_deliveries`
  - `credit_ledger`
- live MoltMail routes were hard-cut toward the Supabase path
- legacy demo-thread contamination was disabled for live views
- manual `vercel --prod` deployment was required to get the actual current code live

## Latest proof state
Latest proof screenshots captured:
- desktop thread:
  - `/Users/moey/.openclaw/media/browser/5b3aa7eb-ccb2-4a11-a4b3-809a982f20a7.png`
- mobile list:
  - `/Users/moey/.openclaw/media/browser/d453e880-6817-437c-8bbc-d31295844e5b.png`
- mobile chat:
  - `/Users/moey/.openclaw/media/browser/c0db3e70-3867-4913-9f36-611a963731be.png`

Latest conclusion from proof:
- MoltMail moved forward significantly
- MoltMail is **still incomplete**

## Exact remaining gaps
1. sent vs received bubble styles are not yet strongly proven enough in live screenshots
2. desktop thread still feels too sparse
3. mobile chat still feels more like a shell than a convincing production DM screen
4. active thread needs more lived-in density and visual focus
5. must re-prove:
   - populated conversation rail
   - populated active thread
   - visible sent bubble
   - visible received bubble
   - composer inside thread
   - convincing mobile list → chat flow

## Best next resume path
Now that the real DM baseline is working again, future work should be stabilization/quality only.

Priority order:
1. remove or quarantine remaining dead legacy MoltMail fallback/demo code carefully, without disturbing the live working path
2. write a short deployment/operator note for future production deploys so Git state and live Vercel state do not drift silently
3. message timestamps + grouping polish
4. keyboard/composer quality
5. presence / last active later

Do not reopen major MoltMail architecture or redesign work unless John explicitly asks.

## Current frozen baseline
MoltMail is now feature-frozen at an 80–90% baseline across three phases.
Do not add new messaging features, change architecture, or redesign the UI unless John explicitly reopens the scope.

### Locked constraints
- existing-thread sticker/attachment stays enabled
- new-thread sticker/attachment stays disabled
- text-first-send is required to start a conversation
- do not reopen new-thread sticker/attachment debugging unless John explicitly asks for a dedicated rewrite

### Phase 1 frozen at 80–90%
Implemented in code and partially/provisionally proven:
- reactions
- replies
- read receipts
Remaining/proven gaps left intentionally unfixed when phase was frozen:
- reaction remove + persistence were not fully proven
- quoted reply rendering/read-state proof remained incomplete
- Sent/Read receipt state proof remained incomplete

### Phase 2 frozen at 80–90%
Implemented and accepted as baseline:
- compact link previews
- lightweight search
- subtle presence / last active
Remaining visual proof gaps accepted when phase was frozen:
- person/name click-through proof and some presence-state proof were incomplete

### Phase 3 frozen at 80–90%
Implemented and accepted as baseline:
- voice notes
- media gallery
- typing indicator
No further expansion/polish should happen unless John explicitly asks.

### Post-phase additions frozen at 80–90%
Implemented in code and frozen without further proof chasing:
- unsend / delete for everyone
- pinned conversations / messages
- GIF picker
Deferred/unproven proof items intentionally left alone:
- unsend placeholder visual proof
- pinned conversation sorting visual proof
- GIF picker open/send/render visual proof

### Additional current state from this session
- live thread message-history surfacing bug was fixed by stopping stale selected-thread retention in client hydration
- a premium visual polish / affordance pass was attempted; one stylesheet regression broke the page and was then reverted to restore the full working MoltMail stylesheet
- a premium color-system tightening pass was then applied live after the regression fix
- first-use friction fixes were added:
  - explicit text-first onboarding cue
  - clearer disabled-state messaging for sticker/attachment
  - sharper search placeholder / first-use guidance
  - tighter status wording direction

## Paste-ready truth
MoltMail is now a broad 80–90% frozen baseline. Future work should not be new features by default. The highest-ROI next work is growth/onboarding/conversion or bug/performance/reliability fixes tied to real user friction.
