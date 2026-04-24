import { RefObject } from 'react';
import { View } from 'react-native';
export type ScreenPosition = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export declare function measurePosition(ref: RefObject<View>): Promise<ScreenPosition>;
export declare function centreOf(pos: ScreenPosition): {
    x: number;
    y: number;
};
//# sourceMappingURL=measurePosition.d.ts.map