import React from 'react';
import type { Card as CardType } from '../../engine/types';
export type HistoryEntry = {
    playerId: string;
    playerName: string;
    playerColour: string;
    playerAvatarId: string;
    cards: CardType[];
    timestamp: number;
    action: 'play' | 'draw' | 'penalty';
};
interface GameHistoryPanelProps {
    history: HistoryEntry[];
}
export declare function GameHistoryPanel({ history }: GameHistoryPanelProps): React.JSX.Element | null;
export {};
//# sourceMappingURL=GameHistoryPanel.d.ts.map