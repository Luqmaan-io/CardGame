"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ai_1 = require("../ai");
function makePlayer(id, hand) {
    return { id, hand, isHuman: false };
}
function makeState(overrides = {}) {
    return {
        deck: [],
        discard: [{ rank: '5', suit: 'hearts' }],
        players: [makePlayer('p1', [])],
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
describe('getValidPlays', () => {
    it('returns empty array when no valid plays', () => {
        const hand = [{ rank: '7', suit: 'clubs' }];
        const state = makeState({
            discard: [{ rank: '5', suit: 'hearts' }],
            players: [makePlayer('p1', hand)],
        });
        expect((0, ai_1.getValidPlays)(state)).toHaveLength(0);
    });
    it('returns valid single cards', () => {
        const hand = [
            { rank: '5', suit: 'clubs' }, // matches rank
            { rank: '7', suit: 'clubs' }, // no match
        ];
        const state = makeState({
            discard: [{ rank: '5', suit: 'hearts' }],
            players: [makePlayer('p1', hand)],
        });
        const plays = (0, ai_1.getValidPlays)(state);
        expect(plays.some((p) => p.length === 1 && p[0].rank === '5')).toBe(true);
        expect(plays.every((p) => !(p.length === 1 && p[0].rank === '7'))).toBe(true);
    });
    it('returns combos when available', () => {
        const hand = [
            { rank: '5', suit: 'hearts' },
            { rank: '6', suit: 'hearts' },
        ];
        const state = makeState({
            discard: [{ rank: '5', suit: 'clubs' }],
            players: [makePlayer('p1', hand)],
        });
        const plays = (0, ai_1.getValidPlays)(state);
        expect(plays.some((p) => p.length === 2)).toBe(true);
    });
});
describe('pickAIMove', () => {
    it('returns "draw" when no valid plays', () => {
        const hand = [{ rank: '7', suit: 'clubs' }];
        const state = makeState({
            discard: [{ rank: '5', suit: 'hearts' }],
            players: [makePlayer('p1', hand)],
        });
        expect((0, ai_1.pickAIMove)(state)).toBe('draw');
    });
    it('prefers longer combos', () => {
        const hand = [
            { rank: '5', suit: 'hearts' },
            { rank: '6', suit: 'hearts' },
        ];
        const state = makeState({
            discard: [{ rank: '5', suit: 'clubs' }],
            players: [makePlayer('p1', hand)],
        });
        const move = (0, ai_1.pickAIMove)(state);
        expect(Array.isArray(move)).toBe(true);
        expect(move.length).toBeGreaterThanOrEqual(1);
    });
    it('returns a single valid card when only one available', () => {
        const hand = [{ rank: '5', suit: 'clubs' }];
        const state = makeState({
            discard: [{ rank: '5', suit: 'hearts' }],
            players: [makePlayer('p1', hand)],
        });
        const move = (0, ai_1.pickAIMove)(state);
        expect(move).toEqual([{ rank: '5', suit: 'clubs' }]);
    });
});
