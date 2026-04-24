"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_1 = require("../state");
const ai_1 = require("../ai");
function makePlayer(id, hand, isHuman = false) {
    return { id, hand, isHuman };
}
function makeState(overrides = {}) {
    return {
        deck: [
            { rank: '3', suit: 'clubs' },
            { rank: '4', suit: 'clubs' },
            { rank: '5', suit: 'clubs' },
        ],
        discard: [{ rank: '5', suit: 'hearts' }],
        players: [
            makePlayer('p1', [{ rank: '7', suit: 'hearts' }]),
            makePlayer('p2', [{ rank: '8', suit: 'hearts' }]),
            makePlayer('p3', [{ rank: '9', suit: 'hearts' }]),
        ],
        currentPlayerIndex: 0,
        direction: 'clockwise',
        activeSuit: null,
        pendingPickup: 0,
        pendingPickupType: null,
        skipsRemaining: 0,
        phase: 'play',
        winnerId: null,
        timerStartedAt: null,
        timeoutStrikes: {},
        sessionScores: {},
        onCardsDeclarations: [],
        currentPlayerHasActed: false,
        placements: [],
        ...overrides,
    };
}
// ─── checkPlayerFinished ──────────────────────────────────────────────────────
describe('checkPlayerFinished — no-op if hand not empty', () => {
    it('returns same state when player still has cards', () => {
        const state = makeState();
        const result = (0, state_1.checkPlayerFinished)('p1', state);
        expect(result).toBe(state);
    });
});
describe('checkPlayerFinished — first place in 3-player game', () => {
    it('records p1 as 1st, removes from players, game continues', () => {
        const state = makeState({
            players: [
                makePlayer('p1', []),
                makePlayer('p2', [{ rank: '3', suit: 'hearts' }]),
                makePlayer('p3', [{ rank: '4', suit: 'hearts' }]),
            ],
            sessionScores: {},
        });
        const result = (0, state_1.checkPlayerFinished)('p1', state);
        expect(result.placements).toHaveLength(1);
        expect(result.placements[0]).toEqual({ playerId: 'p1', place: 1 });
        expect(result.players.find((p) => p.id === 'p1')).toBeUndefined();
        expect(result.players).toHaveLength(2);
        expect(result.phase).toBe('play');
        expect(result.winnerId).toBe('p1');
        // Session score awarded
        expect(result.sessionScores['p1']).toBe(1);
    });
});
describe('checkPlayerFinished — second player finishes (2 remain → 1 last player)', () => {
    it('awards last place to remaining player, sets game-over', () => {
        const state = makeState({
            placements: [{ playerId: 'p1', place: 1 }],
            players: [
                makePlayer('p2', []),
                makePlayer('p3', [{ rank: '4', suit: 'hearts' }]),
            ],
            sessionScores: { p1: 1 },
        });
        const result = (0, state_1.checkPlayerFinished)('p2', state);
        expect(result.placements).toHaveLength(3);
        expect(result.placements[1]).toEqual({ playerId: 'p2', place: 2 });
        expect(result.placements[2]).toEqual({ playerId: 'p3', place: 3 });
        expect(result.players).toHaveLength(0);
        expect(result.phase).toBe('game-over');
        expect(result.winnerId).toBe('p1'); // 1st place from earlier
    });
});
describe('checkPlayerFinished — last card non-power wins in 2-player game', () => {
    it('game ends immediately with winner and loser placements', () => {
        const state = makeState({
            players: [
                makePlayer('p1', []),
                makePlayer('p2', [{ rank: '3', suit: 'hearts' }]),
            ],
        });
        const result = (0, state_1.checkPlayerFinished)('p1', state);
        expect(result.phase).toBe('game-over');
        expect(result.winnerId).toBe('p1');
        expect(result.placements).toHaveLength(2);
        expect(result.placements[0]).toEqual({ playerId: 'p1', place: 1 });
        expect(result.placements[1]).toEqual({ playerId: 'p2', place: 2 });
    });
});
// ─── applyPlay triggers placement ────────────────────────────────────────────
describe('applyPlay — placement via applyPlay in 3-player game', () => {
    it('first player to empty hand gets 1st place, game continues', () => {
        const state = makeState({
            discard: [{ rank: '5', suit: 'hearts' }],
            players: [
                makePlayer('p1', [{ rank: '5', suit: 'clubs' }]),
                makePlayer('p2', [{ rank: '3', suit: 'hearts' }]),
                makePlayer('p3', [{ rank: '4', suit: 'hearts' }]),
            ],
            sessionScores: {},
        });
        const result = (0, state_1.applyPlay)([{ rank: '5', suit: 'clubs' }], null, state);
        expect(result.placements).toHaveLength(1);
        expect(result.placements[0]).toEqual({ playerId: 'p1', place: 1 });
        expect(result.players).toHaveLength(2);
        expect(result.phase).toBe('play');
        expect(result.winnerId).toBe('p1');
        expect(result.sessionScores['p1']).toBe(1);
    });
    it('last player in 2-player game triggers game-over with both placements', () => {
        const state = makeState({
            discard: [{ rank: '5', suit: 'hearts' }],
            players: [
                makePlayer('p1', [{ rank: '5', suit: 'clubs' }]),
                makePlayer('p2', [{ rank: '3', suit: 'hearts' }]),
            ],
            sessionScores: {},
        });
        const result = (0, state_1.applyPlay)([{ rank: '5', suit: 'clubs' }], null, state);
        expect(result.phase).toBe('game-over');
        expect(result.placements).toHaveLength(2);
        expect(result.placements[0].place).toBe(1);
        expect(result.placements[1].place).toBe(2);
        expect(result.winnerId).toBe('p1');
    });
    it('power card finish does not trigger placement — player must draw', () => {
        const state = makeState({
            discard: [{ rank: '5', suit: 'hearts' }],
            players: [
                makePlayer('p1', [{ rank: 'A', suit: 'hearts' }]),
                makePlayer('p2', [{ rank: '3', suit: 'hearts' }]),
            ],
        });
        const result = (0, state_1.applyPlay)([{ rank: 'A', suit: 'hearts' }], 'hearts', state);
        // p1 should have drawn a card, NOT been placed
        expect(result.placements).toHaveLength(0);
        expect(result.phase).not.toBe('game-over');
        const p1 = result.players.find((p) => p.id === 'p1');
        expect(p1.hand.length).toBeGreaterThan(0);
    });
});
describe('placements — currentPlayerIndex adjusts after removal', () => {
    it('currentPlayerIndex wraps to 0 when removed player was last in array', () => {
        // p3 is at index 2 (last), after removal remaining = [p1, p2], length=2
        // currentPlayerIndex was 2 → should wrap to 0
        const state = makeState({
            currentPlayerIndex: 2,
            discard: [{ rank: '5', suit: 'hearts' }],
            players: [
                makePlayer('p1', [{ rank: '3', suit: 'hearts' }]),
                makePlayer('p2', [{ rank: '4', suit: 'hearts' }]),
                makePlayer('p3', [{ rank: '5', suit: 'clubs' }]),
            ],
        });
        const result = (0, state_1.applyPlay)([{ rank: '5', suit: 'clubs' }], null, state);
        expect(result.placements[0]).toEqual({ playerId: 'p3', place: 1 });
        expect(result.currentPlayerIndex).toBe(0);
    });
    it('currentPlayerIndex unchanged when within remaining bounds', () => {
        // p1 finishes (index 0), remaining = [p2, p3], currentPlayerIndex was 0
        // 0 < 2, so stays at 0 — now pointing at p2
        const state = makeState({
            currentPlayerIndex: 0,
            discard: [{ rank: '5', suit: 'hearts' }],
            players: [
                makePlayer('p1', [{ rank: '5', suit: 'clubs' }]),
                makePlayer('p2', [{ rank: '3', suit: 'hearts' }]),
                makePlayer('p3', [{ rank: '4', suit: 'hearts' }]),
            ],
        });
        const result = (0, state_1.applyPlay)([{ rank: '5', suit: 'clubs' }], null, state);
        expect(result.currentPlayerIndex).toBe(0);
        expect(result.players[0].id).toBe('p2');
    });
    it('currentPlayerIndex shifts back when finished player was before current player', () => {
        // p1 (index 0) finishes (empty hand), current turn is p3 (index 2)
        // After removal remaining = [p2, p3], p3 is now at index 1 → should become 1
        const state = makeState({
            currentPlayerIndex: 2, // p3's turn
            discard: [{ rank: '5', suit: 'hearts' }],
            players: [
                makePlayer('p1', []), // empty hand — finished
                makePlayer('p2', [{ rank: '3', suit: 'hearts' }]),
                makePlayer('p3', [{ rank: '4', suit: 'hearts' }]),
            ],
        });
        const result = (0, state_1.checkPlayerFinished)('p1', state);
        // p3 was at index 2, p1 (index 0) was before it, so index shifts back to 1
        expect(result.currentPlayerIndex).toBe(1);
        expect(result.players[1].id).toBe('p3');
    });
});
// ─── Regression: single non-power card is always playable ────────────────────
describe('single non-power card — selectable and playable', () => {
    it('getValidPlays returns the card when hand has one non-power card matching discard rank', () => {
        const state = makeState({
            discard: [{ rank: '5', suit: 'clubs' }],
            players: [
                makePlayer('p1', [{ rank: '5', suit: 'hearts' }]),
                makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
            ],
            currentPlayerIndex: 0,
            currentPlayerHasActed: false,
        });
        const validPlays = (0, ai_1.getValidPlays)(state);
        expect(validPlays.length).toBeGreaterThan(0);
    });
    it('playing last non-power card records 1st place and continues/ends game', () => {
        const state = makeState({
            discard: [{ rank: '5', suit: 'clubs' }],
            players: [
                makePlayer('p1', [{ rank: '5', suit: 'hearts' }]),
                makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
            ],
            currentPlayerIndex: 0,
            currentPlayerHasActed: false,
        });
        const result = (0, state_1.applyPlay)([{ rank: '5', suit: 'hearts' }], null, state);
        expect(result.placements).toHaveLength(2);
        expect(result.placements[0].playerId).toBe('p1');
        expect(result.placements[0].place).toBe(1);
        expect(result.phase).toBe('game-over');
    });
    it('after another player finishes, remaining player has currentPlayerHasActed = false', () => {
        // p2 finishes (3-player game), p3 should now be active with hasActed = false
        const state = makeState({
            currentPlayerIndex: 1, // p2's turn
            discard: [{ rank: '5', suit: 'hearts' }],
            players: [
                makePlayer('p1', [{ rank: '3', suit: 'hearts' }]),
                makePlayer('p2', [{ rank: '5', suit: 'clubs' }]),
                makePlayer('p3', [{ rank: '4', suit: 'hearts' }]),
            ],
            currentPlayerHasActed: false,
        });
        const result = (0, state_1.applyPlay)([{ rank: '5', suit: 'clubs' }], null, state);
        expect(result.phase).toBe('play');
        expect(result.currentPlayerHasActed).toBe(false);
        expect(result.placements).toHaveLength(1);
    });
});
