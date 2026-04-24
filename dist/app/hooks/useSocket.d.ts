import type { Card, Suit } from '../../engine/types';
export declare function useSocket(): {
    playCards: (cards: Card[], declaredSuit?: Suit) => void;
    drawCard: () => void;
    createRoom: (maxPlayers?: 2 | 3 | 4, userId?: string, colourHex?: string, avatarId?: string, turnDuration?: number) => void;
    joinRoom: (roomId: string, userId?: string, colourHex?: string, avatarId?: string) => void;
    startGame: (roomId: string) => void;
    declareSuit: (suit: Suit) => void;
    declareOnCards: () => void;
    endTurn: () => void;
    connectionState: import("../store/gameStore").ConnectionState;
};
//# sourceMappingURL=useSocket.d.ts.map