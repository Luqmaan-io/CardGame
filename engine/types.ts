export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export interface Player {
  id: string;
  hand: Card[];
  isHuman: boolean;
  colourHex?: string;
  sceneId?: string;  // table scene, defaults to 'midnight_rain'
}

export type Direction = 'clockwise' | 'anticlockwise';
export type PendingPickupType = '2' | 'jack' | null;
export type GamePhase = 'play' | 'pickup' | 'cover' | 'declare-suit' | 'game-over';

export interface GameState {
  deck: Card[];
  discard: Card[];
  players: Player[];
  currentPlayerIndex: number;
  direction: Direction;
  activeSuit: Suit | null;
  pendingPickup: number;
  pendingPickupType: PendingPickupType;
  skipsRemaining: number;
  phase: GamePhase;
  winnerId: string | null;
  timerStartedAt: number | null;
  timeoutStrikes: Record<string, number>;
  sessionScores: Record<string, number>;
  onCardsDeclarations: string[];
  currentPlayerHasActed: boolean; // true after the current player has played or drawn this turn
}

export const POWER_CARDS: Rank[] = ['A', '2', '8', 'J', 'Q', 'K'];

export const BLACK_JACKS: Card[] = [
  { rank: 'J', suit: 'spades' },
  { rank: 'J', suit: 'clubs' },
];

export const RED_JACKS: Card[] = [
  { rank: 'J', suit: 'hearts' },
  { rank: 'J', suit: 'diamonds' },
];

export function isPowerCard(card: Card): boolean {
  return POWER_CARDS.includes(card.rank);
}

export function isBlackJack(card: Card): boolean {
  return card.rank === 'J' && (card.suit === 'spades' || card.suit === 'clubs');
}

export function isRedJack(card: Card): boolean {
  return card.rank === 'J' && (card.suit === 'hearts' || card.suit === 'diamonds');
}
