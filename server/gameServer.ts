import { Server, Socket } from 'socket.io';
import { Suit, Card, GameState } from '../engine/types';
import { createDeck, shuffleDeck, dealCards } from '../engine/deck';
import { isValidCombo } from '../engine/validation';
import { applyPlay, advanceTurn, drawCard, declareOnCards, applyTimeout } from '../engine/state';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomBySocket,
  updateRoom,
  getRoom,
} from './roomManager';
import { Room } from './types';

// ─── Server-side turn timer ───────────────────────────────────────────────────

const roomTimers = new Map<string, NodeJS.Timeout>();

function clearTurnTimer(roomId: string): void {
  const existing = roomTimers.get(roomId);
  if (existing) {
    clearTimeout(existing);
    roomTimers.delete(roomId);
  }
}

function startTurnTimer(roomId: string, io: Server): void {
  clearTurnTimer(roomId);
  const room = getRoom(roomId);
  const duration = room?.turnDuration ?? 30;
  if (duration === 0) return;  // no limit — don't start timer
  const timer = setTimeout(() => handleTimeout(roomId, io), duration * 1000);
  roomTimers.set(roomId, timer);
}

function handleTimeout(roomId: string, io: Server): void {
  roomTimers.delete(roomId);
  const room = getRoom(roomId);
  if (!room || !room.state) return;

  const currentPlayer = room.state.players[room.state.currentPlayerIndex];
  if (!currentPlayer) return;

  const currentStrikes = room.state.timeoutStrikes[currentPlayer.id] ?? 0;
  const newStrikes = currentStrikes + 1;
  const strikesRemaining = Math.max(0, 3 - newStrikes);

  const roomPlayer = room.players.find((p) => p.playerId === currentPlayer.id);
  const playerName = roomPlayer?.name ?? currentPlayer.id.slice(0, 8);

  io.to(roomId).emit('game:timeout', { playerId: currentPlayer.id, playerName, strikesRemaining });

  const newState = applyTimeout(room.state);
  const timedState = newState.phase === 'game-over' ? newState : withTimer(newState);
  const updated: Room = {
    ...room,
    state: timedState,
    status: timedState.phase === 'game-over' ? 'finished' : 'playing',
  };
  updateRoom(updated);
  io.to(roomId).emit('game:state', { state: timedState });

  if (timedState.phase !== 'game-over') {
    startTurnTimer(roomId, io);
  }
}

function withTimer(state: GameState): GameState {
  if (state.phase === 'game-over') return state;
  return { ...state, timerStartedAt: Date.now() };
}

function initGameState(room: Room): GameState {
  const deck = shuffleDeck(createDeck());
  const playerIds = room.players.map((p) => p.playerId);
  const { hands, remaining } = dealCards(deck, playerIds.length, 7);

  const players = room.players.map((p, i) => ({
    id: p.playerId,
    hand: hands[i] ?? [],
    isHuman: true,
    colourHex: p.colourHex,
    avatarId: p.avatarId,
  }));

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
    timerStartedAt: null,
    timeoutStrikes: {},
    sessionScores: {},
    onCardsDeclarations: [],
    currentPlayerHasActed: false,
  };
}

function getPlayerName(playerId: string, room: Room): string {
  return room.players.find((p) => p.playerId === playerId)?.name ?? playerId.slice(0, 8);
}

export function registerGameHandlers(io: Server, socket: Socket): void {
  // room:create — { maxPlayers: 2 | 3 | 4, name, userId?, colourHex?, avatarId?, turnDuration? }
  socket.on('room:create', (data: { maxPlayers: 2 | 3 | 4; name: string; userId?: string; colourHex?: string; avatarId?: string; turnDuration?: number }) => {
    const maxPlayers = data.maxPlayers ?? 4;
    const name = data.name ?? 'Player';
    const turnDuration = data.turnDuration ?? 30;
    const room = createRoom(maxPlayers, turnDuration);
    const joined = joinRoom(room.id, socket.id, name, data.userId, data.colourHex, data.avatarId);
    if (joined instanceof Error) {
      socket.emit('game:error', { message: joined.message });
      return;
    }
    socket.join(room.id);
    socket.emit('room:joined', { roomId: joined.id, room: { ...joined, turnDuration: joined.turnDuration } });
  });

  // room:join — { roomId, name, userId?, colourHex?, avatarId? }
  socket.on('room:join', (data: { roomId: string; name: string; userId?: string; colourHex?: string; avatarId?: string }) => {
    const result = joinRoom(data.roomId, socket.id, data.name, data.userId, data.colourHex, data.avatarId);
    if (result instanceof Error) {
      socket.emit('game:error', { message: result.message });
      return;
    }
    socket.join(data.roomId);
    socket.emit('room:joined', { roomId: result.id, room: { ...result, turnDuration: result.turnDuration } });
    socket.to(data.roomId).emit('room:updated', { room: { ...result, turnDuration: result.turnDuration } });
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
    const timedState = withTimer(state);
    const updated: Room = { ...room, state: timedState, status: 'playing' };
    updateRoom(updated);
    io.to(data.roomId).emit('game:state', { state: timedState });
    startTurnTimer(data.roomId, io);
  });

  // game:play — { roomId, cards: Card[], declaredSuit?: Suit }
  // After applyPlay, the turn stays on the current player (currentPlayerHasActed: true).
  // The client must send game:end-turn to advance (or game:declare-on-cards which also advances).
  socket.on(
    'game:play',
    (data: { roomId: string; cards: Card[]; declaredSuit?: Suit }) => {
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

      if (!isValidCombo(data.cards, room.state)) {
        socket.emit('game:error', { message: 'Invalid move' });
        return;
      }

      try {
        clearTurnTimer(data.roomId);
        const playedState = applyPlay(data.cards, data.declaredSuit ?? null, room.state);

        if (playedState.phase === 'game-over') {
          const updated: Room = { ...room, state: playedState, status: 'finished' };
          updateRoom(updated);
          io.to(data.roomId).emit('game:state', { state: playedState });
          return;
        }

        // Broadcast intermediate state — player still active, currentPlayerHasActed: true
        // Client will show "I'm on cards" and "End Turn" buttons
        const updated: Room = { ...room, state: playedState };
        updateRoom(updated);
        io.to(data.roomId).emit('game:state', { state: playedState });

        // Start a short declaration window timer (30s — if player doesn't end turn, timeout fires)
        startTurnTimer(data.roomId, io);
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

    clearTurnTimer(data.roomId);
    const drawCount = room.state.pendingPickup > 0 ? room.state.pendingPickup : 1;
    const drawnState = drawCard(drawCount, room.state);

    // Broadcast intermediate state — player still active, currentPlayerHasActed: true
    const updated: Room = { ...room, state: drawnState };
    updateRoom(updated);
    io.to(data.roomId).emit('game:state', { state: drawnState });

    // Start timer for declaration window
    startTurnTimer(data.roomId, io);
  });

  // game:end-turn — { roomId }
  // Explicitly advance the turn without declaring on cards.
  socket.on('game:end-turn', (data: { roomId: string }) => {
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

    if (!room.state.currentPlayerHasActed) {
      socket.emit('game:error', { message: 'Must play or draw before ending turn' });
      return;
    }

    clearTurnTimer(data.roomId);
    const newState = advanceTurn(room.state);
    const timedState = withTimer(newState);
    const updated: Room = { ...room, state: timedState };
    updateRoom(updated);
    io.to(data.roomId).emit('game:state', { state: timedState });
    startTurnTimer(data.roomId, io);
  });

  // game:declare-suit — { roomId, suit: Suit }
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

    clearTurnTimer(data.roomId);
    const suitState: GameState = {
      ...room.state,
      activeSuit: data.suit,
      phase: 'play',
    };
    const updated: Room = { ...room, state: suitState };
    updateRoom(updated);
    io.to(data.roomId).emit('game:state', { state: suitState });
    startTurnTimer(data.roomId, io);
  });

  // game:declare-on-cards — { roomId }
  // Validates the declaration, handles penalty if false, then advances the turn.
  socket.on('game:declare-on-cards', (data: { roomId: string }) => {
    const room = getRoom(data.roomId);
    if (!room || !room.state) {
      socket.emit('game:error', { message: 'No active game in room' });
      return;
    }
    const roomPlayer = room.players.find((p) => p.socketId === socket.id);
    if (!roomPlayer) return;

    try {
      clearTurnTimer(data.roomId);
      const { newState, isValid } = declareOnCards(roomPlayer.playerId, room.state);

      // Advance turn after declaration (declaration IS the end-turn action)
      const advanced = advanceTurn(newState);
      const timedState = withTimer(advanced);
      const updated: Room = { ...room, state: timedState };
      updateRoom(updated);

      if (isValid) {
        const playerName = getPlayerName(roomPlayer.playerId, room);
        io.to(data.roomId).emit('game:state', { state: timedState });
        io.to(data.roomId).emit('game:on-cards-declared', {
          playerId: roomPlayer.playerId,
          playerName,
        });
      } else {
        socket.emit('game:false-declaration', { cardsDrawn: 2 });
        io.to(data.roomId).emit('game:state', { state: timedState });
      }

      startTurnTimer(data.roomId, io);
    } catch (err) {
      socket.emit('game:error', { message: (err as Error).message });
    }
  });

  // room:rejoin — { roomId, playerId }
  // Called by the client on socket reconnect to re-attach to an in-progress game.
  socket.on('room:rejoin', ({ roomId, playerId }: { roomId: string; playerId: string }) => {
    const room = getRoom(roomId);
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
    const updatedRoom: Room = {
      ...room,
      players: room.players.map((p) =>
        p.playerId === playerId ? { ...p, socketId: socket.id } : p
      ),
    };
    updateRoom(updatedRoom);
    socket.join(roomId);

    // Send current game state to the rejoining player
    if (updatedRoom.state) {
      socket.emit('game:state', { state: updatedRoom.state });
    }
    socket.emit('room:rejoined', { roomId });
  });

  // room:leave — voluntary leave (in-game or waiting room)
  socket.on('room:leave', ({ roomId, playerId }: { roomId: string; playerId: string }) => {
    const room = getRoom(roomId);
    if (!room) return;

    const leavingPlayer = room.players.find((p) => p.playerId === playerId);
    const playerName = leavingPlayer?.name ?? playerId.slice(0, 8);

    if (room.status !== 'playing' || !room.state) {
      // Waiting room — remove and notify
      const updated = leaveRoom(roomId, socket.id);
      if (updated.players.length === 0) {
        clearTurnTimer(roomId);
      } else {
        io.to(roomId).emit('room:updated', { room: updated });
      }
    } else {
      // Game in progress — notify remaining players
      io.to(roomId).emit('game:player-left', { playerId, playerName });
    }

    socket.leave(roomId);
  });

  // game:reaction — { roomId, playerId, reactionId }
  // Broadcasts the reaction emoji to all players in the room.
  socket.on('game:reaction', (data: { roomId: string; playerId: string; reactionId: string }) => {
    io.to(data.roomId).emit('game:reaction', { playerId: data.playerId, reactionId: data.reactionId });
  });

  // disconnect
  socket.on('disconnect', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;

    if (room.status === 'waiting') {
      // Waiting room — remove player normally
      const updated = leaveRoom(room.id, socket.id);
      if (updated.players.length === 0) {
        clearTurnTimer(room.id);
      } else {
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
