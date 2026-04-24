import React, { MutableRefObject, RefObject } from 'react';
import { View } from 'react-native';
import type { GameState, Card as CardType } from '../../engine/types';
export type ViewAngle = 'bottom' | 'top' | 'left' | 'right';
export interface FloatingReaction {
    id: string;
    playerId: string;
    reactionId: string;
    emoji: string;
    startTime: number;
}
interface RoundTableProps {
    gameState: GameState;
    myPlayerId: string;
    onCardSelect: (card: CardType) => void;
    onPlay: () => void;
    onDraw: () => void;
    selectedCards: CardType[];
    validPlays: CardType[][];
    isMyTurn: boolean;
    isDealing: boolean;
    dealtCardCounts?: Record<string, number>;
    deckCountOverride?: number | null;
    connectionState: string;
    isAIThinking: boolean;
    onCardsActive: boolean;
    autoDrawCountdown: number | null;
    onCancelAutoDraw: () => void;
    timerStartedAt: number | null;
    currentPlayerColourHex?: string;
    currentPlayerName?: string;
    playerNames?: Record<string, string>;
    flashingPlayerId?: string | null;
    isReconnecting?: boolean;
    onReconnectTimeout?: () => void;
    drawPileRef?: RefObject<View>;
    discardPileRef?: RefObject<View>;
    humanHandRef?: RefObject<View>;
    opponentRefs?: MutableRefObject<Record<string, View | null>>;
    selectionDisabled?: boolean;
    message: string;
    messageColourHex?: string;
    hasPendingPickup: boolean;
    pendingPickupCount: number;
    turnDuration?: number;
    floatingReactions?: FloatingReaction[];
    onReact?: (reactionId: string) => void;
    viewAngle?: ViewAngle;
}
export declare function RoundTable({ gameState, myPlayerId, onCardSelect, onPlay, onDraw, selectedCards, validPlays, isMyTurn, isDealing, dealtCardCounts, deckCountOverride, isAIThinking, onCardsActive: _onCardsActive, autoDrawCountdown, onCancelAutoDraw, timerStartedAt, currentPlayerColourHex, currentPlayerName, playerNames, flashingPlayerId, isReconnecting, onReconnectTimeout, drawPileRef, discardPileRef, humanHandRef, opponentRefs, selectionDisabled, message, messageColourHex, hasPendingPickup, pendingPickupCount, turnDuration, floatingReactions, onReact, viewAngle, }: RoundTableProps): React.JSX.Element;
export {};
//# sourceMappingURL=RoundTable.d.ts.map