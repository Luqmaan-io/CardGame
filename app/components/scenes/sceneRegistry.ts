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
  price?: number;           // in pence — undefined for free/milestone scenes
  milestoneRequirement?: { type: 'wins' | 'games'; count: number };
  component: FC<SceneProps>;
};

const sceneRegistry: Record<string, Scene> = {};

export function registerScene(scene: Scene): void {
  sceneRegistry[scene.id] = scene;
}

export function getScene(id: string): Scene | undefined {
  return sceneRegistry[id] ?? sceneRegistry['midnight_rain'];
}

export function getAllScenes(): Scene[] {
  return Object.values(sceneRegistry);
}
