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
    if (_findWinningSequence([first], remaining)) return true;
  }
  return false;
}

function _findWinningSequence(
  current: Card[],
  remaining: Card[]
): boolean {
  if (remaining.length === 0) {
    const lastCard = current[current.length - 1]!;
    // Single Queen alone — not a winning sequence (forces a penalty draw)
    if (current.length === 1 && lastCard.rank === 'Q') return false;
    if (isPowerCard(lastCard)) return false;
    return _validateQueenCovers(current);
  }

  const lastCard = current[current.length - 1]!;
  const pendingQueenSuit = _getPendingQueenSuit(current);

  for (let i = 0; i < remaining.length; i++) {
    const nextCard = remaining[i]!;
    if (!_canFollow(lastCard, nextCard, pendingQueenSuit)) continue;

    const newRemaining = [...remaining];
    newRemaining.splice(i, 1);
    if (_findWinningSequence([...current, nextCard], newRemaining)) return true;
  }
  return false;
}

function _canFollow(
  prev: Card,
  next: Card,
  pendingQueenSuit: string | null
): boolean {
  if (pendingQueenSuit !== null) {
    return next.suit === pendingQueenSuit || next.rank === 'Q';
  }
  // Same rank — suit change, direction-neutral
  if (prev.rank === next.rank) return true;
  // Same suit different rank — must be adjacent (±1), any direction; K↔A wrap allowed
  if (prev.suit === next.suit) {
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const diff = Math.abs(ranks.indexOf(next.rank) - ranks.indexOf(prev.rank));
    const wraps = (prev.rank === 'K' && next.rank === 'A') || (prev.rank === 'A' && next.rank === 'K');
    return diff === 1 || wraps;
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
  // A single Queen is a valid combo — the solo Queen penalty (draw 1) is applied
  // in applyPlay, not here.
  if (cards.length === 1) {
    if (!isValidPlay(cards[0]!, state)) return false;
    return true;
  }

  // First card must be valid to play
  if (!isValidPlay(cards[0]!, state)) return false;

  // Track whether the previous card was a Queen (needing same-suit cover).
  let needsCoverSuit: Suit | null = cards[0]!.rank === 'Q' ? cards[0]!.suit : null;

  for (let i = 1; i < cards.length; i++) {
    const prev = cards[i - 1]!;
    const curr = cards[i]!;

    // Queen cover rule: another Queen of any suit OR a same-suit card covers the pending Queen
    if (needsCoverSuit !== null) {
      if (curr.rank !== 'Q' && curr.suit !== needsCoverSuit) return false;
      needsCoverSuit = curr.rank === 'Q' ? curr.suit : null;
      continue;
    }

    const isSameRank = curr.rank === prev.rank;
    const isSameSuit = curr.suit === prev.suit;

    // Matching rank — suit change, direction-neutral
    if (isSameRank) {
      if (curr.rank === 'Q') {
        needsCoverSuit = curr.suit;
      }
      continue;
    }

    // Different rank — must match suit AND be adjacent (±1), any direction
    if (!isSameSuit) return false;

    const diff = Math.abs(rankIndex(curr.rank) - rankIndex(prev.rank));
    const wraps = (prev.rank === 'K' && curr.rank === 'A') || (prev.rank === 'A' && curr.rank === 'K');
    if (diff !== 1 && !wraps) return false;

    if (curr.rank === 'Q') {
      needsCoverSuit = curr.suit;
    }
  }

  // If combo ended mid-Queen (last card is Queen with no cover), invalid
  if (needsCoverSuit !== null) return false;

  return true;
}
