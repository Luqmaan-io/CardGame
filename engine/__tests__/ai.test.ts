import { getValidPlays, pickAIMove } from '../ai';
import { Card, GameState, Player } from '../types';

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
    ...overrides,
  };
}

describe('getValidPlays', () => {
  it('returns empty array when no valid plays', () => {
    const hand: Card[] = [{ rank: '7', suit: 'clubs' }];
    const state = makeState({
      discard: [{ rank: '5', suit: 'hearts' }],
      players: [makePlayer('p1', hand)],
    });
    expect(getValidPlays(state)).toHaveLength(0);
  });

  it('returns valid single cards', () => {
    const hand: Card[] = [
      { rank: '5', suit: 'clubs' }, // matches rank
      { rank: '7', suit: 'clubs' }, // no match
    ];
    const state = makeState({
      discard: [{ rank: '5', suit: 'hearts' }],
      players: [makePlayer('p1', hand)],
    });
    const plays = getValidPlays(state);
    expect(plays.some((p) => p.length === 1 && p[0]!.rank === '5')).toBe(true);
    expect(plays.every((p) => !(p.length === 1 && p[0]!.rank === '7'))).toBe(true);
  });

  it('returns combos when available', () => {
    const hand: Card[] = [
      { rank: '5', suit: 'hearts' },
      { rank: '6', suit: 'hearts' },
    ];
    const state = makeState({
      discard: [{ rank: '5', suit: 'clubs' }],
      players: [makePlayer('p1', hand)],
    });
    const plays = getValidPlays(state);
    expect(plays.some((p) => p.length === 2)).toBe(true);
  });
});

describe('pickAIMove', () => {
  it('returns "draw" when no valid plays', () => {
    const hand: Card[] = [{ rank: '7', suit: 'clubs' }];
    const state = makeState({
      discard: [{ rank: '5', suit: 'hearts' }],
      players: [makePlayer('p1', hand)],
    });
    expect(pickAIMove(state)).toBe('draw');
  });

  it('prefers longer combos', () => {
    const hand: Card[] = [
      { rank: '5', suit: 'hearts' },
      { rank: '6', suit: 'hearts' },
    ];
    const state = makeState({
      discard: [{ rank: '5', suit: 'clubs' }],
      players: [makePlayer('p1', hand)],
    });
    const move = pickAIMove(state);
    expect(Array.isArray(move)).toBe(true);
    expect((move as Card[]).length).toBeGreaterThanOrEqual(1);
  });

  it('returns a single valid card when only one available', () => {
    const hand: Card[] = [{ rank: '5', suit: 'clubs' }];
    const state = makeState({
      discard: [{ rank: '5', suit: 'hearts' }],
      players: [makePlayer('p1', hand)],
    });
    const move = pickAIMove(state);
    expect(move).toEqual([{ rank: '5', suit: 'clubs' }]);
  });
});
