import React from 'react';
import type { Card as CardType } from '../../engine/types';
interface CardProps {
    card: CardType;
    onPress?: () => void;
    isSelected?: boolean;
    isValid?: boolean;
    faceDown?: boolean;
    isDisabled?: boolean;
    width?: number;
    height?: number;
}
export declare function CardBack({ width, height }: {
    width?: number;
    height?: number;
}): React.JSX.Element;
export declare function Card({ card, onPress, isSelected, isValid, faceDown, isDisabled, width, height, }: CardProps): React.JSX.Element;
export {};
//# sourceMappingURL=Card.d.ts.map