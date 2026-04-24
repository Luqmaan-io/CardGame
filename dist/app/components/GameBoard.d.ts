import React, { MutableRefObject, RefObject } from 'react';
import { View } from 'react-native';
import type { GameState, Card as CardType } from '../../engine/types';
interface GameBoardProps {
    gameState: GameState | null | undefined;
    myPlayerId: string;
    validPlays: CardType[][];
    selectedCards: CardType[];
    onCardSelect: (card: CardType) => void;
    onClearSelection?: () => void;
    isMyTurn: boolean;
    selectionDisabled?: boolean;
    playerNames?: Record<string, string>;
    message: string;
    flashingPlayerId?: string | null;
    isDealing?: boolean;
    dealtCardCounts?: Record<string, number>;
    deckCountOverride?: number | null;
    drawPileRef?: RefObject<View>;
    discardPileRef?: RefObject<View>;
    humanHandRef?: RefObject<View>;
    opponentRefs?: MutableRefObject<Record<string, View | null>>;
    isReconnecting?: boolean;
    onReconnectTimeout?: () => void;
    messageColourHex?: string;
}
export declare function GameBoard({ gameState, myPlayerId, validPlays, selectedCards, onCardSelect, onClearSelection, isMyTurn, selectionDisabled, playerNames, message, flashingPlayerId, isDealing, dealtCardCounts, deckCountOverride, drawPileRef, discardPileRef, humanHandRef, opponentRefs, isReconnecting, onReconnectTimeout, messageColourHex, }: GameBoardProps): React.JSX.Element;
export {};
//# sourceMappingURL=GameBoard.d.ts.map