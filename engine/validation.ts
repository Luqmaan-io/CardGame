import { Card, GameState, Rank, Suit } from './types';
import { isBlackJack, isRedJack, isPowerCard } from './types';

const RANK_ORDER: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function rankIndex(rank: Rank): number {
  return RANK_ORDER.indexOf(rank);
}

function getTopDiscard(state: GameState): Card | null {
  return state.discard.length > 0
    ? (state.discard[state.discard.length - 1] ?? null)
    : null;
}

function getEffectiveSuit(state: GameState): Suit | null {
  const top = getTopDiscard(state);
  if (state.activeSuit !== null) return state.activeSuit;
  return top ? top.suit : null;
}

export function isValidPlay(card: Card, state: GameState): boolean {
  const top = getTopDiscard(state);
  if (!top) return true; // empty discard — anything goes

  const { pendingPickupType, skipsRemaining } = state;

  // Under a 2-stack: only a 2 can be played
  if (pendingPickupType === '2') {
    return card.rank === '2';
  }

  // Under a black Jack penalty: only a black Jack or red Jack can be played
  if (pendingPickupType === 'jack') {
    return isBlackJack(card) || isRedJack(card);
  }

  // Under a skip: only an 8 can redirect it
  if (skipsRemaining > 0) {
    return card.rank === '8';
  }

  // Queen: player must also hold a same-suit cover card (can't be the Queen itself)
  if (card.rank === 'Q') {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer) return false;
    const hasCover = currentPlayer.hand.some(
      (c) => c.suit === card.suit && c !== card && c.rank !== 'Q'
    );
    if (!hasCover) return false;
  }

  // Red Jack played normally (no black Jack penalty active): normal suit/rank rules only
  // (Red Jack has no special effect outside a black Jack penalty)

  const effectiveSuit = getEffectiveSuit(state);

  // Match suit (or active suit declared by Ace) OR match rank
  if (effectiveSuit !== null && card.suit === effectiveSuit) return true;
  if (card.rank === top.rank) return true;

  return false;
}

/**
 * Returns true if the player has at least one valid combo that would empty
 * their hand entirely AND whose last card is not a power card.
 *
 * Queen edge case: if a Queen appears in the winning combo, the card immediately
 * after it in the combo must be same-suit and NOT a power card.
 */
export function canWinNextTurn(playerId: string, state: GameState): boolean {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.hand.length === 0) return false;

  const hand = player.hand;
  const targetLength = hand.length;

  // Build the player state as-if it's their turn (same state, just checking for combos)
  const checkState: GameState = { ...state, currentPlayerIndex: state.players.indexOf(player) };

  // DFS to find a combo that empties the hand and ends on a non-power card
  function dfs(current: Card[], remaining: Card[]): boolean {
    // Check if this combo empties the hand and ends on a non-power card
    if (current.length === targetLength) {
      const lastCard = current[current.length - 1]!;
      if (isPowerCard(lastCard)) return false;
      // Queen edge case: verify no Queen in combo has a power-card cover
      // isValidCombo already enforces Queen coverage, so we just need to ensure
      // no power card immediately follows a Queen in the combo
      for (let i = 0; i < current.length - 1; i++) {
        if (current[i]!.rank === 'Q') {
          const cover = current[i + 1]!;
          if (isPowerCard(cover)) return false;
        }
      }
      return true;
    }

    for (let i = 0; i < remaining.length; i++) {
      const candidate = [...current, remaining[i]!];
      if (isValidCombo(candidate, checkState)) {
        const next = remaining.filter((_, idx) => idx !== i);
        if (dfs(candidate, next)) return true;
      }
    }
    return false;
  }

  // Try starting from each card that is valid as a first play
  for (let i = 0; i < hand.length; i++) {
    if (isValidPlay(hand[i]!, checkState)) {
      const remaining = hand.filter((_, idx) => idx !== i);
      if (dfs([hand[i]!], remaining)) return true;
    }
  }

  return false;
}

export function isValidCombo(cards: Card[], state: GameState): boolean {
  if (cards.length === 0) return false;

  // Single card — delegate to isValidPlay
  if (cards.length === 1) {
    return isValidPlay(cards[0]!, state);
  }

  // First card must be valid to play
  if (!isValidPlay(cards[0]!, state)) return false;

  // Track combo direction: null until first rank change detected
  let direction: 'asc' | 'desc' | null = null;
  // Track whether the previous card was a Queen (needing same-suit cover).
  // Initialise for the first card if it is a Queen.
  let needsCoverSuit: Suit | null = cards[0]!.rank === 'Q' ? cards[0]!.suit : null;

  for (let i = 1; i < cards.length; i++) {
    const prev = cards[i - 1]!;
    const curr = cards[i]!;

    // Queen cover rule: the card immediately after a Queen must be the same suit
    if (needsCoverSuit !== null) {
      if (curr.suit !== needsCoverSuit) return false;
      needsCoverSuit = null;
      // After the cover card, direction can continue — no rank adjacency needed here
      // (the Queen breaks the run; the cover restarts it)
      // Reset direction since the cover card may start a new run direction
      direction = null;
      if (curr.rank === 'Q') {
        needsCoverSuit = curr.suit;
      }
      continue;
    }

    // Matching rank — suit change, no rank step needed
    if (curr.rank === prev.rank) {
      // Valid connection; direction is unchanged (rank match doesn't advance the run)
      if (curr.rank === 'Q') {
        needsCoverSuit = curr.suit;
      }
      continue;
    }

    // Different rank — must match suit AND be adjacent (±1) in run direction
    if (curr.suit !== prev.suit) return false;

    const prevIdx = rankIndex(prev.rank);
    const currIdx = rankIndex(curr.rank);
    const diff = currIdx - prevIdx;

    if (diff === 1) {
      // Ascending step
      if (direction === 'desc') return false;
      direction = 'asc';
    } else if (diff === -1) {
      // Descending step
      if (direction === 'asc') return false;
      direction = 'desc';
    } else {
      // Not adjacent
      return false;
    }

    if (curr.rank === 'Q') {
      needsCoverSuit = curr.suit;
    }
  }

  // If combo ended mid-Queen (last card is Queen with no cover), invalid
  if (needsCoverSuit !== null) return false;

  return true;
}
