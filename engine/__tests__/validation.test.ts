import { isValidPlay, isValidCombo } from '../validation';
import { Card, GameState, Player } from '../types';
// canWinNextTurn tested in on-cards.test.ts

function makePlayer(id: string, hand: Card[]): Player {
  return { id, hand, isHuman: false };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
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
    ...overrides,
  };
}

// ─── isValidPlay ────────────────────────────────────────────────────────────

describe('isValidPlay — basic matching', () => {
  it('allows matching suit', () => {
    const state = makeState({ discard: [{ rank: '5', suit: 'hearts' }] });
    expect(isValidPlay({ rank: '7', suit: 'hearts' }, state)).toBe(true);
  });

  it('allows matching rank', () => {
    const state = makeState({ discard: [{ rank: '5', suit: 'hearts' }] });
    expect(isValidPlay({ rank: '5', suit: 'spades' }, state)).toBe(true);
  });

  it('rejects non-matching suit and rank', () => {
    const state = makeState({ discard: [{ rank: '5', suit: 'hearts' }] });
    expect(isValidPlay({ rank: '7', suit: 'clubs' }, state)).toBe(false);
  });

  it('respects activeSuit set by Ace', () => {
    const state = makeState({
      discard: [{ rank: 'A', suit: 'hearts' }],
      activeSuit: 'spades',
    });
    expect(isValidPlay({ rank: '3', suit: 'spades' }, state)).toBe(true);
    expect(isValidPlay({ rank: '3', suit: 'hearts' }, state)).toBe(false);
  });
});

describe('isValidPlay — Ace always valid in normal turn', () => {
  it('Ace of Spades on top of 9 of Diamonds with no penalty is valid', () => {
    const state = makeState({ discard: [{ rank: '9', suit: 'diamonds' }] });
    expect(isValidPlay({ rank: 'A', suit: 'spades' }, state)).toBe(true);
  });

  it('Ace of Spades is blocked when 2-stack penalty is active', () => {
    const state = makeState({
      discard: [{ rank: '9', suit: 'diamonds' }],
      pendingPickupType: '2',
      pendingPickup: 2,
    });
    expect(isValidPlay({ rank: 'A', suit: 'spades' }, state)).toBe(false);
  });

  it('Ace of Spades is blocked when jack penalty is active', () => {
    const state = makeState({
      discard: [{ rank: '9', suit: 'diamonds' }],
      pendingPickupType: 'jack',
      pendingPickup: 7,
    });
    expect(isValidPlay({ rank: 'A', suit: 'spades' }, state)).toBe(false);
  });
});

describe('isValidPlay — pending pickup (2-stack)', () => {
  it('only allows a 2 when pendingPickupType is "2"', () => {
    const state = makeState({ pendingPickupType: '2', pendingPickup: 2 });
    expect(isValidPlay({ rank: '2', suit: 'clubs' }, state)).toBe(true);
    expect(isValidPlay({ rank: '5', suit: 'hearts' }, state)).toBe(false);
  });
});

describe('isValidPlay — pending pickup (black Jack)', () => {
  it('only allows black Jack or red Jack when pendingPickupType is "jack"', () => {
    const state = makeState({ pendingPickupType: 'jack', pendingPickup: 7 });
    expect(isValidPlay({ rank: 'J', suit: 'spades' }, state)).toBe(true);  // black Jack
    expect(isValidPlay({ rank: 'J', suit: 'clubs' }, state)).toBe(true);   // black Jack
    expect(isValidPlay({ rank: 'J', suit: 'hearts' }, state)).toBe(true);  // red Jack counter
    expect(isValidPlay({ rank: 'J', suit: 'diamonds' }, state)).toBe(true); // red Jack counter
    expect(isValidPlay({ rank: '5', suit: 'hearts' }, state)).toBe(false);
  });
});

describe('isValidPlay — skipsRemaining', () => {
  it('only allows 8 when skipsRemaining > 0', () => {
    const state = makeState({ skipsRemaining: 1 });
    expect(isValidPlay({ rank: '8', suit: 'hearts' }, state)).toBe(true);
    expect(isValidPlay({ rank: '5', suit: 'hearts' }, state)).toBe(false);
  });
});

describe('isValidPlay — Queen cover requirement', () => {
  it('allows Queen when player has same-suit non-Queen cover card', () => {
    const hand: Card[] = [
      { rank: 'Q', suit: 'hearts' },
      { rank: '5', suit: 'hearts' },
    ];
    const state = makeState({
      discard: [{ rank: '3', suit: 'hearts' }],
      players: [makePlayer('p1', hand)],
    });
    expect(isValidPlay({ rank: 'Q', suit: 'hearts' }, state)).toBe(true);
  });

  it('rejects Queen when player has no same-suit cover card (Edge Case 3)', () => {
    const hand: Card[] = [
      { rank: 'Q', suit: 'hearts' },
      { rank: '5', suit: 'spades' }, // different suit
    ];
    const state = makeState({
      discard: [{ rank: '3', suit: 'hearts' }],
      players: [makePlayer('p1', hand)],
    });
    expect(isValidPlay({ rank: 'Q', suit: 'hearts' }, state)).toBe(false);
  });

  it('rejects Queen when only other same-suit card is another Queen', () => {
    const hand: Card[] = [
      { rank: 'Q', suit: 'hearts' },
      { rank: 'Q', suit: 'hearts' }, // same suit but also a Queen
    ];
    const state = makeState({
      discard: [{ rank: '3', suit: 'hearts' }],
      players: [makePlayer('p1', hand)],
    });
    // The second Queen is also a Queen, so it's excluded by the "c.rank !== 'Q'" check
    expect(isValidPlay({ rank: 'Q', suit: 'hearts' }, state)).toBe(false);
  });
});

// ─── isValidCombo ────────────────────────────────────────────────────────────

describe('isValidCombo — single card', () => {
  it('delegates to isValidPlay for single card', () => {
    const state = makeState({ discard: [{ rank: '5', suit: 'hearts' }] });
    expect(isValidCombo([{ rank: '5', suit: 'clubs' }], state)).toBe(true);
    expect(isValidCombo([{ rank: '7', suit: 'clubs' }], state)).toBe(false);
  });
});

describe('isValidCombo — ascending run', () => {
  it('validates 3♦ 4♦ (ascending same suit)', () => {
    const state = makeState({ discard: [{ rank: '3', suit: 'hearts' }] });
    const combo: Card[] = [
      { rank: '3', suit: 'diamonds' },
      { rank: '4', suit: 'diamonds' },
    ];
    expect(isValidCombo(combo, state)).toBe(true);
  });

  it('validates 3♦ 4♦ 4♠ 5♠ (ascending with suit change via matching rank)', () => {
    const state = makeState({ discard: [{ rank: '3', suit: 'hearts' }] });
    const combo: Card[] = [
      { rank: '3', suit: 'diamonds' },
      { rank: '4', suit: 'diamonds' },
      { rank: '4', suit: 'spades' },
      { rank: '5', suit: 'spades' },
    ];
    expect(isValidCombo(combo, state)).toBe(true);
  });

  it('rejects direction change (asc then desc)', () => {
    const state = makeState({ discard: [{ rank: '5', suit: 'hearts' }] });
    const combo: Card[] = [
      { rank: '5', suit: 'hearts' },
      { rank: '6', suit: 'hearts' },
      { rank: '5', suit: 'hearts' }, // back down — invalid direction change
    ];
    expect(isValidCombo(combo, state)).toBe(false);
  });
});

describe('isValidCombo — descending run', () => {
  it('validates 9♣ 8♣ 7♣ 7♥ 6♥', () => {
    const state = makeState({ discard: [{ rank: '9', suit: 'clubs' }] });
    const combo: Card[] = [
      { rank: '9', suit: 'clubs' },
      { rank: '8', suit: 'clubs' },
      { rank: '7', suit: 'clubs' },
      { rank: '7', suit: 'hearts' },
      { rank: '6', suit: 'hearts' },
    ];
    expect(isValidCombo(combo, state)).toBe(true);
  });
});

describe('isValidCombo — Queen mid-combo', () => {
  it('validates Q♥ 3♥ 4♥ 4♠ (cover restarts combo)', () => {
    const hand: Card[] = [
      { rank: 'Q', suit: 'hearts' },
      { rank: '3', suit: 'hearts' },
      { rank: '4', suit: 'hearts' },
      { rank: '4', suit: 'spades' },
    ];
    const state = makeState({
      discard: [{ rank: 'Q', suit: 'clubs' }],
      players: [makePlayer('p1', hand)],
    });
    const combo: Card[] = [
      { rank: 'Q', suit: 'hearts' },
      { rank: '3', suit: 'hearts' },
      { rank: '4', suit: 'hearts' },
      { rank: '4', suit: 'spades' },
    ];
    expect(isValidCombo(combo, state)).toBe(true);
  });

  it('rejects combo ending on uncovered Queen', () => {
    const hand: Card[] = [
      { rank: 'Q', suit: 'hearts' },
      { rank: '3', suit: 'spades' },
    ];
    const state = makeState({
      discard: [{ rank: '3', suit: 'hearts' }],
      players: [makePlayer('p1', hand)],
    });
    // Queen played but no cover follows
    expect(isValidCombo([{ rank: 'Q', suit: 'hearts' }], state)).toBe(false);
  });

  // Edge Case 12: Q♥ → 2♥ (power card as cover)
  it('validates Q♥ 2♥ combo — 2♥ is valid cover for hearts Queen', () => {
    const hand: Card[] = [
      { rank: 'Q', suit: 'hearts' },
      { rank: '2', suit: 'hearts' },
    ];
    const state = makeState({
      discard: [{ rank: '3', suit: 'hearts' }],
      players: [makePlayer('p1', hand)],
    });
    const combo: Card[] = [
      { rank: 'Q', suit: 'hearts' },
      { rank: '2', suit: 'hearts' },
    ];
    expect(isValidCombo(combo, state)).toBe(true);
  });
});
