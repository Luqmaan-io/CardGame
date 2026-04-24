import { Animated } from 'react-native';
export declare function slideCard(animValue: Animated.ValueXY, from: {
    x: number;
    y: number;
}, to: {
    x: number;
    y: number;
}, duration: number): Promise<void>;
export declare function flipCard(animValue: Animated.Value, duration: number): Promise<void>;
export declare function bounceSettle(animValue: Animated.Value): Promise<void>;
export declare function cascadeDelay(index: number): number;
export declare function dealCard(animValue: Animated.ValueXY, deckPosition: {
    x: number;
    y: number;
}, playerPosition: {
    x: number;
    y: number;
}, index: number): Promise<void>;
export declare function flashOpacity(animValue: Animated.Value, fromOpacity: number, toOpacity: number, cycleDuration: number, cycles: number): Promise<void>;
export declare function shakeX(animValue: Animated.Value): Promise<void>;
export interface GamePositions {
    deck: {
        x: number;
        y: number;
    };
    discard: {
        x: number;
        y: number;
    };
    myHand: {
        x: number;
        y: number;
    };
    opponent: (index: number, total: number) => {
        x: number;
        y: number;
    };
}
export declare function getGamePositions(screenWidth: number, screenHeight: number): GamePositions;
//# sourceMappingURL=animations.d.ts.map