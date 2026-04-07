import { applyPowerCardEffect } from '../effects';
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
