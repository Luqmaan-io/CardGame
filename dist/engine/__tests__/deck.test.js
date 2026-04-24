"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deck_1 = require("../deck");
function makeState(overrides = {}) {
    return {
        deck: [],
        discard: [],
        players: [],
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
describe('createDeck', () => {
    it('creates exactly 52 cards', () => {
        expect((0, deck_1.createDeck)()).toHaveLength(52);
    });
    it('has 4 suits × 13 ranks', () => {
        const deck = (0, deck_1.createDeck)();
        const suits = new Set(deck.map((c) => c.suit));
        const ranks = new Set(deck.map((c) => c.rank));
        expect(suits.size).toBe(4);
        expect(ranks.size).toBe(13);
    });
    it('has no duplicate cards', () => {
        const deck = (0, deck_1.createDeck)();
        const keys = deck.map((c) => `${c.rank}-${c.suit}`);
        expect(new Set(keys).size).toBe(52);
    });
    it('returns a new array each call', () => {
        const a = (0, deck_1.createDeck)();
        const b = (0, deck_1.createDeck)();
        expect(a).not.toBe(b);
    });
});
describe('shuffleDeck', () => {
    it('returns 52 cards', () => {
        const shuffled = (0, deck_1.shuffleDeck)((0, deck_1.createDeck)());
        expect(shuffled).toHaveLength(52);
    });
    it('does not mutate the input', () => {
        const original = (0, deck_1.createDeck)();
        const copy = [...original];
        (0, deck_1.shuffleDeck)(original);
        expect(original).toEqual(copy);
    });
    it('contains the same cards as input', () => {
        const deck = (0, deck_1.createDeck)();
        const shuffled = (0, deck_1.shuffleDeck)(deck);
        expect(shuffled.map((c) => `${c.rank}-${c.suit}`).sort()).toEqual(deck.map((c) => `${c.rank}-${c.suit}`).sort());
    });
});
describe('dealCards', () => {
    it('deals correct number of cards to each player', () => {
        const deck = (0, deck_1.createDeck)();
        const { hands, remaining } = (0, deck_1.dealCards)(deck, 4, 7);
        expect(hands).toHaveLength(4);
        hands.forEach((h) => expect(h).toHaveLength(7));
        expect(remaining).toHaveLength(52 - 28);
    });
    it('does not deal duplicate cards', () => {
        const { hands, remaining } = (0, deck_1.dealCards)((0, deck_1.createDeck)(), 4, 7);
        const allCards = [...hands.flat(), ...remaining];
        const keys = allCards.map((c) => `${c.rank}-${c.suit}`);
        expect(new Set(keys).size).toBe(52);
    });
    it('throws if not enough cards', () => {
        expect(() => (0, deck_1.dealCards)([], 4, 7)).toThrow();
    });
});
describe('reshuffleDiscard', () => {
    it('moves all but top card of discard into deck', () => {
        const discard = [
            { rank: '3', suit: 'hearts' },
            { rank: '5', suit: 'clubs' },
            { rank: 'K', suit: 'spades' },
        ];
        const state = makeState({ deck: [], discard });
        const next = (0, deck_1.reshuffleDiscard)(state);
        expect(next.discard).toHaveLength(1);
        expect(next.discard[0]).toEqual({ rank: 'K', suit: 'spades' });
        expect(next.deck).toHaveLength(2);
    });
    it('returns unchanged state when discard has 1 or fewer cards', () => {
        const state = makeState({ discard: [{ rank: '3', suit: 'hearts' }] });
        expect((0, deck_1.reshuffleDiscard)(state)).toEqual(state);
    });
});
