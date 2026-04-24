import React from 'react';
import type { Card as CardType } from '../../engine/types';
export interface AnimCardTask {
    id: string;
    card: CardType | null;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    delay: number;
    duration: number;
    onComplete?: () => void;
}
export interface AnimationOverlayHandle {
    addCards(tasks: AnimCardTask[]): void;
    clearAll(): void;
}
export declare const AnimationOverlay: React.ForwardRefExoticComponent<React.RefAttributes<AnimationOverlayHandle>>;
export declare function animId(): string;
//# sourceMappingURL=AnimationOverlay.d.ts.map