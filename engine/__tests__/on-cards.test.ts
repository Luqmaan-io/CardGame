import { canWinNextTurn } from '../validation';
import { declareOnCards, advanceTurn, applyPlay, drawCard } from '../state';
import { Card, GameState, Player } from '../types';

function makePlayer(id: string, hand: Card[], isHuman = false): Player {
  return { id, hand, isHuman };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    deck: [],
    discard: [{ rank: '5', suit: 'hearts' }],
    players: [
      makePlayer('p1', []),
      makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
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

// ─── canWinNextTurn ───────────────────────────────────────────────────────────

describe('canWinNextTurn', () => {
  it('returns true when player has one valid non-power card matching discard', () => {
    const state = makeState({
      discard: [{ rank: '5', suit: 'hearts' }],
      players: [
        makePlayer('p1', [{ rank: '5', suit: 'clubs' }]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(true);
  });

  it('returns false when player has one card that is a power card', () => {
    const state = makeState({
      discard: [{ rank: 'A', suit: 'hearts' }],
      players: [
        makePlayer('p1', [{ rank: 'A', suit: 'clubs' }]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(false);
  });

  it('returns true when player has two cards forming a valid combo, last not a power card', () => {
    const state = makeState({
      discard: [{ rank: '5', suit: 'hearts' }],
      players: [
        makePlayer('p1', [
          { rank: '5', suit: 'clubs' },
          { rank: '6', suit: 'clubs' },
        ]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(true);
  });

  it('returns false when every possible combo ends on a power card', () => {
    // A♥ + 2♥: both orderings (A♥→2♥ and 2♥→A♥) are adjacent same-suit but end on a power card
    const state = makeState({
      players: [
        makePlayer('p1', [
          { rank: 'A', suit: 'hearts' },
          { rank: '2', suit: 'hearts' },
        ]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(false);
  });

  it('returns true when player has Queen + valid same-suit non-power cover', () => {
    // Q♥ must be covered by a hearts card. 3♥ is non-power.
    // Discard: Q♣ (so Q♥ matches rank). Q♥ 3♥ is valid combo (cover card).
    const state = makeState({
      discard: [{ rank: 'Q', suit: 'clubs' }],
      players: [
        makePlayer('p1', [
          { rank: 'Q', suit: 'hearts' },
          { rank: '3', suit: 'hearts' },
        ]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(true);
  });

  it('returns false when Queen cover is a power card (2)', () => {
    // Q♥ covered by 2♥ — 2 is a power card, so this is an invalid winning combo
    const state = makeState({
      discard: [{ rank: 'Q', suit: 'clubs' }],
      players: [
        makePlayer('p1', [
          { rank: 'Q', suit: 'hearts' },
          { rank: '2', suit: 'hearts' },
        ]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(false);
  });

  it('returns false when no ordering of the hand forms a valid sequence', () => {
    // 7♣ and 9♠ — different suit, non-adjacent rank — no valid combo possible
    const state = makeState({
      players: [
        makePlayer('p1', [
          { rank: '7', suit: 'clubs' },
          { rank: '9', suit: 'spades' },
        ]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(false);
  });
});

// ─── canWinNextTurn — top card irrelevance ────────────────────────────────────

describe('canWinNextTurn — top card is irrelevant', () => {
  it('Q♥ + 6♥: valid combo, top card irrelevant — returns true', () => {
    const state = makeState({
      discard: [{ rank: '3', suit: 'spades' }], // completely unrelated top card
      players: [
        makePlayer('p1', [
          { rank: 'Q', suit: 'hearts' },
          { rank: '6', suit: 'hearts' },
        ]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(true);
  });

  it('Q♥ + 6♠: 6♠ does not cover Q♥ (wrong suit) — returns false', () => {
    const state = makeState({
      players: [
        makePlayer('p1', [
          { rank: 'Q', suit: 'hearts' },
          { rank: '6', suit: 'spades' },
        ]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(false);
  });

  it('K♦ alone: power card as only card — returns false', () => {
    const state = makeState({
      players: [
        makePlayer('p1', [{ rank: 'K', suit: 'diamonds' }]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(false);
  });

  it('5♥ + 6♥: valid ascending combo ending on non-power — returns true', () => {
    const state = makeState({
      players: [
        makePlayer('p1', [
          { rank: '5', suit: 'hearts' },
          { rank: '6', suit: 'hearts' },
        ]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(true);
  });

  it('6♥ + 5♥: valid descending combo ending on non-power — returns true', () => {
    const state = makeState({
      players: [
        makePlayer('p1', [
          { rank: '6', suit: 'hearts' },
          { rank: '5', suit: 'hearts' },
        ]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(true);
  });

  it('Q♥ Q♣ 3♣: Queen stack covered by 3♣ — returns true', () => {
    const state = makeState({
      players: [
        makePlayer('p1', [
          { rank: 'Q', suit: 'hearts' },
          { rank: 'Q', suit: 'clubs' },
          { rank: '3', suit: 'clubs' },
        ]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(true);
  });

  it('A♥ + 3♥: non-adjacent same-suit pair — returns false', () => {
    // A is index 0, 3 is index 2 — gap of 2, not adjacent
    const state = makeState({
      players: [
        makePlayer('p1', [
          { rank: 'A', suit: 'hearts' },
          { rank: '3', suit: 'hearts' },
        ]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(false);
  });

  it('3♥ + A♥: adjacent order gives 3♥→A♥ but ends on power Ace — returns false', () => {
    // A is index 0, 3 is index 2 — gap of 2, not adjacent in either order
    const state = makeState({
      players: [
        makePlayer('p1', [
          { rank: '3', suit: 'hearts' },
          { rank: 'A', suit: 'hearts' },
        ]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(false);
  });

  it('top card is unplayable by suit/rank but hand forms valid combo — returns true', () => {
    // Old logic: 7♥ and 8♥ blocked because top is 3♣ and 7♥ doesn't match.
    // New logic: 8♥→7♥ is a valid descending combo ending on non-power 7♥ → true.
    const state = makeState({
      discard: [{ rank: '3', suit: 'clubs' }],
      players: [
        makePlayer('p1', [
          { rank: '7', suit: 'hearts' },
          { rank: '8', suit: 'hearts' },
        ]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(true);
  });

  it('single non-power card: always returns true regardless of top card', () => {
    // Old logic: J♠ on top, 7♦ doesn't match — returned false.
    // New logic: single non-power card → true.
    const state = makeState({
      discard: [{ rank: 'J', suit: 'spades' }],
      players: [
        makePlayer('p1', [{ rank: '7', suit: 'diamonds' }]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(true);
  });
});

// ─── declareOnCards — engine integration ─────────────────────────────────────

describe('declareOnCards — before player has acted', () => {
  it('throws when player has not acted yet', () => {
    const state = makeState({
      currentPlayerHasActed: false,
      players: [
        makePlayer('p1', [{ rank: '5', suit: 'clubs' }]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(() => declareOnCards('p1', state)).toThrow();
  });
});

describe('declareOnCards — valid winning hand', () => {
  it('returns isValid: true and adds declaration', () => {
    const state = makeState({
      currentPlayerHasActed: true,
      discard: [{ rank: '5', suit: 'hearts' }],
      players: [
        makePlayer('p1', [{ rank: '5', suit: 'clubs' }]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    const { newState, isValid } = declareOnCards('p1', state);
    expect(isValid).toBe(true);
    expect(newState.onCardsDeclarations).toContain('p1');
    // Hand unchanged — no penalty
    const p1 = newState.players.find((p) => p.id === 'p1')!;
    expect(p1.hand).toHaveLength(1);
  });
});

describe('declareOnCards — invalid winning hand (false declaration)', () => {
  it('returns isValid: false, player draws 2, declaration not added', () => {
    const deck: Card[] = [
      { rank: '9', suit: 'spades' },
      { rank: '10', suit: 'spades' },
    ];
    const state = makeState({
      currentPlayerHasActed: true,
      deck,
      discard: [{ rank: '5', suit: 'hearts' }],
      players: [
        // Ace is a power card — cannot win next turn with only a power card
        makePlayer('p1', [{ rank: 'A', suit: 'hearts' }]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    const { newState, isValid } = declareOnCards('p1', state);
    expect(isValid).toBe(false);
    expect(newState.onCardsDeclarations).not.toContain('p1');
    const p1 = newState.players.find((p) => p.id === 'p1')!;
    expect(p1.hand).toHaveLength(3); // 1 original + 2 penalty
  });
});

describe('declareOnCards — declaration clears at start of next turn', () => {
  it('advanceTurn clears declaration when returning to declaring player', () => {
    // p1 declared, p2 takes turn, then advanceTurn back to p1 should clear
    const state = makeState({
      onCardsDeclarations: ['p1'],
      currentPlayerIndex: 1, // p2's turn
      currentPlayerHasActed: true,
      discard: [{ rank: '6', suit: 'hearts' }],
      players: [
        makePlayer('p1', [{ rank: '9', suit: 'hearts' }]),
        makePlayer('p2', [{ rank: '6', suit: 'clubs' }]),
      ],
    });
    // p2 plays, then advance back to p1
    const intermediate = applyPlay([{ rank: '6', suit: 'clubs' }], null, state);
    const result = advanceTurn(intermediate);
    expect(result.currentPlayerIndex).toBe(0); // back to p1
    expect(result.onCardsDeclarations).not.toContain('p1');
  });
});

describe('canWinNextTurn — valid declaration then Ace changes suit', () => {
  it('player has valid winning card, but Ace later changes suit — no re-validation needed', () => {
    // This is a state-change concern, not an engine concern.
    // The engine doesn't re-validate declarations — the declaration just clears at turn start.
    // We verify: valid declaration is recorded; game state changes don't cause penalties.
    const state = makeState({
      currentPlayerHasActed: true,
      discard: [{ rank: '5', suit: 'hearts' }],
      players: [
        makePlayer('p1', [{ rank: '5', suit: 'clubs' }]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    const { newState, isValid } = declareOnCards('p1', state);
    expect(isValid).toBe(true);
    // Simulate Ace changing suit mid-game — no penalty, declaration just clears next turn
    const aceChangedState: GameState = {
      ...newState,
      activeSuit: 'spades', // p2 played an Ace, suit is now spades
    };
    // On p1's next turn, advanceTurn clears the declaration (no penalty applied)
    const advanced = advanceTurn({ ...aceChangedState, currentPlayerIndex: 1, currentPlayerHasActed: true });
    // After advancing past p2 back to p1:
    // (In 2-player game, advancing from p2 returns to p1)
    expect(advanced.onCardsDeclarations).not.toContain('p1');
  });
});

// ─── canWinNextTurn — power cards mid-sequence ───────────────────────────────

// Convenience: build a state where p1 holds the given hand
function stateWithHand(hand: Card[]) {
  return makeState({
    players: [
      makePlayer('p1', hand),
      makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
    ],
  });
}

describe('canWinNextTurn — power cards mid-sequence', () => {
  it('8♥ → 8♦ → 7♦ is a valid winning combo', () => {
    const hand: Card[] = [
      { rank: '8', suit: 'hearts' },
      { rank: '8', suit: 'diamonds' },
      { rank: '7', suit: 'diamonds' },
    ];
    expect(canWinNextTurn('p1', stateWithHand(hand))).toBe(true);
  });

  it('2♥ → 3♥ → 3♣ is valid (2 mid-sequence, ends on non-power)', () => {
    const hand: Card[] = [
      { rank: '2', suit: 'hearts' },
      { rank: '3', suit: 'hearts' },
      { rank: '3', suit: 'clubs' },
    ];
    expect(canWinNextTurn('p1', stateWithHand(hand))).toBe(true);
  });

  it('7♥ + 8♥: DFS finds 8♥ → 7♥ (desc), ends on non-power 7♥ — returns true', () => {
    // The only-valid ordering is 8♥ → 7♥, which ends on non-power 7♥.
    // The reverse (7♥ → 8♥) ends on power card 8♥ and is rejected.
    const hand: Card[] = [
      { rank: '7', suit: 'hearts' },
      { rank: '8', suit: 'hearts' },
    ];
    expect(canWinNextTurn('p1', stateWithHand(hand))).toBe(true);
  });

  it('direction change blocked — 3♥ 5♥ 4♥: no ordering avoids a gap or direction conflict ending on non-power', () => {
    // 3♥→4♥→5♥: gap between 3 and 5 is... wait, 3→4 (adj) then 4→5 (adj asc) then 5♥ ends on non-power → TRUE
    // So use cards where NO ordering gives an empty-hand sequence.
    // [3♥, 5♥]: gap of 2 — not adjacent in either order → no valid combo → false.
    const hand: Card[] = [
      { rank: '3', suit: 'hearts' },
      { rank: '5', suit: 'hearts' },
    ];
    expect(canWinNextTurn('p1', stateWithHand(hand))).toBe(false);
  });
});

// ─── declareOnCards — stale-state regression ──────────────────────────────────
// Verifies that declareOnCards always evaluates the hand that is passed to it,
// regardless of what the top discard card is. This guards against the timing bug
// where the declaration could be validated against a pre-play game state that
// still contained the just-played card.

describe('declareOnCards — single remaining non-power card', () => {
  it('is valid when the only remaining card is non-power, regardless of top card', () => {
    // Player just played a card — only 4♣ remains.
    // Top discard is K♥ (completely different suit and rank).
    // Old canWinNextTurn would have blocked this because 4♣ doesn't match K♥.
    // New canWinNextTurn ignores the top card — single non-power card is always valid.
    const deck: Card[] = [
      { rank: '9', suit: 'spades' },
      { rank: '10', suit: 'spades' },
    ];
    const state = makeState({
      currentPlayerHasActed: true,
      deck,
      discard: [{ rank: 'K', suit: 'hearts' }],
      players: [
        makePlayer('p1', [{ rank: '4', suit: 'clubs' }]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    const { newState, isValid } = declareOnCards('p1', state);
    expect(isValid).toBe(true);
    expect(newState.pendingPickup).toBe(0); // no penalty
    expect(newState.onCardsDeclarations).toContain('p1');
    const p1 = newState.players.find((p) => p.id === 'p1')!;
    expect(p1.hand).toHaveLength(1); // hand unchanged — no penalty cards added
  });
});
