import React from 'react';
import { HolographicOverlay } from './HolographicOverlay';
import { getScene } from './sceneRegistry';

// Import scenes here to ensure they are registered as a side effect
import './MidnightRain';

type SceneRendererProps = {
  sceneId: string;
  playerAngle: number;       // angle in degrees of this player's position around table
  sliceWidth: number;        // width of this player's table slice in pixels
  sliceHeight: number;       // height of this player's table slice in pixels
  isCurrentPlayer: boolean;  // pulse more urgently when it's their turn
  timerPercent: number;      // 0–100, drives hologram flicker urgency
};

export function SceneRenderer({
  sceneId,
  sliceWidth,
  sliceHeight,
  isCurrentPlayer,
  timerPercent,
}: SceneRendererProps) {
  const scene = getScene(sceneId);
  if (!scene) return null;

  const SceneComponent = scene.component;

  return (
    <HolographicOverlay
      width={sliceWidth}
      height={sliceHeight}
      timerPercent={timerPercent}
      isCurrentTurn={isCurrentPlayer}
    >
      <SceneComponent
        width={sliceWidth}
        height={sliceHeight}
        isCurrentTurn={isCurrentPlayer}
        timerPercent={timerPercent}
      />
    </HolographicOverlay>
  );
}
