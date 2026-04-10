import { Room, RoomPlayer } from './types';
import { PLAYER_COLOURS, assignRandomColour } from '../shared/colours';

const rooms = new Map<string, Room>();

function generateId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function createRoom(maxPlayers: 2 | 3 | 4): Room {
  const room: Room = {
    id: generateId(),
    players: [],
    state: null,
    maxPlayers,
    status: 'waiting',
  };
  rooms.set(room.id, room);
  return room;
}

export function joinRoom(
  roomId: string,
  socketId: string,
  playerName: string,
  userId?: string,
  preferredColourHex?: string
): Room | Error {
  const room = rooms.get(roomId);
  if (!room) return new Error(`Room ${roomId} not found`);
  if (room.status !== 'waiting') return new Error('Game already in progress');
  if (room.players.length >= room.maxPlayers) return new Error('Room is full');

  const playerId = `player-${room.players.length + 1}`;
  let colourHex: string;
  if (preferredColourHex) {
    colourHex = preferredColourHex;
  } else {
    const takenColourIds = room.players
      .map((p) => PLAYER_COLOURS.find((c) => c.hex === p.colourHex)?.id ?? '')
      .filter(Boolean);
    colourHex = assignRandomColour(takenColourIds).hex;
  }
  const player: RoomPlayer = { socketId, playerId, name: playerName, colourHex, userId };
  const updated: Room = { ...room, players: [...room.players, player] };
  rooms.set(roomId, updated);
  return updated;
}

export function leaveRoom(roomId: string, socketId: string): Room {
  const room = rooms.get(roomId);
  if (!room) throw new Error(`Room ${roomId} not found`);

  const updated: Room = {
    ...room,
    players: room.players.filter((p) => p.socketId !== socketId),
  };
  rooms.set(roomId, updated);
  return updated;
}

export function getRoomBySocket(socketId: string): Room | null {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.socketId === socketId)) {
      return room;
    }
  }
  return null;
}

export function updateRoom(room: Room): void {
  rooms.set(room.id, room);
}

export function getRoom(roomId: string): Room | null {
  return rooms.get(roomId) ?? null;
}
