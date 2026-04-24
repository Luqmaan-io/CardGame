import React from 'react';
interface TurnTimerProps {
    timerStartedAt: number | null;
    turnDuration?: number;
    currentPlayerColourHex?: string;
    isMyTurn?: boolean;
    currentPlayerName?: string;
}
export declare function TurnTimer({ timerStartedAt, turnDuration, currentPlayerColourHex, isMyTurn, currentPlayerName, }: TurnTimerProps): React.JSX.Element;
export {};
//# sourceMappingURL=TurnTimer.d.ts.map