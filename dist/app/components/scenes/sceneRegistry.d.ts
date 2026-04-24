import type { FC } from 'react';
export type SceneProps = {
    width: number;
    height: number;
    isCurrentTurn: boolean;
    timerPercent: number;
};
export type Scene = {
    id: string;
    name: string;
    description: string;
    rarity: 'default' | 'standard' | 'premium' | 'limited' | 'milestone';
    price?: number;
    milestoneRequirement?: {
        type: 'wins' | 'games';
        count: number;
    };
    component: FC<SceneProps>;
};
export declare function registerScene(scene: Scene): void;
export declare function getScene(id: string): Scene | undefined;
export declare function getAllScenes(): Scene[];
//# sourceMappingURL=sceneRegistry.d.ts.map