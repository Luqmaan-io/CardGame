import { Room, RoomPlayer } from './types';
import { PLAYER_COLOURS, assignRandomColour } from '../shared/colours';
import {
  saveRoom,
  getRoom as redisGetRoom,
  deleteRoom,
  getRoomBySocketId,
} from './lib/roomStore';

export { setSocketRoom, removeSocketRoom } from './lib/roomStore';

function generateId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createRoom(maxPlayers: 2 | 3 | 4, turnDuration: number = 30): Promise<Room> {
  const room: Room = {
    id: generateId(),
    players: [],
    state: null,
    maxPlayers,
    status: 'waiting',
    turnDuration,
  };
  await saveRoom(room);
  return room;
}

export async function joinRoom(
  roomId: string,
  socketId: string,
  playerName: string,
  userId?: string,
  preferredColourHex?: string,
  avatarId?: string,
  cardBackId?: string,
  cardFaceId?: string
): Promise<Room | Error> {
  const room = await redisGetRoom(roomId);
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
  const player: RoomPlayer = {
    socketId, playerId, name: playerName, colourHex, userId, avatarId,
    cardBackId: cardBackId ?? 'back_00',
    cardFaceId: cardFaceId ?? 'face_00',
  };
  const updated: Room = { ...room, players: [...room.players, player] };
  await saveRoom(updated);
  return updated;
}

export async function leaveRoom(roomId: string, socketId: string): Promise<Room> {
  const room = await redisGetRoom(roomId);
  if (!room) throw new Error(`Room ${roomId} not found`);

  const updated: Room = {
    ...room,
    players: room.players.filter((p) => p.socketId !== socketId),
  };
  if (updated.players.length === 0) {
    await deleteRoom(roomId);
  } else {
    await saveRoom(updated);
  }
  return updated;
}

export async function getRoomBySocket(socketId: string): Promise<Room | null> {
  return getRoomBySocketId(socketId);
}

export async function updateRoom(room: Room): Promise<void> {
  await saveRoom(room);
}

export async function getRoom(roomId: string): Promise<Room | null> {
  return redisGetRoom(roomId);
}
