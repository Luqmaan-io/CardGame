import {
  applyTimeout,
  applyMoveSuccess,
  advanceTurn,
  declareOnCards,
  clearOnCardsDeclaration,
  awardWin,
  applyPlay,
  drawCard,
} from '../state';
import { Card, GameState, Player } from '../types';

function makePlayer(id: string, hand: Card[], isHuman = false): Player {
  return { id, hand, isHuman };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    deck: [
      { rank: '3', suit: 'clubs' },
      { rank: '4', suit: 'clubs' },
      { rank: '5', suit: 'clubs' },
      { rank: '6', suit: 'clubs' },
    ],
    discard: [{ rank: '5', suit: 'hearts' }],
    players: [
      makePlayer('p1', [{ rank: '7', suit: 'hearts' }]),
      makePlayer('p2', [{ rank: '8', suit: 'hearts' }]),
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
    ...overrides,
  };
}

// ─── applyTimeout — strikes 1 and 2 ─────────────────────────────────────────

describe('applyTimeout — strike 1', () => {
  it('increments strike from 0 to 1, draws a card for the player, advances turn', () => {
    const state = makeState({ timeoutStrikes: {} });
    const result = applyTimeout(state);

    expect(result.timeoutStrikes['p1']).toBe(1);
    // p1 should have drawn a card
    const p1 = result.players.find((p) => p.id === 'p1')!;
    expect(p1.hand).toHaveLength(2); // 1 original + 1 drawn
    // Turn should have advanced to p2
    expect(result.currentPlayerIndex).toBe(1);
    // Timer reset
    expect(result.timerStartedAt).toBeNull();
  });

  it('resets pendingPickup and phase to play', () => {
    const state = makeState({ pendingPickup: 2, pendingPickupType: '2' });
    const result = applyTimeout(state);
    expect(result.pendingPickup).toBe(0);
    expect(result.pendingPickupType).toBeNull();
    expect(result.phase).toBe('play');
  });
});

describe('applyTimeout — strike 2', () => {
  it('increments strike from 1 to 2, draws a card, advances turn', () => {
    const state = makeState({ timeoutStrikes: { p1: 1 } });
    const result = applyTimeout(state);

    expect(result.timeoutStrikes['p1']).toBe(2);
    const p1 = result.players.find((p) => p.id === 'p1')!;
    expect(p1.hand).toHaveLength(2);
    expect(result.currentPlayerIndex).toBe(1);
  });
});

// ─── applyTimeout — strike 3 (kick) ─────────────────────────────────────────

describe('applyTimeout — strike 3 (kick)', () => {
  it('removes the player from the game and shuffles their hand into the deck', () => {
    const state = makeState({
      timeoutStrikes: { p1: 2 },
      players: [
        makePlayer('p1', [{ rank: '7', suit: 'hearts' }, { rank: '9', suit: 'clubs' }]),
        makePlayer('p2', [{ rank: '8', suit: 'hearts' }]),
        makePlayer('p3', [{ rank: '6', suit: 'diamonds' }]),
      ],
    });
    const originalDeckSize = state.deck.length;
    const p1HandSize = state.players[0]!.hand.length;

    const result = applyTimeout(state);

    // p1 is gone
    expect(result.players.find((p) => p.id === 'p1')).toBeUndefined();
    expect(result.players).toHaveLength(2);
    // p1's cards went into the deck
    expect(result.deck.length).toBe(originalDeckSize + p1HandSize);
    // Strike record cleaned up
    expect(result.timeoutStrikes['p1']).toBeUndefined();
  });

  it('game-over with winner when only 2 players and one is kicked', () => {
    const state = makeState({
      timeoutStrikes: { p1: 2 },
      players: [
        makePlayer('p1', [{ rank: '7', suit: 'hearts' }]),
        makePlayer('p2', [{ rank: '8', suit: 'hearts' }]),
      ],
    });

    const result = applyTimeout(state);

    expect(result.phase).toBe('game-over');
    expect(result.winnerId).toBe('p2');
    // Session score awarded to p2
    expect(result.sessionScores['p2']).toBe(1);
  });

  it('game continues (not game-over) when 3+ players remain after kick', () => {
    const state = makeState({
      timeoutStrikes: { p1: 2 },
      players: [
        makePlayer('p1', [{ rank: '7', suit: 'hearts' }]),
        makePlayer('p2', [{ rank: '8', suit: 'hearts' }]),
        makePlayer('p3', [{ rank: '6', suit: 'diamonds' }]),
      ],
    });

    const result = applyTimeout(state);

    expect(result.phase).toBe('play');
    expect(result.winnerId).toBeNull();
    expect(result.players).toHaveLength(2);
  });
});

// ─── applyMoveSuccess ────────────────────────────────────────────────────────

describe('applyMoveSuccess', () => {
  it('resets strike to 0 after a valid move following 2 strikes', () => {
    const state = makeState({ timeoutStrikes: { p1: 2 } });
    const result = applyMoveSuccess('p1', state);
    expect(result.timeoutStrikes['p1']).toBe(0);
  });

  it('is a no-op when player has no strikes', () => {
    const state = makeState({ timeoutStrikes: {} });
    const result = applyMoveSuccess('p1', state);
    expect(result).toBe(state); // reference equality — no new object
  });

  it('strike resets via applyPlay after 2 consecutive timeouts', () => {
    // Start with 2 strikes, then player makes a valid move
    const state = makeState({
      timeoutStrikes: { p1: 2 },
      discard: [{ rank: '7', suit: 'hearts' }],
      players: [
        makePlayer('p1', [{ rank: '7', suit: 'clubs' }]),
        makePlayer('p2', [{ rank: '3', suit: 'hearts' }]),
      ],
    });
    const result = applyPlay([{ rank: '7', suit: 'clubs' }], null, state);
    expect(result.timeoutStrikes['p1']).toBe(0);
  });
});

// ─── declareOnCards ──────────────────────────────────────────────────────────

describe('declareOnCards', () => {
  // Build a state where the player has a valid winning hand (one non-power card matching discard)
  function makeActedState(overrides: Partial<GameState> = {}): GameState {
    return makeState({
      currentPlayerIndex: 0,
      currentPlayerHasActed: true,
      discard: [{ rank: '5', suit: 'hearts' }],
      players: [
        { id: 'p1', hand: [{ rank: '5', suit: 'clubs' }], isHuman: false },
        { id: 'p2', hand: [{ rank: '3', suit: 'clubs' }], isHuman: false },
      ],
      ...overrides,
    });
  }

  it('adds playerId to onCardsDeclarations when declaration is valid', () => {
    const state = makeActedState();
    const { newState, isValid } = declareOnCards('p1', state);
    expect(isValid).toBe(true);
    expect(newState.onCardsDeclarations).toContain('p1');
  });

  it('is a no-op if already declared (valid hand)', () => {
    const state = makeActedState({ onCardsDeclarations: ['p1'] });
    const { newState, isValid } = declareOnCards('p1', state);
    expect(isValid).toBe(true);
    expect(newState.onCardsDeclarations.filter((id) => id === 'p1')).toHaveLength(1);
  });

  it('throws when called on the wrong player\'s turn', () => {
    const state = makeActedState({ currentPlayerIndex: 1 }); // p2's turn
    expect(() => declareOnCards('p1', state)).toThrow();
  });

  it('throws when player has not yet acted this turn', () => {
    const state = makeActedState({ currentPlayerHasActed: false });
    expect(() => declareOnCards('p1', state)).toThrow();
  });

  it('other players can see the declaration in state when valid', () => {
    const state = makeActedState();
    const { newState } = declareOnCards('p1', state);
    expect(newState.onCardsDeclarations.includes('p1')).toBe(true);
  });

  it('draws 2 cards as penalty when declaration is invalid', () => {
    // Player has a power card only — cannot win next turn
    const deck = [{ rank: '9', suit: 'spades' }, { rank: '10', suit: 'spades' }] as const;
    const state = makeState({
      currentPlayerIndex: 0,
      currentPlayerHasActed: true,
      deck: [...deck],
      discard: [{ rank: '5', suit: 'hearts' }],
      players: [
        { id: 'p1', hand: [{ rank: 'A', suit: 'hearts' }], isHuman: false },
        { id: 'p2', hand: [{ rank: '3', suit: 'clubs' }], isHuman: false },
      ],
    });
    const { newState, isValid } = declareOnCards('p1', state);
    expect(isValid).toBe(false);
    expect(newState.onCardsDeclarations).not.toContain('p1');
    const p1 = newState.players.find((p) => p.id === 'p1')!;
    expect(p1.hand).toHaveLength(3); // 1 original + 2 penalty
  });
});

// ─── clearOnCardsDeclaration ─────────────────────────────────────────────────

describe('clearOnCardsDeclaration', () => {
  it('removes playerId from declarations', () => {
    const state = makeState({ onCardsDeclarations: ['p1', 'p2'] });
    const result = clearOnCardsDeclaration('p1', state);
    expect(result.onCardsDeclarations).not.toContain('p1');
    expect(result.onCardsDeclarations).toContain('p2');
  });

  it('is a no-op if player was not declared', () => {
    const state = makeState({ onCardsDeclarations: ['p2'] });
    const result = clearOnCardsDeclaration('p1', state);
    expect(result.onCardsDeclarations).toEqual(['p2']);
  });

  it('declaration is cleared when turn advances back to the declaring player', () => {
    // p1 declared, now p2 takes a turn — when advanceTurn runs back to p1 it clears
    const state = makeState({
      onCardsDeclarations: ['p1'],
      currentPlayerIndex: 1, // p2's turn
      discard: [{ rank: '6', suit: 'hearts' }],
      players: [
        makePlayer('p1', [{ rank: '9', suit: 'hearts' }]),
        makePlayer('p2', [{ rank: '6', suit: 'clubs' }, { rank: '3', suit: 'clubs' }]),
      ],
    });
    // p2 plays 6♣ (matches rank) — stays on p2 until advanceTurn
    const intermediate = applyPlay([{ rank: '6', suit: 'clubs' }], null, state);
    const result = advanceTurn(intermediate);
    // After advancing back to p1, their declaration should be cleared
    expect(result.onCardsDeclarations).not.toContain('p1');
  });
});

// ─── awardWin ────────────────────────────────────────────────────────────────

describe('awardWin', () => {
  it('increments sessionScores by 1 for the winner', () => {
    const state = makeState({ sessionScores: {} });
    const result = awardWin('p1', state);
    expect(result.sessionScores['p1']).toBe(1);
  });

  it('accumulates across multiple games', () => {
    const state = makeState({ sessionScores: { p1: 3 } });
    const result = awardWin('p1', state);
    expect(result.sessionScores['p1']).toBe(4);
  });

  it('scores are independent per player', () => {
    const state = makeState({ sessionScores: { p1: 2, p2: 0 } });
    const result = awardWin('p2', state);
    expect(result.sessionScores['p1']).toBe(2);
    expect(result.sessionScores['p2']).toBe(1);
  });

  it('session score is incremented via applyPlay when non-power card wins', () => {
    const state = makeState({
      sessionScores: { p1: 1 },
      discard: [{ rank: '5', suit: 'hearts' }],
      players: [
        makePlayer('p1', [{ rank: '5', suit: 'clubs' }]),
        makePlayer('p2', [{ rank: '3', suit: 'hearts' }]),
      ],
    });
    const result = applyPlay([{ rank: '5', suit: 'clubs' }], null, state);
    expect(result.phase).toBe('game-over');
    expect(result.sessionScores['p1']).toBe(2);
  });
});

// ─── timerStartedAt reset on turn advance ────────────────────────────────────

describe('timerStartedAt resets on turn advance', () => {
  it('timerStartedAt is null after applyPlay advances the turn', () => {
    const state = makeState({
      timerStartedAt: 1700000000000,
      discard: [{ rank: '7', suit: 'hearts' }],
      players: [
        makePlayer('p1', [{ rank: '7', suit: 'clubs' }, { rank: '3', suit: 'clubs' }]),
        makePlayer('p2', [{ rank: '3', suit: 'hearts' }]),
      ],
    });
    const result = applyPlay([{ rank: '7', suit: 'clubs' }], null, state);
    expect(result.timerStartedAt).toBeNull();
  });

  it('timerStartedAt is null after drawCard + advanceTurn', () => {
    const state = makeState({
      timerStartedAt: 1700000000000,
      deck: [{ rank: '3', suit: 'clubs' }],
      players: [
        makePlayer('p1', []),
        makePlayer('p2', []),
      ],
    });
    const drawn = drawCard(1, state);
    const result = advanceTurn(drawn);
    expect(result.timerStartedAt).toBeNull();
  });

  it('timerStartedAt is null after applyTimeout advances the turn', () => {
    const state = makeState({ timerStartedAt: 1700000000000 });
    const result = applyTimeout(state);
    expect(result.timerStartedAt).toBeNull();
  });
});
