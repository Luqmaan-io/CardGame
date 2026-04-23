import { applyPlay, advanceTurn, getNextPlayerIndex, checkWinCondition, drawCard } from '../state';
import { Card, GameState, Player } from '../types';

function makePlayer(id: string, hand: Card[], isHuman = false): Player {
  return { id, hand, isHuman };
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
    ...overrides,
  };
}

// ─── getNextPlayerIndex ──────────────────────────────────────────────────────

describe('getNextPlayerIndex', () => {
  it('advances clockwise in 4 players', () => {
    const state = makeState({
      players: ['p1', 'p2', 'p3', 'p4'].map((id) => makePlayer(id, [])),
      currentPlayerIndex: 0,
      direction: 'clockwise',
    });
    expect(getNextPlayerIndex(state)).toBe(1);
  });

  it('wraps around at end of player list', () => {
    const state = makeState({
      players: ['p1', 'p2', 'p3', 'p4'].map((id) => makePlayer(id, [])),
      currentPlayerIndex: 3,
      direction: 'clockwise',
    });
    expect(getNextPlayerIndex(state)).toBe(0);
  });

  it('advances anticlockwise', () => {
    const state = makeState({
      players: ['p1', 'p2', 'p3', 'p4'].map((id) => makePlayer(id, [])),
      currentPlayerIndex: 0,
      direction: 'anticlockwise',
    });
    expect(getNextPlayerIndex(state)).toBe(3);
  });

  it('skips players when skipsRemaining > 0', () => {
    const state = makeState({
      players: ['p1', 'p2', 'p3', 'p4'].map((id) => makePlayer(id, [])),
      currentPlayerIndex: 0,
      direction: 'clockwise',
      skipsRemaining: 1,
    });
    // p1 → skip p2 → land on p3
    expect(getNextPlayerIndex(state)).toBe(2);
  });

  // Edge Case 11: King in 2-player — other player goes next
  it('2-player: other player always goes next regardless of direction', () => {
    const state = makeState({
      players: ['p1', 'p2'].map((id) => makePlayer(id, [])),
      currentPlayerIndex: 0,
      direction: 'anticlockwise',
    });
    expect(getNextPlayerIndex(state)).toBe(1);
  });
});

// ─── checkWinCondition ───────────────────────────────────────────────────────

describe('checkWinCondition', () => {
  it('returns true when player hand is empty', () => {
    const state = makeState({ players: [makePlayer('p1', [])] });
    expect(checkWinCondition('p1', state)).toBe(true);
  });

  it('returns false when player has cards', () => {
    const state = makeState({
      players: [makePlayer('p1', [{ rank: '3', suit: 'hearts' }])],
    });
    expect(checkWinCondition('p1', state)).toBe(false);
  });
});

// ─── drawCard ────────────────────────────────────────────────────────────────

describe('drawCard', () => {
  it('moves cards from deck into current player hand', () => {
    const deck: Card[] = [
      { rank: '3', suit: 'clubs' },
      { rank: '4', suit: 'clubs' },
    ];
    const state = makeState({
      deck,
      players: [makePlayer('p1', [])],
    });
    const result = drawCard(2, state);
    const p1 = result.players.find((p) => p.id === 'p1')!;
    expect(p1.hand).toHaveLength(2);
    expect(result.deck).toHaveLength(0);
  });

  it('resets pendingPickup and pendingPickupType', () => {
    const deck: Card[] = [{ rank: '3', suit: 'clubs' }];
    const state = makeState({
      deck,
      pendingPickup: 2,
      pendingPickupType: '2',
      players: [makePlayer('p1', [])],
    });
    const result = drawCard(1, state);
    expect(result.pendingPickup).toBe(0);
    expect(result.pendingPickupType).toBeNull();
  });

  // Edge Case 2: deck and discard both empty — turn ends gracefully
  it('handles empty deck and discard gracefully (Edge Case 2)', () => {
    const state = makeState({
      deck: [],
      discard: [{ rank: '5', suit: 'hearts' }], // only top card
      players: [makePlayer('p1', [])],
    });
    // reshuffleDiscard needs 2+ cards to do anything
    const result = drawCard(3, state);
    // Player draws 0 cards (or whatever was available), no crash
    expect(result).toBeDefined();
    expect(result.phase).toBe('play');
  });

  it('reshuffles discard when deck runs out mid-draw', () => {
    const deck: Card[] = [{ rank: '3', suit: 'clubs' }];
    const discard: Card[] = [
      { rank: '6', suit: 'hearts' },
      { rank: '7', suit: 'hearts' },
      { rank: '8', suit: 'hearts' }, // top
    ];
    const state = makeState({
      deck,
      discard,
      players: [makePlayer('p1', [])],
    });
    const result = drawCard(3, state);
    const p1 = result.players.find((p) => p.id === 'p1')!;
    // Should draw 3: 1 from deck, then reshuffle and draw 2 more from discard
    expect(p1.hand).toHaveLength(3);
  });
});

// ─── applyPlay ───────────────────────────────────────────────────────────────

describe('applyPlay — win condition', () => {
  it('sets game-over and winnerId when last card is non-power card', () => {
    const state = makeState({
      discard: [{ rank: '5', suit: 'hearts' }],
      players: [makePlayer('p1', [{ rank: '5', suit: 'clubs' }])],
    });
    const result = applyPlay([{ rank: '5', suit: 'clubs' }], null, state);
    expect(result.phase).toBe('game-over');
    expect(result.winnerId).toBe('p1');
  });

  // Edge Case 4: King as last card — direction reverses, player draws, game continues
  it('player draws when last card is King (power card finish rule, Edge Case 4)', () => {
    const deck: Card[] = [{ rank: '3', suit: 'diamonds' }];
    const state = makeState({
      deck,
      discard: [{ rank: 'K', suit: 'hearts' }],
      players: [
        makePlayer('p1', [{ rank: 'K', suit: 'spades' }]),
        makePlayer('p2', [{ rank: '7', suit: 'clubs' }]),
      ],
    });
    const result = applyPlay([{ rank: 'K', suit: 'spades' }], null, state);
    // Should NOT be game-over
    expect(result.phase).not.toBe('game-over');
    // p1 should have drawn a card (hand = [3♦])
    const p1 = result.players.find((p) => p.id === 'p1')!;
    expect(p1.hand).toHaveLength(1);
    // Direction should have reversed
    expect(result.direction).toBe('anticlockwise');
  });
});

describe('applyPlay — 2-stack', () => {
  // Edge Case 5: 2-stack — player draws, turn ends, cannot play from drawn cards
  it('applies 2-stack: pendingPickup accumulates across two 2-plays', () => {
    const state = makeState({
      discard: [{ rank: '2', suit: 'hearts' }],
      pendingPickup: 2,
      pendingPickupType: '2',
      players: [
        makePlayer('p1', [{ rank: '2', suit: 'clubs' }]),
        makePlayer('p2', []),
      ],
    });
    const result = applyPlay([{ rank: '2', suit: 'clubs' }], null, state);
    // pendingPickup should now be 4
    expect(result.pendingPickup).toBe(4);
    expect(result.pendingPickupType).toBe('2');
  });

  it('drawCard resets pending after 2-stack penalty draw', () => {
    const deck: Card[] = [
      { rank: '3', suit: 'clubs' },
      { rank: '4', suit: 'clubs' },
    ];
    const state = makeState({
      deck,
      pendingPickup: 2,
      pendingPickupType: '2',
      players: [makePlayer('p1', [])],
    });
    const result = drawCard(2, state);
    expect(result.pendingPickup).toBe(0);
    expect(result.pendingPickupType).toBeNull();
  });
});

describe('applyPlay — black Jack', () => {
  // Edge Case 6: black Jack, no red Jack in hand — draws 7
  it('next player draws 7 if no red Jack available', () => {
    const deck: Card[] = Array.from({ length: 7 }, (_, i) => ({
      rank: '3' as const,
      suit: 'clubs' as const,
    }));
    const state = makeState({
      deck,
      discard: [{ rank: '5', suit: 'spades' }],
      pendingPickup: 7,
      pendingPickupType: 'jack' as const,
      players: [
        makePlayer('p1', []),
        makePlayer('p2', [{ rank: '4', suit: 'clubs' }]), // no red Jack
      ],
      currentPlayerIndex: 1,
    });
    const result = drawCard(7, state);
    const p2 = result.players.find((p) => p.id === 'p2')!;
    expect(p2.hand).toHaveLength(8); // 1 original + 7 drawn
    expect(result.pendingPickup).toBe(0);
  });
});

describe('applyPlay — 8 skip behaviour', () => {
  // Edge Case 8: two 8s in one turn — next two players miss
  it('two 8s in a combo → skipsRemaining=2 applied then reset', () => {
    const state = makeState({
      discard: [{ rank: '8', suit: 'hearts' }],
      players: [
        makePlayer('p1', [
          { rank: '8', suit: 'diamonds' },
          { rank: '8', suit: 'clubs' },
        ]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
        makePlayer('p3', [{ rank: '3', suit: 'clubs' }]),
        makePlayer('p4', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    // Two 8s (same rank, suit change) in combo
    const combo: Card[] = [
      { rank: '8', suit: 'diamonds' },
      { rank: '8', suit: 'clubs' },
    ];
    // applyPlay stays on current player; advanceTurn applies skips
    const intermediate = applyPlay(combo, null, state);
    const result = advanceTurn(intermediate);
    // p1→skip p2→skip p3→land p4
    expect(result.currentPlayerIndex).toBe(3); // p4 (index 3)
  });

  // Edge Case 9: Player B plays 8 in response to Player A's 8 — only Player C misses
  it('responding 8 resets skip: only next player misses', () => {
    // Player A already played an 8 (skipsRemaining=1), Player B (idx=1) redirects with own 8
    const state = makeState({
      discard: [{ rank: '8', suit: 'hearts' }],
      skipsRemaining: 1,
      players: [
        makePlayer('p1', []),
        makePlayer('p2', [{ rank: '8', suit: 'clubs' }]),
        makePlayer('p3', [{ rank: '3', suit: 'clubs' }]),
        makePlayer('p4', [{ rank: '3', suit: 'clubs' }]),
      ],
      currentPlayerIndex: 1,
    });
    // applyPlay resets skipsRemaining to 0, applies 8 effect (+1), stays on p2
    const intermediate = applyPlay([{ rank: '8', suit: 'clubs' }], null, state);
    const result = advanceTurn(intermediate);
    // p2 plays 8 → skipsRemaining=1 → only p3 misses → p4's turn
    expect(result.currentPlayerIndex).toBe(3); // p4
  });
});

describe('applyPlay — starting discard is power card', () => {
  // Edge Case 1: Starting discard is a power card — no effect on first turn
  // This is enforced externally (game setup treats it as neutral).
  // We verify that applyPlay on first card still works normally.
  it('first player can play matching rank on power card discard', () => {
    const state = makeState({
      discard: [{ rank: '2', suit: 'hearts' }], // starting power card — treated neutral
      pendingPickup: 0,         // key: no pending because effect didn't apply at setup
      pendingPickupType: null,
      players: [
        makePlayer('p1', [{ rank: '2', suit: 'spades' }]),
        makePlayer('p2', []),
      ],
    });
    // p1 can match rank '2' on the neutral starting '2♥'
    const result = applyPlay([{ rank: '2', suit: 'spades' }], null, state);
    // If treated neutrally (pendingPickupType null), p1's 2♠ is valid by rank match
    // After playing, pendingPickup=2 because p1 played a '2'
    expect(result.pendingPickup).toBe(2);
  });
});

describe('applyPlay — throws on invalid combo', () => {
  it('throws when combo is invalid', () => {
    const state = makeState({
      discard: [{ rank: '5', suit: 'hearts' }],
      players: [makePlayer('p1', [{ rank: '7', suit: 'clubs' }])],
    });
    expect(() => applyPlay([{ rank: '7', suit: 'clubs' }], null, state)).toThrow();
  });
});
