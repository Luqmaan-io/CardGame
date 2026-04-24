import { Room } from './types';
export declare function createRoom(maxPlayers: 2 | 3 | 4, turnDuration?: number): Room;
export declare function joinRoom(roomId: string, socketId: string, playerName: string, userId?: string, preferredColourHex?: string, avatarId?: string): Room | Error;
export declare function leaveRoom(roomId: string, socketId: string): Room;
export declare function getRoomBySocket(socketId: string): Room | null;
export declare function updateRoom(room: Room): void;
export declare function getRoom(roomId: string): Room | null;
//# sourceMappingURL=roomManager.d.ts.map