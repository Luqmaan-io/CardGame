"use strict";
// Change DEV_SERVER to your machine's local IP when testing on a physical device.
// Run: ifconfig | grep "inet " | grep -v 127.0.0.1
// to find your current IP.
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER_URL = void 0;
const DEV_SERVER = 'http://192.168.55.52:3001';
const PROD_SERVER = 'https://your-server-url.com'; // placeholder
exports.SERVER_URL = __DEV__ ? DEV_SERVER : PROD_SERVER;
//# sourceMappingURL=config.js.map