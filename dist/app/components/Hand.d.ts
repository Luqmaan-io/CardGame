import React from 'react';
import type { Card as CardType } from '../../engine/types';
interface HandProps {
    cards: CardType[];
    validPlays: CardType[][];
    onCardSelect?: (card: CardType) => void;
    onClearSelection?: () => void;
    selectedCards?: CardType[];
    faceDown?: boolean;
    isMyTurn?: boolean;
    visibleCardCount?: number;
}
export declare function Hand({ cards, validPlays, onCardSelect, onClearSelection, selectedCards, faceDown, isMyTurn, visibleCardCount, }: HandProps): React.JSX.Element;
export {};
//# sourceMappingURL=Hand.d.ts.map