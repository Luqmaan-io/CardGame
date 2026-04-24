"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.measurePosition = measurePosition;
exports.centreOf = centreOf;
function measurePosition(ref) {
    return new Promise((resolve, reject) => {
        if (!ref.current) {
            reject(new Error('ref not mounted'));
            return;
        }
        ref.current.measureInWindow((x, y, width, height) => {
            resolve({ x, y, width, height });
        });
    });
}
function centreOf(pos) {
    return {
        x: pos.x + pos.width / 2,
        y: pos.y + pos.height / 2,
    };
}
//# sourceMappingURL=measurePosition.js.map