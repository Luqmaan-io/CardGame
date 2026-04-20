import { create } from 'zustand';
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
  turnDuration?: number;  // seconds; 0 = no limit
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
  pendingReaction: { playerId: string; reactionId: string } | null;

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
  setPendingReaction: (r: { playerId: string; reactionId: string } | null) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  myPlayerId: '',
  roomId: null,
  roomInfo: null,
  selectedCards: [],
  socket: null,
  playerName: '',
  error: null,
  pendingTimeoutNotification: null,
  connectionState: 'connecting',
  pendingGameStats: null,
  pendingReaction: null,

  setGameState: (state) => set({ gameState: state, selectedCards: [] }),
  setError: (error) => set({ error }),
  setPendingTimeoutNotification: (msg) => set({ pendingTimeoutNotification: msg }),
  setConnectionState: (state) => set({ connectionState: state }),
  setPendingGameStats: (stats) => set({ pendingGameStats: stats }),
  setPendingReaction: (r) => set({ pendingReaction: r }),

  setRoom: (roomId, playerId) => set({ roomId, myPlayerId: playerId }),

  setRoomInfo: (room) => set({ roomInfo: room }),

  setSocket: (socket) => set({ socket }),

  setPlayerName: (name) => set({ playerName: name }),

  selectCard: (card) => {
    const { selectedCards } = get();
    const alreadySelected = selectedCards.some(
      (c) => c.rank === card.rank && c.suit === card.suit
    );
    if (!alreadySelected) {
      set({ selectedCards: [...selectedCards, card] });
    }
  },

  deselectCard: (card) => {
    const { selectedCards } = get();
    set({
      selectedCards: selectedCards.filter(
        (c) => !(c.rank === card.rank && c.suit === card.suit)
      ),
    });
  },

  clearSelection: () => set({ selectedCards: [] }),

  reset: () =>
    set({
      gameState: null,
      roomId: null,
      roomInfo: null,
      selectedCards: [],
      myPlayerId: '',
    }),
}));
