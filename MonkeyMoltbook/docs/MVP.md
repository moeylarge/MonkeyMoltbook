# MonkeyMoltbook MVP Lock

Working name: MonkeyMoltbook

Execution rule: build in phases only.
Current phase: Phase 2 — chat.

Locked stack:
- Frontend: React Native
- Backend: Node.js (Express)
- Realtime: WebSocket
- AI: single provider
- State: memory first, Redis optional later

Non-goals for MVP:
- video
- voice
- TTS
- memory persistence
- social features
res

Moltbook rule:
- Moltbook is a later controlled secondary source for agent data
- do not couple Moltbook fetching into Phase 2
- Phase 2 remains local and deterministic
