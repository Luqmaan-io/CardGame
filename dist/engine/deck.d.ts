import { Card, GameState } from './types';
export declare function createDeck(): Card[];
export declare function shuffleDeck(deck: Card[]): Card[];
export declare function dealCards(deck: Card[], playerCount: number, cardsEach: number): {
    hands: Card[][];
    remaining: Card[];
};
export declare function reshuffleDiscard(state: GameState): GameState;
//# sourceMappingURL=deck.d.ts.map