"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const gameServer_1 = require("./gameServer");
const PORT = 3001;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
const httpServer = http_1.default.createServer(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
io.on('connection', (socket) => {
    console.log(`[+] Socket connected: ${socket.id}`);
    (0, gameServer_1.registerGameHandlers)(io, socket);
    socket.on('disconnect', () => {
        console.log(`[-] Socket disconnected: ${socket.id}`);
    });
});
httpServer.listen(PORT, () => {
    console.log(`Game server running on http://localhost:${PORT}`);
});
