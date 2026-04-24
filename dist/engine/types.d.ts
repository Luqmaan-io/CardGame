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
    sceneId?: string;
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
    currentPlayerHasActed: boolean;
    placements: {
        playerId: string;
        place: number;
    }[];
}
export declare const POWER_CARDS: Rank[];
export declare const BLACK_JACKS: Card[];
export declare const RED_JACKS: Card[];
export declare function isPowerCard(card: Card): boolean;
export declare function isBlackJack(card: Card): boolean;
export declare function isRedJack(card: Card): boolean;
//# sourceMappingURL=types.d.ts.map