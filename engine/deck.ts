import { Card, GameState, Rank, Suit } from './types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j] as Card;
    result[j] = temp as Card;
  }
  return result;
}

export function dealCards(
  deck: Card[],
  playerCount: number,
  cardsEach: number
): { hands: Card[][]; remaining: Card[] } {
  const totalNeeded = playerCount * cardsEach;
  if (deck.length < totalNeeded) {
    throw new Error(
      `Not enough cards to deal. Need ${totalNeeded}, have ${deck.length}.`
    );
  }

  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  const remaining = [...deck];

  for (let i = 0; i < cardsEach; i++) {
    for (let p = 0; p < playerCount; p++) {
      const card = remaining.shift();
      if (card !== undefined) {
        hands[p]!.push(card);
      }
    }
  }

  return { hands, remaining };
}

export function reshuffleDiscard(state: GameState): GameState {
  if (state.discard.length <= 1) {
    // Nothing to reshuffle — keep as-is
    return state;
  }

  const topCard = state.discard[state.discard.length - 1] as Card;
  const cardsToShuffle = state.discard.slice(0, state.discard.length - 1);
  const newDeck = shuffleDeck(cardsToShuffle);

  return {
    ...state,
    deck: [...state.deck, ...newDeck],
    discard: [topCard],
  };
}
