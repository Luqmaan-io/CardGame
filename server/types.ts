import { GameState } from '../engine/types';

export interface RoomPlayer {
  socketId: string;
  playerId: string;
  name: string;
  colourHex: string;
  userId?: string;
  avatarId?: string;
  isAI?: boolean;
}

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface Room {
  id: string;
  players: RoomPlayer[];
  state: GameState | null;
  maxPlayers: 2 | 3 | 4;
  status: RoomStatus;
  turnDuration: number;  // seconds; 0 = no limit
  isRanked?: boolean;
}
