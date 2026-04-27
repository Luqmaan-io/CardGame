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
    placements: [],
    consecutiveDraws: {},
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

  it('allows Queen even when player has no same-suit cover — solo Queen penalty rule', () => {
    const hand: Card[] = [
      { rank: 'Q', suit: 'hearts' },
      { rank: '5', suit: 'spades' }, // different suit, not a Queen
    ];
    const state = makeState({
      discard: [{ rank: '3', suit: 'hearts' }],
      players: [makePlayer('p1', hand)],
    });
    // Queen is now always valid — player draws 1 penalty card instead
    expect(isValidPlay(hand[0]!, state)).toBe(true);
  });

  it('allows Queen when only other card is another Queen (stacking rule)', () => {
    const hand: Card[] = [
      { rank: 'Q', suit: 'hearts' },
      { rank: 'Q', suit: 'hearts' }, // another Queen — valid cover under stacking rules
    ];
    const state = makeState({
      discard: [{ rank: '3', suit: 'hearts' }],
      players: [makePlayer('p1', hand)],
    });
    // hand[1] is another Queen → valid cover under new stacking rule
    expect(isValidPlay(hand[0]!, state)).toBe(true);
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

  it('direction can change freely — asc then desc same suit is now valid', () => {
    const state = makeState({ discard: [{ rank: '5', suit: 'hearts' }] });
    const combo: Card[] = [
      { rank: '5', suit: 'hearts' },
      { rank: '6', suit: 'hearts' },
      { rank: '5', suit: 'hearts' }, // back down — valid under new rules (direction can change freely)
    ];
    expect(isValidCombo(combo, state)).toBe(true);
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

  it('solo Queen alone is a valid combo — penalty handled in applyPlay', () => {
    const hand: Card[] = [
      { rank: 'Q', suit: 'hearts' },
      { rank: '3', suit: 'spades' },
    ];
    const state = makeState({
      discard: [{ rank: '3', suit: 'hearts' }],
      players: [makePlayer('p1', hand)],
    });
    // Solo Queen is now valid — player draws 1 card as penalty via applyPlay
    expect(isValidCombo([{ rank: 'Q', suit: 'hearts' }], state)).toBe(true);
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

// ─── isValidCombo — Queen stacking ───────────────────────────────────────────

describe('isValidCombo — Queen stacking', () => {
  function makeQueenState(hand: Card[]): ReturnType<typeof makeState> {
    return makeState({
      discard: [{ rank: 'Q', suit: 'clubs' }], // Q♠ matches rank
      players: [makePlayer('p1', hand)],
    });
  }

  it('[Q♠, Q♥, K♥] — Queen covers Queen, then same-suit cover: valid', () => {
    const hand: Card[] = [
      { rank: 'Q', suit: 'spades' },
      { rank: 'Q', suit: 'hearts' },
      { rank: 'K', suit: 'hearts' },
    ];
    const state = makeQueenState(hand);
    const combo: Card[] = [
      { rank: 'Q', suit: 'spades' },
      { rank: 'Q', suit: 'hearts' },
      { rank: 'K', suit: 'hearts' },
    ];
    expect(isValidCombo(combo, state)).toBe(true);
  });

  it('[Q♠, Q♥, K♠] — cover must match last Queen suit (hearts), K♠ is spades: invalid', () => {
    const hand: Card[] = [
      { rank: 'Q', suit: 'spades' },
      { rank: 'Q', suit: 'hearts' },
      { rank: 'K', suit: 'spades' },
    ];
    const state = makeQueenState(hand);
    const combo: Card[] = [
      { rank: 'Q', suit: 'spades' },
      { rank: 'Q', suit: 'hearts' },
      { rank: 'K', suit: 'spades' },
    ];
    expect(isValidCombo(combo, state)).toBe(false);
  });

  it('[Q♠, Q♥, Q♣, 3♣] — three Queens stacked, covered by clubs: valid', () => {
    const hand: Card[] = [
      { rank: 'Q', suit: 'spades' },
      { rank: 'Q', suit: 'hearts' },
      { rank: 'Q', suit: 'clubs' },
      { rank: '3', suit: 'clubs' },
    ];
    const state = makeQueenState(hand);
    const combo: Card[] = [
      { rank: 'Q', suit: 'spades' },
      { rank: 'Q', suit: 'hearts' },
      { rank: 'Q', suit: 'clubs' },
      { rank: '3', suit: 'clubs' },
    ];
    expect(isValidCombo(combo, state)).toBe(true);
  });

  it('[Q♠, Q♥, Q♣, 3♥] — cover must match last Queen (Q♣ suit = clubs), 3♥ is hearts: invalid', () => {
    const hand: Card[] = [
      { rank: 'Q', suit: 'spades' },
      { rank: 'Q', suit: 'hearts' },
      { rank: 'Q', suit: 'clubs' },
      { rank: '3', suit: 'hearts' },
    ];
    const state = makeQueenState(hand);
    const combo: Card[] = [
      { rank: 'Q', suit: 'spades' },
      { rank: 'Q', suit: 'hearts' },
      { rank: 'Q', suit: 'clubs' },
      { rank: '3', suit: 'hearts' },
    ];
    expect(isValidCombo(combo, state)).toBe(false);
  });

  it('[Q♠, Q♥, K♥, A♥, A♣] — original bug combo: valid', () => {
    const hand: Card[] = [
      { rank: 'Q', suit: 'spades' },
      { rank: 'Q', suit: 'hearts' },
      { rank: 'K', suit: 'hearts' },
      { rank: 'A', suit: 'hearts' },
      { rank: 'A', suit: 'clubs' },
    ];
    const state = makeQueenState(hand);
    const combo: Card[] = [
      { rank: 'Q', suit: 'spades' },
      { rank: 'Q', suit: 'hearts' },
      { rank: 'K', suit: 'hearts' },
      { rank: 'A', suit: 'hearts' },
      { rank: 'A', suit: 'clubs' },
    ];
    expect(isValidCombo(combo, state)).toBe(true);
  });
});

// ─── isValidCombo — same-rank suit changes are direction-neutral ─────────────

function c(rank: Card['rank'], suit: Card['suit']): Card {
  return { rank, suit };
}

describe('isValidCombo — same-rank suit changes are direction-neutral', () => {
  it('5♥ → 6♥ → 6♣ → 6♠ — ascending then suit changes, valid', () => {
    const state = makeState({ discard: [c('4', 'hearts')] });
    expect(isValidCombo(
      [c('5', 'hearts'), c('6', 'hearts'), c('6', 'clubs'), c('6', 'spades')],
      state
    )).toBe(true);
  });

  it('6♥ → 6♣ → 7♣ — suit change then ascending same suit, valid', () => {
    const state = makeState({ discard: [c('6', 'spades')] });
    expect(isValidCombo([c('6', 'hearts'), c('6', 'clubs'), c('7', 'clubs')], state)).toBe(true);
  });

  it('6♥ → 6♣ → 5♣ — suit change then descending same suit, valid', () => {
    const state = makeState({ discard: [c('6', 'spades')] });
    expect(isValidCombo([c('6', 'hearts'), c('6', 'clubs'), c('5', 'clubs')], state)).toBe(true);
  });

  it('5♥ → 6♥ → 6♣ → 5♣ — ascending then suit change then descending, now VALID (direction can change freely)', () => {
    const state = makeState({ discard: [c('4', 'hearts')] });
    expect(isValidCombo(
      [c('5', 'hearts'), c('6', 'hearts'), c('6', 'clubs'), c('5', 'clubs')],
      state
    )).toBe(true);
  });

  it('6♥ → 6♣ → 7♣ → 7♥ → 8♥ — mixed suit changes and ascending, valid', () => {
    const state = makeState({ discard: [c('6', 'spades')] });
    expect(isValidCombo(
      [c('6', 'hearts'), c('6', 'clubs'), c('7', 'clubs'), c('7', 'hearts'), c('8', 'hearts')],
      state
    )).toBe(true);
  });

  it('6♥ → 6♣ → 6♠ — three same-rank suit changes matching discard rank, valid', () => {
    const state = makeState({ discard: [c('6', 'spades')] });
    expect(isValidCombo([c('6', 'hearts'), c('6', 'clubs'), c('6', 'diamonds')], state)).toBe(true);
  });
});

// ─── Solo Queen rule ──────────────────────────────────────────────────────────

describe('isValidPlay — solo Queen is always valid', () => {
  it('solo Queen is valid to play when matching suit', () => {
    const state = makeState({ discard: [c('5', 'hearts')] });
    expect(isValidPlay(c('Q', 'hearts'), state)).toBe(true);
  });

  it('solo Queen is valid to play when matching rank', () => {
    const state = makeState({ discard: [c('Q', 'spades')] });
    expect(isValidPlay(c('Q', 'hearts'), state)).toBe(true);
  });
});

describe('isValidCombo — Queen in multi-card combo still requires cover', () => {
  it('Queen in multi-card combo without cover is invalid', () => {
    // [Q♥] alone as single card is valid (solo Queen path)
    // but [Q♥, 3♠] — 3♠ is not hearts and not a Queen, so invalid
    const state = makeState({ discard: [c('5', 'hearts')] });
    expect(isValidCombo([c('Q', 'hearts'), c('3', 'spades')], state)).toBe(false);
  });

  it('Queen in multi-card combo with same-suit cover is valid', () => {
    const state = makeState({ discard: [c('5', 'hearts')] });
    expect(isValidCombo([c('Q', 'hearts'), c('3', 'hearts')], state)).toBe(true);
  });
});

// ─── isValidCombo — direction can change freely ───────────────────────────────

describe('isValidCombo — direction changes freely after suit change', () => {
  it('5♥ → 6♥ → 6♣ → 5♣ — up then suit change then down, valid', () => {
    const state = makeState({ discard: [c('4', 'hearts')] });
    expect(isValidCombo(
      [c('5', 'hearts'), c('6', 'hearts'), c('6', 'clubs'), c('5', 'clubs')],
      state
    )).toBe(true);
  });

  it('7♥ → 6♥ → 6♣ → 7♣ — down then suit change then up, valid', () => {
    const state = makeState({ discard: [c('8', 'hearts')] });
    expect(isValidCombo(
      [c('7', 'hearts'), c('6', 'hearts'), c('6', 'clubs'), c('7', 'clubs')],
      state
    )).toBe(true);
  });
});
