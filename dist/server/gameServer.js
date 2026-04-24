"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGameHandlers = registerGameHandlers;
const deck_1 = require("../engine/deck");
const validation_1 = require("../engine/validation");
const state_1 = require("../engine/state");
const roomManager_1 = require("./roomManager");
// ─── Server-side turn timer ───────────────────────────────────────────────────
const roomTimers = new Map();
function clearTurnTimer(roomId) {
    const existing = roomTimers.get(roomId);
    if (existing) {
        clearTimeout(existing);
        roomTimers.delete(roomId);
    }
}
function startTurnTimer(roomId, io) {
    clearTurnTimer(roomId);
    const room = (0, roomManager_1.getRoom)(roomId);
    const duration = room?.turnDuration ?? 30;
    if (duration === 0)
        return; // no limit — don't start timer
    const timer = setTimeout(() => handleTimeout(roomId, io), duration * 1000);
    roomTimers.set(roomId, timer);
}
function handleTimeout(roomId, io) {
    roomTimers.delete(roomId);
    const room = (0, roomManager_1.getRoom)(roomId);
    if (!room || !room.state)
        return;
    const currentPlayer = room.state.players[room.state.currentPlayerIndex];
    if (!currentPlayer)
        return;
    const currentStrikes = room.state.timeoutStrikes[currentPlayer.id] ?? 0;
    const newStrikes = currentStrikes + 1;
    const strikesRemaining = Math.max(0, 3 - newStrikes);
    const roomPlayer = room.players.find((p) => p.playerId === currentPlayer.id);
    const playerName = roomPlayer?.name ?? currentPlayer.id.slice(0, 8);
    io.to(roomId).emit('game:timeout', { playerId: currentPlayer.id, playerName, strikesRemaining });
    const newState = (0, state_1.applyTimeout)(room.state);
    const timedState = newState.phase === 'game-over' ? newState : withTimer(newState);
    const updated = {
        ...room,
        state: timedState,
        status: timedState.phase === 'game-over' ? 'finished' : 'playing',
    };
    (0, roomManager_1.updateRoom)(updated);
    io.to(roomId).emit('game:state', { state: timedState });
    if (timedState.phase !== 'game-over') {
        startTurnTimer(roomId, io);
    }
}
function withTimer(state) {
    if (state.phase === 'game-over')
        return state;
    return { ...state, timerStartedAt: Date.now() };
}
function initGameState(room) {
    const deck = (0, deck_1.shuffleDeck)((0, deck_1.createDeck)());
    const playerIds = room.players.map((p) => p.playerId);
    const { hands, remaining } = (0, deck_1.dealCards)(deck, playerIds.length, 7);
    const players = room.players.map((p, i) => ({
        id: p.playerId,
        hand: hands[i] ?? [],
        isHuman: true,
        colourHex: p.colourHex,
        avatarId: p.avatarId,
    }));
    const startCard = remaining[0];
    const drawPile = remaining.slice(1);
    return {
        deck: drawPile,
        discard: [startCard],
        players,
        currentPlayerIndex: 0,
        direction: 'clockwise',
        activeSuit: null,
        pendingPickup: 0,
        pendingPickupType: null,
        skipsRemaining: 0,
        phase: 'play',
        winnerId: null,
        timerStartedAt: null,
        timeoutStrikes: {},
        sessionScores: {},
        onCardsDeclarations: [],
        currentPlayerHasActed: false,
        placements: [],
    };
}
function getPlayerName(playerId, room) {
    return room.players.find((p) => p.playerId === playerId)?.name ?? playerId.slice(0, 8);
}
function registerGameHandlers(io, socket) {
    // room:create — { maxPlayers: 2 | 3 | 4, name, userId?, colourHex?, avatarId?, turnDuration? }
    socket.on('room:create', (data) => {
        const maxPlayers = data.maxPlayers ?? 4;
        const name = data.name ?? 'Player';
        const turnDuration = data.turnDuration ?? 30;
        const room = (0, roomManager_1.createRoom)(maxPlayers, turnDuration);
        const joined = (0, roomManager_1.joinRoom)(room.id, socket.id, name, data.userId, data.colourHex, data.avatarId);
        if (joined instanceof Error) {
            socket.emit('game:error', { message: joined.message });
            return;
        }
        socket.join(room.id);
        socket.emit('room:joined', { roomId: joined.id, room: { ...joined, turnDuration: joined.turnDuration } });
    });
    // room:join — { roomId, name, userId?, colourHex?, avatarId? }
    socket.on('room:join', (data) => {
        const result = (0, roomManager_1.joinRoom)(data.roomId, socket.id, data.name, data.userId, data.colourHex, data.avatarId);
        if (result instanceof Error) {
            socket.emit('game:error', { message: result.message });
            return;
        }
        socket.join(data.roomId);
        socket.emit('room:joined', { roomId: result.id, room: { ...result, turnDuration: result.turnDuration } });
        socket.to(data.roomId).emit('room:updated', { room: { ...result, turnDuration: result.turnDuration } });
    });
    // room:start — host triggers game start
    socket.on('room:start', (data) => {
        const room = (0, roomManager_1.getRoom)(data.roomId);
        if (!room) {
            socket.emit('game:error', { message: 'Room not found' });
            return;
        }
        if (room.players.length < 2) {
            socket.emit('game:error', { message: 'Need at least 2 players to start' });
            return;
        }
        const state = initGameState(room);
        const timedState = withTimer(state);
        const updated = { ...room, state: timedState, status: 'playing' };
        (0, roomManager_1.updateRoom)(updated);
        io.to(data.roomId).emit('game:state', { state: timedState });
        startTurnTimer(data.roomId, io);
    });
    // game:play — { roomId, cards: Card[], declaredSuit?: Suit }
    // After applyPlay, the turn stays on the current player (currentPlayerHasActed: true).
    // The client must send game:end-turn to advance (or game:declare-on-cards which also advances).
    socket.on('game:play', (data) => {
        const room = (0, roomManager_1.getRoom)(data.roomId);
        if (!room || !room.state) {
            socket.emit('game:error', { message: 'No active game in room' });
            return;
        }
        const currentPlayer = room.state.players[room.state.currentPlayerIndex];
        const roomPlayer = room.players.find((p) => p.socketId === socket.id);
        if (!roomPlayer || currentPlayer?.id !== roomPlayer.playerId) {
            socket.emit('game:error', { message: 'Not your turn' });
            return;
        }
        if (!(0, validation_1.isValidCombo)(data.cards, room.state)) {
            socket.emit('game:error', { message: 'Invalid move' });
            return;
        }
        try {
            clearTurnTimer(data.roomId);
            const playedState = (0, state_1.applyPlay)(data.cards, data.declaredSuit ?? null, room.state);
            if (playedState.phase === 'game-over') {
                const updated = { ...room, state: playedState, status: 'finished' };
                (0, roomManager_1.updateRoom)(updated);
                io.to(data.roomId).emit('game:state', { state: playedState });
                return;
            }
            // Broadcast intermediate state — player still active, currentPlayerHasActed: true
            // Client will show "I'm on cards" and "End Turn" buttons
            const updated = { ...room, state: playedState };
            (0, roomManager_1.updateRoom)(updated);
            io.to(data.roomId).emit('game:state', { state: playedState });
            // Start a short declaration window timer (30s — if player doesn't end turn, timeout fires)
            startTurnTimer(data.roomId, io);
        }
        catch (err) {
            socket.emit('game:error', { message: err.message });
        }
    });
    // game:draw — { roomId }
    socket.on('game:draw', (data) => {
        const room = (0, roomManager_1.getRoom)(data.roomId);
        if (!room || !room.state) {
            socket.emit('game:error', { message: 'No active game in room' });
            return;
        }
        const currentPlayer = room.state.players[room.state.currentPlayerIndex];
        const roomPlayer = room.players.find((p) => p.socketId === socket.id);
        if (!roomPlayer || currentPlayer?.id !== roomPlayer.playerId) {
            socket.emit('game:error', { message: 'Not your turn' });
            return;
        }
        clearTurnTimer(data.roomId);
        const drawCount = room.state.pendingPickup > 0 ? room.state.pendingPickup : 1;
        const drawnState = (0, state_1.drawCard)(drawCount, room.state);
        // Broadcast intermediate state — player still active, currentPlayerHasActed: true
        const updated = { ...room, state: drawnState };
        (0, roomManager_1.updateRoom)(updated);
        io.to(data.roomId).emit('game:state', { state: drawnState });
        // Start timer for declaration window
        startTurnTimer(data.roomId, io);
    });
    // game:end-turn — { roomId }
    // Explicitly advance the turn without declaring on cards.
    socket.on('game:end-turn', (data) => {
        const room = (0, roomManager_1.getRoom)(data.roomId);
        if (!room || !room.state) {
            socket.emit('game:error', { message: 'No active game in room' });
            return;
        }
        const currentPlayer = room.state.players[room.state.currentPlayerIndex];
        const roomPlayer = room.players.find((p) => p.socketId === socket.id);
        if (!roomPlayer || currentPlayer?.id !== roomPlayer.playerId) {
            socket.emit('game:error', { message: 'Not your turn' });
            return;
        }
        if (!room.state.currentPlayerHasActed) {
            socket.emit('game:error', { message: 'Must play or draw before ending turn' });
            return;
        }
        clearTurnTimer(data.roomId);
        const newState = (0, state_1.advanceTurn)(room.state);
        const timedState = withTimer(newState);
        const updated = { ...room, state: timedState };
        (0, roomManager_1.updateRoom)(updated);
        io.to(data.roomId).emit('game:state', { state: timedState });
        startTurnTimer(data.roomId, io);
    });
    // game:declare-suit — { roomId, suit: Suit }
    socket.on('game:declare-suit', (data) => {
        const room = (0, roomManager_1.getRoom)(data.roomId);
        if (!room || !room.state) {
            socket.emit('game:error', { message: 'No active game in room' });
            return;
        }
        if (room.state.phase !== 'declare-suit') {
            socket.emit('game:error', { message: 'Not in declare-suit phase' });
            return;
        }
        const roomPlayer = room.players.find((p) => p.socketId === socket.id);
        const currentPlayer = room.state.players[room.state.currentPlayerIndex];
        if (!roomPlayer || currentPlayer?.id !== roomPlayer.playerId) {
            socket.emit('game:error', { message: 'Not your turn' });
            return;
        }
        clearTurnTimer(data.roomId);
        const suitState = {
            ...room.state,
            activeSuit: data.suit,
            phase: 'play',
        };
        const updated = { ...room, state: suitState };
        (0, roomManager_1.updateRoom)(updated);
        io.to(data.roomId).emit('game:state', { state: suitState });
        startTurnTimer(data.roomId, io);
    });
    // game:declare-on-cards — { roomId }
    // Validates the declaration, handles penalty if false, then advances the turn.
    socket.on('game:declare-on-cards', (data) => {
        const room = (0, roomManager_1.getRoom)(data.roomId);
        if (!room || !room.state) {
            socket.emit('game:error', { message: 'No active game in room' });
            return;
        }
        const roomPlayer = room.players.find((p) => p.socketId === socket.id);
        if (!roomPlayer)
            return;
        try {
            clearTurnTimer(data.roomId);
            const { newState, isValid } = (0, state_1.declareOnCards)(roomPlayer.playerId, room.state);
            // Advance turn after declaration (declaration IS the end-turn action)
            const advanced = (0, state_1.advanceTurn)(newState);
            const timedState = withTimer(advanced);
            const updated = { ...room, state: timedState };
            (0, roomManager_1.updateRoom)(updated);
            if (isValid) {
                const playerName = getPlayerName(roomPlayer.playerId, room);
                io.to(data.roomId).emit('game:state', { state: timedState });
                io.to(data.roomId).emit('game:on-cards-declared', {
                    playerId: roomPlayer.playerId,
                    playerName,
                });
            }
            else {
                socket.emit('game:false-declaration', { cardsDrawn: 2 });
                io.to(data.roomId).emit('game:state', { state: timedState });
            }
            startTurnTimer(data.roomId, io);
        }
        catch (err) {
            socket.emit('game:error', { message: err.message });
        }
    });
    // room:rejoin — { roomId, playerId }
    // Called by the client on socket reconnect to re-attach to an in-progress game.
    socket.on('room:rejoin', ({ roomId, playerId }) => {
        const room = (0, roomManager_1.getRoom)(roomId);
        if (!room) {
            socket.emit('game:error', { message: 'Room no longer exists' });
            return;
        }
        const player = room.players.find((p) => p.playerId === playerId);
        if (!player) {
            socket.emit('game:error', { message: 'Player not found in room' });
            return;
        }
        // Update the socket ID for this player and re-join the socket room
        const updatedRoom = {
            ...room,
            players: room.players.map((p) => p.playerId === playerId ? { ...p, socketId: socket.id } : p),
        };
        (0, roomManager_1.updateRoom)(updatedRoom);
        socket.join(roomId);
        // Send current game state to the rejoining player
        if (updatedRoom.state) {
            socket.emit('game:state', { state: updatedRoom.state });
        }
        socket.emit('room:rejoined', { roomId });
    });
    // room:leave — voluntary leave (in-game or waiting room)
    socket.on('room:leave', ({ roomId, playerId }) => {
        const room = (0, roomManager_1.getRoom)(roomId);
        if (!room)
            return;
        const leavingPlayer = room.players.find((p) => p.playerId === playerId);
        const playerName = leavingPlayer?.name ?? playerId.slice(0, 8);
        if (room.status !== 'playing' || !room.state) {
            // Waiting room — remove and notify
            const updated = (0, roomManager_1.leaveRoom)(roomId, socket.id);
            if (updated.players.length === 0) {
                clearTurnTimer(roomId);
            }
            else {
                io.to(roomId).emit('room:updated', { room: updated });
            }
        }
        else {
            // Game in progress — shuffle leaving player's hand back into draw pile
            const gameState = room.state;
            const leavingGamePlayer = gameState.players.find((p) => p.id === playerId);
            let updatedState = gameState;
            if (leavingGamePlayer && leavingGamePlayer.hand.length > 0) {
                const newDeck = (0, deck_1.shuffleDeck)([...gameState.deck, ...leavingGamePlayer.hand]);
                updatedState = {
                    ...gameState,
                    deck: newDeck,
                    players: gameState.players.filter((p) => p.id !== playerId),
                };
            }
            else {
                updatedState = {
                    ...gameState,
                    players: gameState.players.filter((p) => p.id !== playerId),
                };
            }
            if (updatedState.players.length === 1) {
                // Last player standing wins
                const winner = updatedState.players[0];
                const lastPlace = updatedState.placements.length + 1;
                const finalPlacements = [...updatedState.placements, { playerId: winner.id, place: lastPlace }];
                updatedState = { ...updatedState, phase: 'game-over', winnerId: winner.id, placements: finalPlacements };
                (0, roomManager_1.updateRoom)({ ...room, state: updatedState });
                io.to(roomId).emit('game:state', { state: updatedState });
                io.to(roomId).emit('game:over', { winnerId: winner.id, placements: updatedState.placements });
            }
            else if (updatedState.players.length === 0) {
                // No players left — remove the room via leaveRoom (clears from roomManager's map)
                (0, roomManager_1.leaveRoom)(roomId, socket.id);
            }
            else {
                (0, roomManager_1.updateRoom)({ ...room, state: updatedState });
                io.to(roomId).emit('game:state', { state: updatedState });
                io.to(roomId).emit('game:player-left', { playerId, playerName });
            }
        }
        socket.leave(roomId);
    });
    // game:reaction — { roomId, playerId, reactionId }
    // Broadcasts the reaction emoji to all players in the room.
    socket.on('game:reaction', (data) => {
        io.to(data.roomId).emit('game:reaction', { playerId: data.playerId, reactionId: data.reactionId });
    });
    // disconnect
    socket.on('disconnect', () => {
        const room = (0, roomManager_1.getRoomBySocket)(socket.id);
        if (!room)
            return;
        const player = room.players.find((p) => p.socketId === socket.id);
        if (!player)
            return;
        if (room.status === 'waiting') {
            // Waiting room — remove player normally
            const updated = (0, roomManager_1.leaveRoom)(room.id, socket.id);
            if (updated.players.length === 0) {
                clearTurnTimer(room.id);
            }
            else {
                io.to(room.id).emit('room:updated', { room: updated });
            }
            return;
        }
        // Game in progress — soft disconnect.
        // Do NOT remove the player immediately. The turn timer will apply strikes
        // via applyTimeout after 30s if they don't reconnect.
        // Just notify the other players.
        io.to(room.id).emit('game:player-disconnected', {
            playerId: player.playerId,
            playerName: player.name,
        });
    });
}
