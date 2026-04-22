import { applyPowerCardEffect } from '../effects';
import { applyPlay, resolveConflictingEffects } from '../state';
import { Card, GameState, Player } from '../types';

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    deck: [],
    discard: [{ rank: '5', suit: 'hearts' }],
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
    ...overrides,
  };
}

describe('applyPowerCardEffect — Ace', () => {
  it('sets activeSuit to declared suit', () => {
    const state = makeState();
    const result = applyPowerCardEffect({ rank: 'A', suit: 'hearts' }, 'spades', state);
    expect(result.activeSuit).toBe('spades');
  });

  // Edge Case 10: Ace declares same suit already in play — valid
  it('allows Ace to declare the same suit already in play', () => {
    const state = makeState({ activeSuit: 'hearts' });
    const result = applyPowerCardEffect({ rank: 'A', suit: 'clubs' }, 'hearts', state);
    expect(result.activeSuit).toBe('hearts');
  });
});

describe('applyPowerCardEffect — 2', () => {
  it('adds 2 to pendingPickup and sets type to "2"', () => {
    const state = makeState();
    const result = applyPowerCardEffect({ rank: '2', suit: 'clubs' }, null, state);
    expect(result.pendingPickup).toBe(2);
    expect(result.pendingPickupType).toBe('2');
  });

  it('stacks on existing pendingPickup', () => {
    const state = makeState({ pendingPickup: 2, pendingPickupType: '2' });
    const result = applyPowerCardEffect({ rank: '2', suit: 'spades' }, null, state);
    expect(result.pendingPickup).toBe(4);
  });
});

describe('applyPowerCardEffect — 8', () => {
  it('increments skipsRemaining by 1', () => {
    const state = makeState();
    const result = applyPowerCardEffect({ rank: '8', suit: 'hearts' }, null, state);
    expect(result.skipsRemaining).toBe(1);
  });

  // Edge Case 8: two 8s in one turn = next two players miss
  it('stacks: two 8 effects = skipsRemaining of 2', () => {
    let state = makeState();
    state = applyPowerCardEffect({ rank: '8', suit: 'hearts' }, null, state);
    state = applyPowerCardEffect({ rank: '8', suit: 'clubs' }, null, state);
    expect(state.skipsRemaining).toBe(2);
  });
});

describe('applyPowerCardEffect — black Jack', () => {
  it('adds 7 to pendingPickup and sets type to "jack"', () => {
    const state = makeState();
    const result = applyPowerCardEffect({ rank: 'J', suit: 'spades' }, null, state);
    expect(result.pendingPickup).toBe(7);
    expect(result.pendingPickupType).toBe('jack');
  });

  // Edge Case 7: two black Jacks stacked = 14
  it('stacks two black Jacks to 14', () => {
    let state = makeState();
    state = applyPowerCardEffect({ rank: 'J', suit: 'spades' }, null, state);
    state = applyPowerCardEffect({ rank: 'J', suit: 'clubs' }, null, state);
    expect(state.pendingPickup).toBe(14);
    expect(state.pendingPickupType).toBe('jack');
  });
});

describe('applyPowerCardEffect — red Jack (counter)', () => {
  it('resets pendingPickup and pendingPickupType when countering', () => {
    const state = makeState({ pendingPickup: 7, pendingPickupType: 'jack' });
    const result = applyPowerCardEffect({ rank: 'J', suit: 'hearts' }, null, state);
    expect(result.pendingPickup).toBe(0);
    expect(result.pendingPickupType).toBeNull();
  });
});

describe('applyPowerCardEffect — Queen', () => {
  it('sets phase to "cover"', () => {
    const state = makeState();
    const result = applyPowerCardEffect({ rank: 'Q', suit: 'hearts' }, null, state);
    expect(result.phase).toBe('cover');
  });
});

describe('applyPowerCardEffect — King', () => {
  it('reverses direction clockwise → anticlockwise', () => {
    const state = makeState({ direction: 'clockwise' });
    const result = applyPowerCardEffect({ rank: 'K', suit: 'hearts' }, null, state);
    expect(result.direction).toBe('anticlockwise');
  });

  it('reverses direction anticlockwise → clockwise', () => {
    const state = makeState({ direction: 'anticlockwise' });
    const result = applyPowerCardEffect({ rank: 'K', suit: 'hearts' }, null, state);
    expect(result.direction).toBe('clockwise');
  });

  // Edge Case 11: King in 2-player — direction reverses, other player goes next
  it('King in 2-player still reverses direction (not a skip)', () => {
    const state = makeState({ direction: 'clockwise' });
    const result = applyPowerCardEffect({ rank: 'K', suit: 'spades' }, null, state);
    expect(result.direction).toBe('anticlockwise');
    // skipsRemaining must NOT increase — King is not a skip
    expect(result.skipsRemaining).toBe(0);
  });
});

// ─── resolveConflictingEffects (via applyPlay) ────────────────────────────────

function makePlayState(hand: Card[], topDiscard: Card, overrides: Partial<GameState> = {}): GameState {
  const player: Player = { id: 'p1', hand, isHuman: true };
  return {
    deck: Array.from({ length: 20 }, () => ({ rank: '3', suit: 'clubs' as const })),
    discard: [topDiscard],
    players: [player, { id: 'p2', hand: [{ rank: '3', suit: 'spades' }], isHuman: false }],
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
    sessionScores: { p1: 0, p2: 0 },
    onCardsDeclarations: [],
    currentPlayerHasActed: false,
    ...overrides,
  };
}

describe('resolveConflictingEffects — via applyPlay', () => {
  it('[2♥, A♥]: Ace overrides 2 — pendingPickup is 0, activeSuit is set', () => {
    const hand: Card[] = [{ rank: '2', suit: 'hearts' }, { rank: 'A', suit: 'hearts' }];
    const state = makePlayState(hand, { rank: '2', suit: 'hearts' });
    const result = applyPlay(hand, 'spades', state);
    expect(result.pendingPickup).toBe(0);
    expect(result.pendingPickupType).toBeNull();
    expect(result.activeSuit).toBe('spades');
  });

  it('[A♥, 2♥]: 2 overrides Ace — pendingPickup is 2, activeSuit is null', () => {
    const hand: Card[] = [{ rank: 'A', suit: 'hearts' }, { rank: '2', suit: 'hearts' }];
    const state = makePlayState(hand, { rank: 'A', suit: 'hearts' });
    const result = applyPlay(hand, 'hearts', state);
    expect(result.pendingPickup).toBe(2);
    expect(result.pendingPickupType).toBe('2');
    expect(result.activeSuit).toBeNull();
  });

  it('[2♥, 2♦]: same type stacks — pendingPickup is 4', () => {
    const hand: Card[] = [{ rank: '2', suit: 'hearts' }, { rank: '2', suit: 'diamonds' }];
    const state = makePlayState(hand, { rank: '2', suit: 'hearts' });
    const result = applyPlay(hand, null, state);
    expect(result.pendingPickup).toBe(4);
    expect(result.pendingPickupType).toBe('2');
  });

  // [K♠, A♠]: non-adjacent ranks — cannot form a valid combo, so tested via resolveConflictingEffects directly
  it('[K♠, A♠]: A last — K direction preserved, A activeSuit preserved, no conflict', () => {
    // State after K effect (direction reversed) and A effect (activeSuit set)
    const state = makeState({ direction: 'anticlockwise', activeSuit: 'hearts', pendingPickup: 0, pendingPickupType: null });
    const cards: Card[] = [{ rank: 'K', suit: 'spades' }, { rank: 'A', suit: 'spades' }];
    const result = resolveConflictingEffects(state, cards);
    expect(result.direction).toBe('anticlockwise');
    expect(result.activeSuit).toBe('hearts');
  });

  // [A♥, K♥]: non-adjacent ranks — tested via resolveConflictingEffects directly
  it('[A♥, K♥]: K last — clears activeSuit set by A', () => {
    // State after A effect (activeSuit set) and K effect (direction reversed)
    const state = makeState({ activeSuit: 'hearts', direction: 'anticlockwise', pendingPickup: 0, pendingPickupType: null });
    const cards: Card[] = [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'hearts' }];
    const result = resolveConflictingEffects(state, cards);
    expect(result.activeSuit).toBeNull();
    expect(result.direction).toBe('anticlockwise');
  });

  // [J♠, A♠]: non-adjacent ranks — tested via resolveConflictingEffects directly
  it('[J♠, A♠]: A last — clears pendingPickup from black Jack, activeSuit preserved', () => {
    // State after J effect (pendingPickup=7) and A effect (activeSuit=clubs)
    const state = makeState({ pendingPickup: 7, pendingPickupType: 'jack', activeSuit: 'clubs' });
    const cards: Card[] = [{ rank: 'J', suit: 'spades' }, { rank: 'A', suit: 'spades' }];
    const result = resolveConflictingEffects(state, cards);
    expect(result.pendingPickup).toBe(0);
    expect(result.pendingPickupType).toBeNull();
    expect(result.activeSuit).toBe('clubs');
  });

  // [2♥, 8♥]: non-adjacent ranks — tested via resolveConflictingEffects directly
  it('[2♥, 8♥]: 8 last — clears pendingPickup from 2, skipsRemaining preserved', () => {
    // State after 2 effect (pendingPickup=2) and 8 effect (skipsRemaining=1)
    const state = makeState({ pendingPickup: 2, pendingPickupType: '2', skipsRemaining: 1 });
    const cards: Card[] = [{ rank: '2', suit: 'hearts' }, { rank: '8', suit: 'hearts' }];
    const result = resolveConflictingEffects(state, cards);
    expect(result.pendingPickup).toBe(0);
    expect(result.pendingPickupType).toBeNull();
    expect(result.skipsRemaining).toBe(1);
  });
});
