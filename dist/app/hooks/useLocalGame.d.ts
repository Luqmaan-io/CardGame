import type { Card, GameState, Suit } from '../../engine/types';
export interface LocalGameParams {
    playerName: string;
    aiCount: number;
}
export declare function useLocalGame(): {
    gameState: GameState | null;
    myPlayerId: string;
    isAIThinking: boolean;
    playerNames: Record<string, string>;
    turnStartedAt: number | null;
    turnDurationRef: import("react").MutableRefObject<number>;
    startLocalGame: (playerName: string, aiCount: number, humanAvatarId?: string, turnDuration?: number) => void;
    humanPlay: (cards: Card[], declaredSuit?: Suit) => void;
    humanDraw: () => void;
    humanEndTurn: () => void;
    humanDeclareOnCards: () => boolean;
    humanApplyTimeout: () => void;
    adjustTurnStartedAt: (msToAdd: number) => void;
    lastAIPlayCardsRef: import("react").MutableRefObject<Card[]>;
    localGameStateRef: import("react").MutableRefObject<GameState | null>;
};
//# sourceMappingURL=useLocalGame.d.ts.map