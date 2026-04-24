export type GameResult = {
    userId: string;
    isGuest: boolean;
    placement: number;
    turnsPlayed: number;
    maxCardsHeld: number;
    cardsDrawn: number;
    biggestPickup: number;
    blackJacksReceived: number;
    blackJacksCountered: number;
    twosStacked: number;
    twosReceived: number;
    falseOnCardsCount: number;
    correctOnCardsCount: number;
    timedOutCount: number;
    wasKicked: boolean;
    opponentId?: string;
    opponentUsername?: string;
    suitWonWith?: string;
};
export declare function recordGameStats(result: GameResult): Promise<void>;
//# sourceMappingURL=recordGameStats.d.ts.map