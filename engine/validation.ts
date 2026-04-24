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

  // Ace is always valid in a normal turn — it overrides suit/rank matching
  if (card.rank === 'A') return true;

  // Queen: player must hold a same-suit non-Queen card OR another Queen of any suit
  if (card.rank === 'Q') {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer) return false;
    const hasCover = currentPlayer.hand.some(
      (c) => c !== card && (c.rank === 'Q' || c.suit === card.suit)
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
 * Returns true if the player's hand contains a combo that empties it entirely
 * and ends on a non-power card. The current top discard card is deliberately
 * ignored — by the time it is this player's next turn, other players will have
 * played and the top card will be different.
 *
 * Queen rule: each Queen in the combo must be immediately followed by a card
 * of the same suit OR another Queen.
 */
export function canWinNextTurn(playerId: string, state: GameState): boolean {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.hand.length === 0) return false;
  return _hasWinningCombo(player.hand);
}

function _hasWinningCombo(hand: Card[]): boolean {
  for (let startIdx = 0; startIdx < hand.length; startIdx++) {
    const remaining = [...hand];
    const first = remaining.splice(startIdx, 1)[0]!;
    if (_findWinningSequence([first], remaining, null)) return true;
  }
  return false;
}

function _findWinningSequence(
  current: Card[],
  remaining: Card[],
  direction: 'asc' | 'desc' | null
): boolean {
  if (remaining.length === 0) {
    const lastCard = current[current.length - 1]!;
    if (isPowerCard(lastCard)) return false;
    return _validateQueenCovers(current);
  }

  const lastCard = current[current.length - 1]!;
  const pendingQueenSuit = _getPendingQueenSuit(current);

  for (let i = 0; i < remaining.length; i++) {
    const nextCard = remaining[i]!;
    if (!_canFollow(lastCard, nextCard, pendingQueenSuit, direction)) continue;

    // Update direction only on same-suit different-rank steps; same-rank is neutral
    let newDirection = direction;
    if (lastCard.suit === nextCard.suit && lastCard.rank !== nextCard.rank) {
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const diff = ranks.indexOf(nextCard.rank) - ranks.indexOf(lastCard.rank);
      newDirection = diff > 0 ? 'asc' : 'desc';
    }
    // If same rank (suit change), newDirection stays unchanged — direction is unaffected

    const newRemaining = [...remaining];
    newRemaining.splice(i, 1);
    if (_findWinningSequence([...current, nextCard], newRemaining, newDirection)) return true;
  }
  return false;
}

function _canFollow(
  prev: Card,
  next: Card,
  pendingQueenSuit: string | null,
  currentDirection: 'asc' | 'desc' | null
): boolean {
  if (pendingQueenSuit !== null) {
    return next.suit === pendingQueenSuit || next.rank === 'Q';
  }
  // Same rank — suit change, completely neutral with respect to direction
  if (prev.rank === next.rank) return true;
  // Same suit different rank — must be adjacent and direction-consistent
  if (prev.suit === next.suit) {
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const diff = ranks.indexOf(next.rank) - ranks.indexOf(prev.rank);
    if (Math.abs(diff) !== 1) return false;
    const moveDir = diff > 0 ? 'asc' : 'desc';
    if (currentDirection !== null && moveDir !== currentDirection) return false;
    return true;
  }
  return false;
}

function _getPendingQueenSuit(combo: Card[]): string | null {
  for (let i = combo.length - 1; i >= 0; i--) {
    if (combo[i]!.rank === 'Q') {
      if (i === combo.length - 1) return combo[i]!.suit;
      return null;
    }
  }
  return null;
}

function _validateQueenCovers(combo: Card[]): boolean {
  for (let i = 0; i < combo.length; i++) {
    if (combo[i]!.rank !== 'Q') continue;
    if (i === combo.length - 1) return false;
    const next = combo[i + 1]!;
    if (next.suit !== combo[i]!.suit && next.rank !== 'Q') return false;
  }
  return true;
}

export function isValidCombo(cards: Card[], state: GameState): boolean {
  if (cards.length === 0) return false;

  // Single card — delegate to isValidPlay
  if (cards.length === 1) {
    if (!isValidPlay(cards[0]!, state)) return false;
    // A single Queen is never a complete combo — it must be followed by a cover card
    if (cards[0]!.rank === 'Q') return false;
    return true;
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

    // Queen cover rule: another Queen of any suit OR a same-suit card covers the pending Queen
    if (needsCoverSuit !== null) {
      if (curr.rank !== 'Q' && curr.suit !== needsCoverSuit) return false;
      needsCoverSuit = null;
      // After the cover, direction resets — the cover card starts a new run
      direction = null;
      if (curr.rank === 'Q') {
        needsCoverSuit = curr.suit;
      }
      continue;
    }

    const isSameRank = curr.rank === prev.rank;
    const isSameSuit = curr.suit === prev.suit;

    // Matching rank — suit change, completely neutral with respect to direction
    if (isSameRank) {
      if (curr.rank === 'Q') {
        needsCoverSuit = curr.suit;
      }
      continue;
    }

    // Different rank — must match suit AND be adjacent (±1) in run direction
    if (!isSameSuit) return false;

    const prevIdx = rankIndex(prev.rank);
    const currIdx = rankIndex(curr.rank);
    const diff = currIdx - prevIdx;

    // K→A is a valid ascending step (same suit required, already checked above)
    // A→K is a valid descending step (same suit required, already checked above)
    const wrapsAsc = prev.rank === 'K' && curr.rank === 'A';
    const wrapsDesc = prev.rank === 'A' && curr.rank === 'K';

    if (diff === 1 || wrapsAsc) {
      // Ascending step — direction only set/checked on same-suit rank steps
      if (direction === 'desc') return false;
      direction = 'asc';
    } else if (diff === -1 || wrapsDesc) {
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
