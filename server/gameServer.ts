import { Server, Socket } from 'socket.io';
import { Suit, Card, GameState } from '../engine/types';
import { createDeck, shuffleDeck, dealCards } from '../engine/deck';
import { isValidCombo } from '../engine/validation';
import { applyPlay, drawCard } from '../engine/state';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomBySocket,
  updateRoom,
  getRoom,
} from './roomManager';
import { Room } from './types';

function initGameState(room: Room): GameState {
  const deck = shuffleDeck(createDeck());
  const playerIds = room.players.map((p) => p.playerId);
  const { hands, remaining } = dealCards(deck, playerIds.length, 7);

  const players = room.players.map((p, i) => ({
    id: p.playerId,
    hand: hands[i] ?? [],
    isHuman: true,
  }));

  // Flip starting card — if power card treat as neutral (no effect, just set state)
  const startCard = remaining[0]!;
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
  };
}

export function registerGameHandlers(io: Server, socket: Socket): void {
  // room:create — { maxPlayers: 2 | 3 | 4 }
  socket.on('room:create', (data: { maxPlayers: 2 | 3 | 4; name: string }) => {
    const maxPlayers = data.maxPlayers ?? 4;
    const name = data.name ?? 'Player';
    const room = createRoom(maxPlayers);
    const joined = joinRoom(room.id, socket.id, name);
    if (joined instanceof Error) {
      socket.emit('game:error', { message: joined.message });
      return;
    }
    socket.join(room.id);
    socket.emit('room:joined', { roomId: joined.id, room: joined });
  });

  // room:join — { roomId, name }
  socket.on('room:join', (data: { roomId: string; name: string }) => {
    const result = joinRoom(data.roomId, socket.id, data.name);
    if (result instanceof Error) {
      socket.emit('game:error', { message: result.message });
      return;
    }
    socket.join(data.roomId);
    io.to(data.roomId).emit('room:updated', { room: result });
  });

  // room:start — host triggers game start
  socket.on('room:start', (data: { roomId: string }) => {
    const room = getRoom(data.roomId);
    if (!room) {
      socket.emit('game:error', { message: 'Room not found' });
      return;
    }
    if (room.players.length < 2) {
      socket.emit('game:error', { message: 'Need at least 2 players to start' });
      return;
    }
    const state = initGameState(room);
    const updated: Room = { ...room, state, status: 'playing' };
    updateRoom(updated);
    io.to(data.roomId).emit('game:state', { state });
  });

  // game:play — { roomId, cards: Card[], declaredSuit?: Suit }
  socket.on(
    'game:play',
    (data: { roomId: string; cards: Card[]; declaredSuit?: Suit }) => {
      const room = getRoom(data.roomId);
      if (!room || !room.state) {
        socket.emit('game:error', { message: 'No active game in room' });
        return;
      }

      // Verify it's this player's turn
      const currentPlayer = room.state.players[room.state.currentPlayerIndex];
      const roomPlayer = room.players.find((p) => p.socketId === socket.id);
      if (!roomPlayer || currentPlayer?.id !== roomPlayer.playerId) {
        socket.emit('game:error', { message: 'Not your turn' });
        return;
      }

      // Server-side validation
      if (!isValidCombo(data.cards, room.state)) {
        socket.emit('game:error', { message: 'Invalid move' });
        return;
      }

      try {
        const newState = applyPlay(data.cards, data.declaredSuit ?? null, room.state);
        const updated: Room = { ...room, state: newState, status: newState.phase === 'game-over' ? 'finished' : 'playing' };
        updateRoom(updated);
        io.to(data.roomId).emit('game:state', { state: newState });
      } catch (err) {
        socket.emit('game:error', { message: (err as Error).message });
      }
    }
  );

  // game:draw — { roomId }
  socket.on('game:draw', (data: { roomId: string }) => {
    const room = getRoom(data.roomId);
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

    const drawCount = room.state.pendingPickup > 0 ? room.state.pendingPickup : 1;
    const newState = drawCard(drawCount, room.state);
    const updated: Room = { ...room, state: newState };
    updateRoom(updated);
    io.to(data.roomId).emit('game:state', { state: newState });
  });

  // game:declare-suit — { roomId, suit: Suit }
  // This is handled via game:play with declaredSuit — but we support a
  // dedicated event for the Ace suit-picker flow when the client sends suit
  // selection after the Ace has already been committed.
  socket.on('game:declare-suit', (data: { roomId: string; suit: Suit }) => {
    const room = getRoom(data.roomId);
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

    const newState: GameState = {
      ...room.state,
      activeSuit: data.suit,
      phase: 'play',
    };
    const updated: Room = { ...room, state: newState };
    updateRoom(updated);
    io.to(data.roomId).emit('game:state', { state: newState });
  });

  // disconnect
  socket.on('disconnect', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    const updated = leaveRoom(room.id, socket.id);
    if (updated.players.length === 0) return; // empty room, discard silently

    // If game was in progress, mark finished
    if (updated.status === 'playing') {
      const finished: Room = { ...updated, status: 'finished' };
      updateRoom(finished);
      io.to(room.id).emit('game:error', {
        message: `A player disconnected — game ended`,
      });
    } else {
      io.to(room.id).emit('room:updated', { room: updated });
    }
  });
}
