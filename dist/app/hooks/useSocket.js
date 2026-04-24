"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSocket = useSocket;
const react_1 = require("react");
const socket_io_client_1 = require("socket.io-client");
const gameStore_1 = require("../store/gameStore");
const config_1 = require("../config");
function useSocket() {
    const { socket, setSocket, setGameState, setRoom, setRoomInfo, setError, setPendingTimeoutNotification, setConnectionState, connectionState, } = (0, gameStore_1.useGameStore)();
    (0, react_1.useEffect)(() => {
        // Only create the socket once — reuse if already connected
        const existing = gameStore_1.useGameStore.getState().socket;
        if (existing)
            return;
        const newSocket = (0, socket_io_client_1.io)(config_1.SERVER_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });
        setSocket(newSocket);
        // ── Connection state tracking ──────────────────────────────────────────────
        // 'connect' fires on initial connect AND after every successful reconnect.
        newSocket.on('connect', () => {
            gameStore_1.useGameStore.getState().setConnectionState('connected');
        });
        newSocket.on('disconnect', () => {
            gameStore_1.useGameStore.getState().setConnectionState('disconnected');
        });
        newSocket.on('connect_error', () => {
            gameStore_1.useGameStore.getState().setConnectionState('disconnected');
        });
        // Manager-level events for reconnection lifecycle (socket.io v4 API).
        newSocket.io.on('reconnect_attempt', () => {
            gameStore_1.useGameStore.getState().setConnectionState('reconnecting');
        });
        newSocket.io.on('reconnect', () => {
            // 'connect' will also fire, but emit room:rejoin here while the reconnect
            // context is clear — before 'connect' handlers run.
            const { roomId, myPlayerId } = gameStore_1.useGameStore.getState();
            if (roomId && myPlayerId) {
                newSocket.emit('room:rejoin', { roomId, playerId: myPlayerId });
            }
        });
        // ── Game events ────────────────────────────────────────────────────────────
        newSocket.on('game:state', ({ state }) => {
            setGameState(state);
        });
        newSocket.on('room:joined', ({ roomId, room }) => {
            const playerId = room.players.find((p) => p.socketId === newSocket.id)?.playerId ?? '';
            setRoom(roomId, playerId);
            setRoomInfo({
                id: room.id,
                players: room.players.map((p) => ({ playerId: p.playerId, name: p.name, colourHex: p.colourHex, avatarId: p.avatarId })),
                maxPlayers: room.maxPlayers,
                status: room.status,
                turnDuration: room.turnDuration,
            });
        });
        newSocket.on('room:updated', ({ room }) => {
            setRoomInfo({
                id: room.id,
                players: room.players.map((p) => ({ playerId: p.playerId, name: p.name, colourHex: p.colourHex, avatarId: p.avatarId })),
                maxPlayers: room.maxPlayers,
                status: room.status,
                turnDuration: room.turnDuration,
            });
        });
        newSocket.on('room:rejoined', () => {
            gameStore_1.useGameStore.getState().setPendingTimeoutNotification('Reconnected to game');
        });
        newSocket.on('game:error', ({ message }) => {
            setError(message);
        });
        newSocket.on('game:timeout', ({ playerName, strikesRemaining }) => {
            let text;
            if (strikesRemaining === 0) {
                text = `${playerName} was removed from the game`;
            }
            else if (strikesRemaining === 1) {
                text = `${playerName} ran out of time — 1 more timeout and they're removed!`;
            }
            else {
                text = `${playerName} ran out of time`;
            }
            setPendingTimeoutNotification(text);
        });
        newSocket.on('game:on-cards-declared', ({ playerName }) => {
            setPendingTimeoutNotification(`${playerName} is on cards!`);
        });
        newSocket.on('game:false-declaration', ({ cardsDrawn }) => {
            setPendingTimeoutNotification(`You're not on cards — ${cardsDrawn} cards added to your hand`);
        });
        newSocket.on('game:player-disconnected', ({ playerName }) => {
            setPendingTimeoutNotification(`${playerName} lost connection — waiting for them to return…`);
        });
        newSocket.on('game:reaction', ({ playerId, reactionId }) => {
            gameStore_1.useGameStore.getState().setPendingReaction({ playerId, reactionId });
        });
    }, []);
    function playCards(cards, declaredSuit) {
        const { socket: s, roomId } = gameStore_1.useGameStore.getState();
        s?.emit('game:play', { roomId, cards, declaredSuit });
    }
    function drawCard() {
        const { socket: s, roomId } = gameStore_1.useGameStore.getState();
        s?.emit('game:draw', { roomId });
    }
    function createRoom(maxPlayers = 4, userId, colourHex, avatarId, turnDuration = 30) {
        const { socket: s, playerName } = gameStore_1.useGameStore.getState();
        s?.emit('room:create', { maxPlayers, name: playerName, userId, colourHex, avatarId, turnDuration });
    }
    function joinRoom(roomId, userId, colourHex, avatarId) {
        const { socket: s, playerName } = gameStore_1.useGameStore.getState();
        s?.emit('room:join', { roomId, name: playerName, userId, colourHex, avatarId });
    }
    function startGame(roomId) {
        const { socket: s } = gameStore_1.useGameStore.getState();
        s?.emit('room:start', { roomId });
    }
    function declareSuit(suit) {
        const { socket: s, roomId } = gameStore_1.useGameStore.getState();
        s?.emit('game:declare-suit', { roomId, suit });
    }
    function declareOnCards() {
        const { socket: s, roomId } = gameStore_1.useGameStore.getState();
        s?.emit('game:declare-on-cards', { roomId });
    }
    function endTurn() {
        const { socket: s, roomId } = gameStore_1.useGameStore.getState();
        s?.emit('game:end-turn', { roomId });
    }
    return {
        playCards,
        drawCard,
        createRoom,
        joinRoom,
        startGame,
        declareSuit,
        declareOnCards,
        endTurn,
        connectionState,
    };
}
//# sourceMappingURL=useSocket.js.map