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

  it('returns false when two cards form a valid combo but last card IS a power card', () => {
    // 5♥ → 5♠... 5♠ is a power card? No. Let's use 5♥ → 2♥ (ascending, same suit)
    // Actually 5→2 is not adjacent. Use A♣ (matches rank A) then... hmm.
    // Use: discard=5♥, hand=[5♣, 2♣] — 5♣ matches rank, 2♣ same suit ascending? 5→2 is desc by rank.
    // Simpler: discard=K♥, hand=[K♣, 2♣] — K♣ matches rank K, then 2♣ is rank change diff>1
    // Use: discard=2♥, hand=[2♣, 3♣] — 2♣ matches rank, 3♣ ascending — but 2 is power card first
    // Best: discard=9♥, hand=[9♣, 2♣] — 9♣ matches rank, 2♣... rank change 9→2 not adjacent.
    // Let's use: hand=[7♥, 2♥] where discard=7♣. 7♥ matches rank. 2♥ same suit ascending? 7→2 desc.
    // Combo: 7♥ 2♥ — descending same suit (adjacent? 7→2 is diff=5, not adjacent) — INVALID.
    // Use: hand=[7♥, 8♥] where discard=7♣. 7♥ matches rank, 8♥ ascending same suit (diff=1).
    // Last card 8♥ is a power card. Combo valid. canWinNextTurn should return false.
    const state = makeState({
      discard: [{ rank: '7', suit: 'clubs' }],
      players: [
        makePlayer('p1', [
          { rank: '7', suit: 'hearts' },
          { rank: '8', suit: 'hearts' },
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

  it('returns false when player has cards but none valid to play next turn', () => {
    // Discard 5♥, active suit = spades — player only has clubs cards
    const state = makeState({
      discard: [{ rank: 'A', suit: 'hearts' }],
      activeSuit: 'spades',
      players: [
        makePlayer('p1', [{ rank: '7', suit: 'clubs' }]),
        makePlayer('p2', [{ rank: '3', suit: 'clubs' }]),
      ],
    });
    expect(canWinNextTurn('p1', state)).toBe(false);
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
