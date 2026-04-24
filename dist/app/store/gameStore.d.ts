import type { Socket } from 'socket.io-client';
import type { GameState, Card } from '../../engine/types';
import type { GameResult } from '../lib/recordGameStats';
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
export interface RoomPlayer {
    playerId: string;
    name: string;
    colourHex?: string;
    avatarId?: string;
}
export interface RoomInfo {
    id: string;
    players: RoomPlayer[];
    maxPlayers: 2 | 3 | 4;
    status: 'waiting' | 'playing' | 'finished';
    turnDuration?: number;
}
interface GameStore {
    gameState: GameState | null;
    myPlayerId: string;
    roomId: string | null;
    roomInfo: RoomInfo | null;
    selectedCards: Card[];
    socket: Socket | null;
    playerName: string;
    error: string | null;
    pendingTimeoutNotification: string | null;
    connectionState: ConnectionState;
    pendingGameStats: GameResult | null;
    pendingReaction: {
        playerId: string;
        reactionId: string;
    } | null;
    setGameState: (state: GameState) => void;
    setError: (error: string | null) => void;
    setRoom: (roomId: string, playerId: string) => void;
    setRoomInfo: (room: RoomInfo) => void;
    setSocket: (socket: Socket) => void;
    setPlayerName: (name: string) => void;
    selectCard: (card: Card) => void;
    deselectCard: (card: Card) => void;
    clearSelection: () => void;
    reset: () => void;
    setPendingTimeoutNotification: (msg: string | null) => void;
    setConnectionState: (state: ConnectionState) => void;
    setPendingGameStats: (stats: GameResult | null) => void;
    setPendingReaction: (r: {
        playerId: string;
        reactionId: string;
    } | null) => void;
}
export declare const useGameStore: import("zustand").UseBoundStore<import("zustand").StoreApi<GameStore>>;
export {};
//# sourceMappingURL=gameStore.d.ts.map