# CLAUDE.md
> Claude Code reads this file automatically at the start of every session.
> Keep it updated as the project evolves.

## What this project is
A multiplayer mobile card game app built with React Native (Expo) and a Node.js + Socket.io backend.
The game uses a standard 52-card deck with power cards (A, 2, 8, J, Q, K).
Full rules are in GAME_RULES.md — read that file before writing any game logic.

## Non-negotiable rules for all code
- TypeScript everywhere. No `any` types — define proper interfaces.
- The engine/ folder must have ZERO imports from app/ or server/. It is pure logic only.
- Every function in engine/ must have a corresponding Jest test.
- All game rule decisions must match GAME_RULES.md exactly. If something is ambiguous, ask before implementing.
- Never mutate GameState directly — always return a new state object.
- Use functional, immutable patterns in the engine.

## Current build status
[x] engine/types.ts
[x] engine/deck.ts
[x] engine/validation.ts
[x] engine/effects.ts
[x] engine/state.ts
[x] engine/ai.ts
[x] engine tests passing (77/77)
[x] server scaffolded
[ ] app scaffolded
[x] local prototype working
[ ] multiplayer working

## Commands
- `npm test` — run Jest tests
- `npm run dev:server` — start the game server
- `npm run dev:app` — start the Expo app

## Key decisions already made (do not revisit without asking the user)
- Players cannot win on a power card — they must draw immediately after playing one as their last card
- Queen cover card CAN continue into a combo
- Ace can declare any suit including the current one
- 2-stack penalty: drawing ends turn, no play from drawn cards
- 8s do NOT chain between players — responding 8 resets the skip to the next player only
- King in 2-player does NOT act as a skip — direction still reverses
- Red Jack counters black Jack penalty only — no other effect when played normally

## Agent/subagent instructions
When spawning subagents, always pass:
1. The contents of GAME_RULES.md
2. The contents of engine/types.ts (once created)
3. The specific task scope — do not let subagents modify files outside their assigned scope