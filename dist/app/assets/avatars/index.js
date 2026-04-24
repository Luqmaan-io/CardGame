"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVATAR_LIST = exports.AVATAR_DATA = void 0;
// Re-export from avatarData — SVG file imports removed (broke web via transformer)
var avatarData_1 = require("./avatarData");
Object.defineProperty(exports, "AVATAR_DATA", { enumerable: true, get: function () { return avatarData_1.AVATAR_DATA; } });
const avatarData_2 = require("./avatarData");
// AVATAR_LIST for backwards-compat with any existing imports
exports.AVATAR_LIST = avatarData_2.AVATAR_DATA.map(({ id }) => ({ id }));
//# sourceMappingURL=index.js.map