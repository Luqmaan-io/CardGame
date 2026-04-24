"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerScene = registerScene;
exports.getScene = getScene;
exports.getAllScenes = getAllScenes;
const sceneRegistry = {};
function registerScene(scene) {
    sceneRegistry[scene.id] = scene;
}
function getScene(id) {
    return sceneRegistry[id] ?? sceneRegistry['midnight_rain'];
}
function getAllScenes() {
    return Object.values(sceneRegistry);
}
//# sourceMappingURL=sceneRegistry.js.map