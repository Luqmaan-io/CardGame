import { redisClient } from './redis';
import { Room } from '../types';

const ROOM_KEY = (id: string) => `room:${id}`;
const SOCKET_KEY = (socketId: string) => `socket:${socketId}`;
const ROOMS_SET = 'rooms';

export async function saveRoom(room: Room): Promise<void> {
  await redisClient.set(ROOM_KEY(room.id), JSON.stringify(room));
  await redisClient.sAdd(ROOMS_SET, room.id);
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const data = await redisClient.get(ROOM_KEY(roomId));
  if (!data) return null;
  return JSON.parse(data) as Room;
}

export async function deleteRoom(roomId: string): Promise<void> {
  await redisClient.del(ROOM_KEY(roomId));
  await redisClient.sRem(ROOMS_SET, roomId);
}

export async function getRoomBySocketId(socketId: string): Promise<Room | null> {
  const roomId = await redisClient.get(SOCKET_KEY(socketId));
  if (!roomId) return null;
  return getRoom(roomId);
}

export async function setSocketRoom(socketId: string, roomId: string): Promise<void> {
  await redisClient.set(SOCKET_KEY(socketId), roomId);
}

export async function removeSocketRoom(socketId: string): Promise<void> {
  await redisClient.del(SOCKET_KEY(socketId));
}

export async function getAllRooms(): Promise<Room[]> {
  const ids = await redisClient.sMembers(ROOMS_SET);
  const results = await Promise.all(ids.map(getRoom));
  const rooms: Room[] = [];
  for (const r of results) {
    if (r !== null) rooms.push(r);
  }
  return rooms;
}
