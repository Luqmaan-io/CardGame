"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoom = createRoom;
exports.joinRoom = joinRoom;
exports.leaveRoom = leaveRoom;
exports.getRoomBySocket = getRoomBySocket;
exports.updateRoom = updateRoom;
exports.getRoom = getRoom;
const colours_1 = require("../shared/colours");
const rooms = new Map();
function generateId() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
}
function createRoom(maxPlayers, turnDuration = 30) {
    const room = {
        id: generateId(),
        players: [],
        state: null,
        maxPlayers,
        status: 'waiting',
        turnDuration,
    };
    rooms.set(room.id, room);
    return room;
}
function joinRoom(roomId, socketId, playerName, userId, preferredColourHex, avatarId) {
    const room = rooms.get(roomId);
    if (!room)
        return new Error(`Room ${roomId} not found`);
    if (room.status !== 'waiting')
        return new Error('Game already in progress');
    if (room.players.length >= room.maxPlayers)
        return new Error('Room is full');
    const playerId = `player-${room.players.length + 1}`;
    let colourHex;
    if (preferredColourHex) {
        colourHex = preferredColourHex;
    }
    else {
        const takenColourIds = room.players
            .map((p) => colours_1.PLAYER_COLOURS.find((c) => c.hex === p.colourHex)?.id ?? '')
            .filter(Boolean);
        colourHex = (0, colours_1.assignRandomColour)(takenColourIds).hex;
    }
    const player = { socketId, playerId, name: playerName, colourHex, userId, avatarId };
    const updated = { ...room, players: [...room.players, player] };
    rooms.set(roomId, updated);
    return updated;
}
function leaveRoom(roomId, socketId) {
    const room = rooms.get(roomId);
    if (!room)
        throw new Error(`Room ${roomId} not found`);
    const updated = {
        ...room,
        players: room.players.filter((p) => p.socketId !== socketId),
    };
    rooms.set(roomId, updated);
    return updated;
}
function getRoomBySocket(socketId) {
    for (const room of rooms.values()) {
        if (room.players.some((p) => p.socketId === socketId)) {
            return room;
        }
    }
    return null;
}
function updateRoom(room) {
    rooms.set(room.id, room);
}
function getRoom(roomId) {
    return rooms.get(roomId) ?? null;
}
