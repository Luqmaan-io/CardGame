"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_1 = require("../state");
function makePlayer(id, hand, isHuman = false) {
    return { id, hand, isHuman };
}
function makeCard(rank, suit) {
    return { rank, suit };
}
function makeState(overrides = {}) {
    return {
        deck: [],
        discard: [{ rank: '5', suit: 'hearts' }],
        players: [
            makePlayer('p1', [makeCard('7', 'clubs')]),
            makePlayer('p2', [makeCard('3', 'hearts')]),
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
// Generate N distinct cards
function makeCards(n, suit = 'clubs') {
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const cards = [];
    for (let i = 0; i < n; i++) {
        cards.push(makeCard(ranks[i % ranks.length], suit));
    }
    return cards;
}
// ─── Draw 14 with sufficient deck — no reshuffle needed ──────────────────────
describe('drawCard — 14 cards, sufficient deck', () => {
    it('hand increases by exactly 14', () => {
        const deck = makeCards(20, 'diamonds');
        const state = makeState({
            deck,
            pendingPickup: 14,
            pendingPickupType: 'jack',
            players: [
                makePlayer('p1', [makeCard('7', 'clubs')]),
                makePlayer('p2', [makeCard('3', 'hearts')]),
            ],
        });
        const result = (0, state_1.drawCard)(14, state);
        const p1 = result.players.find((p) => p.id === 'p1');
        expect(p1.hand).toHaveLength(15); // 1 original + 14 drawn
    });
    it('pendingPickup resets to 0', () => {
        const state = makeState({
            deck: makeCards(20, 'diamonds'),
            pendingPickup: 14,
            pendingPickupType: 'jack',
        });
        const result = (0, state_1.drawCard)(14, state);
        expect(result.pendingPickup).toBe(0);
    });
    it('pendingPickupType resets to null', () => {
        const state = makeState({
            deck: makeCards(20, 'diamonds'),
            pendingPickup: 14,
            pendingPickupType: 'jack',
        });
        const result = (0, state_1.drawCard)(14, state);
        expect(result.pendingPickupType).toBeNull();
    });
});
// ─── Draw 14 requiring mid-draw reshuffle ─────────────────────────────────────
describe('drawCard — 14 cards, mid-draw reshuffle required', () => {
    it('hand increases by exactly 14 when deck has only 6 and discard has 20', () => {
        // 6 cards in deck, 20 cards in discard (19 available after keeping top)
        const deckCards = makeCards(6, 'spades');
        const discardCards = [
            ...makeCards(19, 'hearts'),
            makeCard('K', 'diamonds'), // top of discard — stays as top, not shuffled back
        ];
        const state = makeState({
            deck: deckCards,
            discard: discardCards,
            pendingPickup: 14,
            pendingPickupType: 'jack',
            players: [
                makePlayer('p1', [makeCard('7', 'clubs')]),
                makePlayer('p2', [makeCard('3', 'hearts')]),
            ],
        });
        const result = (0, state_1.drawCard)(14, state);
        const p1 = result.players.find((p) => p.id === 'p1');
        // 1 original + 14 drawn
        expect(p1.hand).toHaveLength(15);
    });
    it('deck was reshuffled — discard is reduced to 1 card after', () => {
        const deckCards = makeCards(6, 'spades');
        const discardCards = [
            ...makeCards(19, 'hearts'),
            makeCard('K', 'diamonds'), // top card
        ];
        const state = makeState({
            deck: deckCards,
            discard: discardCards,
            pendingPickup: 14,
            pendingPickupType: 'jack',
        });
        const result = (0, state_1.drawCard)(14, state);
        // After reshuffle, discard keeps only the top card
        expect(result.discard).toHaveLength(1);
    });
    it('pendingPickup is 0 after reshuffle draw', () => {
        const state = makeState({
            deck: makeCards(6, 'spades'),
            discard: [...makeCards(19, 'hearts'), makeCard('K', 'diamonds')],
            pendingPickup: 14,
            pendingPickupType: 'jack',
        });
        const result = (0, state_1.drawCard)(14, state);
        expect(result.pendingPickup).toBe(0);
    });
    it('pendingPickupType is null after reshuffle draw', () => {
        const state = makeState({
            deck: makeCards(6, 'spades'),
            discard: [...makeCards(19, 'hearts'), makeCard('K', 'diamonds')],
            pendingPickup: 14,
            pendingPickupType: 'jack',
        });
        const result = (0, state_1.drawCard)(14, state);
        expect(result.pendingPickupType).toBeNull();
    });
});
// ─── Draw 14 when combined deck + discard have fewer than 14 ─────────────────
describe('drawCard — insufficient cards (draw whatever is available)', () => {
    it('draws all available cards and does not crash', () => {
        // Only 5 cards available total (3 in deck + discard has 3, top keeps 1, so 2 reshuffled)
        const deckCards = makeCards(3, 'spades');
        const discardCards = [makeCard('4', 'hearts'), makeCard('5', 'hearts'), makeCard('6', 'hearts')];
        const state = makeState({
            deck: deckCards,
            discard: discardCards,
            pendingPickup: 14,
            pendingPickupType: 'jack',
            players: [
                makePlayer('p1', [makeCard('7', 'clubs')]),
                makePlayer('p2', [makeCard('3', 'hearts')]),
            ],
        });
        const result = (0, state_1.drawCard)(14, state);
        const p1 = result.players.find((p) => p.id === 'p1');
        // Should have drawn whatever was available (3 deck + 2 from reshuffle = 5 at most)
        expect(p1.hand.length).toBeGreaterThan(1);
        expect(p1.hand.length).toBeLessThanOrEqual(15); // can't have more than available
        expect(result.phase).toBe('play'); // game continues
    });
    it('pendingPickup and pendingPickupType still reset even if fewer cards drawn', () => {
        const state = makeState({
            deck: makeCards(3, 'spades'),
            discard: [makeCard('4', 'hearts'), makeCard('5', 'hearts')],
            pendingPickup: 14,
            pendingPickupType: 'jack',
        });
        const result = (0, state_1.drawCard)(14, state);
        expect(result.pendingPickup).toBe(0);
        expect(result.pendingPickupType).toBeNull();
    });
});
// ─── After penalty draw: turn advance ────────────────────────────────────────
describe('drawCard + advanceTurn — penalty draw flow', () => {
    it('turn advances to next player after penalty draw', () => {
        const state = makeState({
            deck: makeCards(14, 'diamonds'),
            pendingPickup: 14,
            pendingPickupType: 'jack',
            players: [
                makePlayer('p1', [makeCard('7', 'clubs')]),
                makePlayer('p2', [makeCard('3', 'hearts')]),
            ],
            currentPlayerIndex: 0,
        });
        const drawn = (0, state_1.drawCard)(14, state);
        const advanced = (0, state_1.advanceTurn)(drawn);
        expect(advanced.currentPlayerIndex).toBe(1);
        expect(advanced.currentPlayerHasActed).toBe(false);
    });
    it('full double black jack scenario: p2 draws 14, turn passes to p1', () => {
        const deck = makeCards(20, 'diamonds');
        const state = makeState({
            deck,
            discard: [makeCard('J', 'spades')],
            pendingPickup: 14,
            pendingPickupType: 'jack',
            players: [
                makePlayer('p1', [makeCard('7', 'clubs')]),
                makePlayer('p2', makeCards(7, 'hearts')), // 7 starting cards
            ],
            currentPlayerIndex: 1, // p2's turn to take the penalty
        });
        const drawn = (0, state_1.drawCard)(14, state);
        const p2 = drawn.players.find((p) => p.id === 'p2');
        expect(p2.hand).toHaveLength(21); // 7 original + 14 drawn
        const advanced = (0, state_1.advanceTurn)(drawn);
        expect(advanced.currentPlayerIndex).toBe(0); // back to p1
        expect(advanced.pendingPickup).toBe(0);
        expect(advanced.pendingPickupType).toBeNull();
    });
});
