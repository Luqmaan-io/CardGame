"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneRenderer = SceneRenderer;
const react_1 = __importDefault(require("react"));
const HolographicOverlay_1 = require("./HolographicOverlay");
const sceneRegistry_1 = require("./sceneRegistry");
// Import scenes here to ensure they are registered as a side effect
require("./MidnightRain");
function SceneRenderer({ sceneId, sliceWidth, sliceHeight, isCurrentPlayer, timerPercent, }) {
    const scene = (0, sceneRegistry_1.getScene)(sceneId);
    if (!scene)
        return null;
    const SceneComponent = scene.component;
    return (<HolographicOverlay_1.HolographicOverlay width={sliceWidth} height={sliceHeight} timerPercent={timerPercent} isCurrentTurn={isCurrentPlayer}>
      <SceneComponent width={sliceWidth} height={sliceHeight} isCurrentTurn={isCurrentPlayer} timerPercent={timerPercent}/>
    </HolographicOverlay_1.HolographicOverlay>);
}
//# sourceMappingURL=SceneRenderer.js.map