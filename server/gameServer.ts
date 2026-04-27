import { Server, Socket } from 'socket.io';
import { Suit, Card, GameState } from '../engine/types';
import { createDeck, shuffleDeck, dealCards } from '../engine/deck';
import { isValidCombo } from '../engine/validation';
import { applyPlay, advanceTurn, drawCard, declareOnCards, applyTimeout } from '../engine/state';
import { pickAIMove } from '../engine/ai';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomBySocket,
  updateRoom,
  getRoom,
} from './roomManager';
import { Room } from './types';

// ─── Matchmaking queue ────────────────────────────────────────────────────────

type QueueEntry = {
  socketId: string;
  playerId: string;
  playerName: string;
  avatarId: string;
  colourHex: string;
  joinedAt: number;
};

const matchmakingQueue: QueueEntry[] = [];
let matchmakingTimer: NodeJS.Timeout | null = null;

const QUEUE_WAIT_MS = 60000;
const TARGET_PLAYERS = 4;
const MIN_PLAYERS = 2;

let ioRef: Server;  // set on first registerGameHandlers call

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
  if (!room) return;
  const duration = room.turnDuration ?? 30;
  if (duration === 0) return;  // no limit — don't start timer

  // In ranked rooms, check if it's an AI's turn and handle immediately
  if (room.isRanked && room.state) {
    const currentPlayer = room.state.players[room.state.currentPlayerIndex];
    const roomPlayer = room.players.find((p) => p.playerId === currentPlayer?.id);
    if (roomPlayer?.isAI) {
      handleRankedAITurn(roomId, io);
      return;
    }
  }

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
    placements: [],
    consecutiveDraws: {},
  };
}

function getPlayerName(playerId: string, room: Room): string {
  return room.players.find((p) => p.playerId === playerId)?.name ?? playerId.slice(0, 8);
}

// ─── Matchmaking helpers ──────────────────────────────────────────────────────

function broadcastQueueUpdate(io: Server): void {
  matchmakingQueue.forEach((entry, index) => {
    io.to(entry.socketId).emit('queue:update', {
      playersInQueue: matchmakingQueue.length,
      position: index + 1,
      estimatedWait: Math.max(0, QUEUE_WAIT_MS - (Date.now() - entry.joinedAt)),
    });
  });
}

function startMatchmakingGame(io: Server): void {
  if (matchmakingTimer) {
    clearTimeout(matchmakingTimer);
    matchmakingTimer = null;
  }

  const players = matchmakingQueue.splice(0, TARGET_PLAYERS);

  const roomId = `ranked_${Date.now()}`;
  const room: Room = {
    id: roomId,
    players: players.map((p) => ({
      socketId: p.socketId,
      playerId: p.playerId,
      name: p.playerName,
      avatarId: p.avatarId,
      colourHex: p.colourHex,
      isAI: false,
    })),
    maxPlayers: TARGET_PLAYERS,
    status: 'playing',
    state: null,
    isRanked: true,
    turnDuration: 30,
  };

  const aiNames = ['Alex', 'Jordan', 'Casey', 'Morgan'];
  const aiAvatars = ['avatar_03', 'avatar_06', 'avatar_11', 'avatar_14'];
  const aiColours = ['#E24B4A', '#639922', '#7F77DD', '#EF9F27'];

  while (room.players.length < TARGET_PLAYERS) {
    const aiIndex = room.players.filter((p) => p.isAI).length;
    room.players.push({
      socketId: `ai_${aiIndex}`,
      playerId: `ai_${aiIndex}`,
      name: aiNames[aiIndex] ?? `AI ${aiIndex + 1}`,
      avatarId: aiAvatars[aiIndex] ?? 'avatar_01',
      colourHex: aiColours[aiIndex] ?? '#378ADD',
      isAI: true,
    });
  }

  updateRoom(room);

  players.forEach((p) => {
    const playerSocket = io.sockets.sockets.get(p.socketId);
    if (playerSocket) playerSocket.join(roomId);
  });

  const state = initGameState(room);
  const timedState = withTimer(state);
  const updatedRoom: Room = { ...room, state: timedState };
  updateRoom(updatedRoom);

  io.to(roomId).emit('queue:matched', {
    roomId,
    players: room.players.map((p) => ({
      id: p.playerId,
      name: p.name,
      avatarId: p.avatarId,
      colourHex: p.colourHex,
      isAI: p.isAI ?? false,
    })),
  });

  setTimeout(() => {
    const r = getRoom(roomId);
    if (!r || !r.state) return;
    io.to(roomId).emit('game:state', { state: r.state });
    startTurnTimer(roomId, io);
    handleRankedAITurn(roomId, io);
  }, 3000);

  if (matchmakingQueue.length >= MIN_PLAYERS) {
    startMatchmakingGame(io);
  }
}

async function handleRankedAITurn(roomId: string, io: Server): Promise<void> {
  const room = getRoom(roomId);
  if (!room || !room.state || !room.isRanked) return;

  const currentPlayer = room.state.players[room.state.currentPlayerIndex];
  if (!currentPlayer) return;
  const roomPlayer = room.players.find((p) => p.playerId === currentPlayer.id);
  if (!roomPlayer?.isAI) return;

  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

  const freshRoom = getRoom(roomId);
  if (!freshRoom || !freshRoom.state) return;
  const fresh = freshRoom.state;
  const freshPlayer = fresh.players[fresh.currentPlayerIndex];
  if (!freshPlayer || freshPlayer.id !== currentPlayer.id) return;

  const move = pickAIMove(fresh);
  let newState: GameState;
  if (move === 'draw') {
    const drawCount = fresh.pendingPickup > 0 ? fresh.pendingPickup : 1;
    const isVoluntary = drawCount === 1 && fresh.pendingPickup === 0;
    const drawnState = drawCard(drawCount, fresh, isVoluntary);
    newState = advanceTurn(drawnState);
  } else {
    const declaredSuit = move.some((c) => c.rank === 'A')
      ? getBestSuit(freshPlayer.hand)
      : null;
    const playedState = applyPlay(move, declaredSuit, fresh);
    if (playedState.currentPlayerHasActed && playedState.phase !== 'game-over') {
      newState = advanceTurn(playedState);
    } else {
      newState = playedState;
    }
  }

  newState = newState.phase === 'game-over' ? newState : withTimer(newState);
  const updated: Room = { ...freshRoom, state: newState, status: newState.phase === 'game-over' ? 'finished' : 'playing' };
  updateRoom(updated);
  io.to(roomId).emit('game:state', { state: newState });

  if (newState.phase === 'game-over') return;

  clearTurnTimer(roomId);
  startTurnTimer(roomId, io);
  // If next player is also AI, handle their turn
  handleRankedAITurn(roomId, io);
}

function getBestSuit(hand: Card[]): Suit {
  const counts: Record<string, number> = {};
  hand.forEach((c) => { counts[c.suit] = (counts[c.suit] ?? 0) + 1; });
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return (best?.[0] ?? 'hearts') as Suit;
}

export function registerGameHandlers(io: Server, socket: Socket): void {
  ioRef = io;
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
    const isVoluntary = drawCount === 1 && room.state.pendingPickup === 0;
    const drawnState = drawCard(drawCount, room.state, isVoluntary);

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
      // Game in progress — shuffle leaving player's hand back into draw pile
      const gameState = room.state;
      const leavingGamePlayer = gameState.players.find((p) => p.id === playerId);

      let updatedState = gameState;
      if (leavingGamePlayer && leavingGamePlayer.hand.length > 0) {
        const newDeck = shuffleDeck([...gameState.deck, ...leavingGamePlayer.hand]);
        updatedState = {
          ...gameState,
          deck: newDeck,
          players: gameState.players.filter((p) => p.id !== playerId),
        };
      } else {
        updatedState = {
          ...gameState,
          players: gameState.players.filter((p) => p.id !== playerId),
        };
      }

      if (updatedState.players.length === 1) {
        // Last player standing wins
        const winner = updatedState.players[0]!;
        const lastPlace = updatedState.placements.length + 1;
        const finalPlacements = [...updatedState.placements, { playerId: winner.id, place: lastPlace }];
        updatedState = { ...updatedState, phase: 'game-over', winnerId: winner.id, placements: finalPlacements };
        updateRoom({ ...room, state: updatedState });
        io.to(roomId).emit('game:state', { state: updatedState });
        io.to(roomId).emit('game:over', { winnerId: winner.id, placements: updatedState.placements });
      } else if (updatedState.players.length === 0) {
        // No players left — remove the room via leaveRoom (clears from roomManager's map)
        leaveRoom(roomId, socket.id);
      } else {
        updateRoom({ ...room, state: updatedState });
        io.to(roomId).emit('game:state', { state: updatedState });
        io.to(roomId).emit('game:player-left', { playerId, playerName });
      }
    }

    socket.leave(roomId);
  });

  // game:reaction — { roomId, playerId, reactionId }
  // Broadcasts the reaction emoji to all players in the room.
  socket.on('game:reaction', (data: { roomId: string; playerId: string; reactionId: string }) => {
    io.to(data.roomId).emit('game:reaction', { playerId: data.playerId, reactionId: data.reactionId });
  });

  // game:chat — { messageId, messageText }
  socket.on('game:chat', ({ messageText }: { messageId: string; messageText: string }) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;
    io.to(room.id).emit('game:chat-received', {
      playerId: player.playerId,
      playerName: player.name,
      messageText,
    });
  });

  // queue:join — { playerId, playerName, avatarId, colourHex }
  socket.on('queue:join', ({ playerId, playerName, avatarId, colourHex }: {
    playerId: string; playerName: string; avatarId: string; colourHex: string;
  }) => {
    if (matchmakingQueue.find((e) => e.socketId === socket.id)) return;

    matchmakingQueue.push({
      socketId: socket.id,
      playerId,
      playerName,
      avatarId,
      colourHex,
      joinedAt: Date.now(),
    });

    socket.emit('queue:joined', {
      position: matchmakingQueue.length,
      waitTime: QUEUE_WAIT_MS,
    });

    broadcastQueueUpdate(io);

    if (matchmakingQueue.length >= TARGET_PLAYERS) {
      startMatchmakingGame(io);
      return;
    }

    if (!matchmakingTimer) {
      matchmakingTimer = setTimeout(() => {
        matchmakingTimer = null;
        if (matchmakingQueue.length >= MIN_PLAYERS) {
          startMatchmakingGame(io);
        } else {
          matchmakingQueue.forEach((entry) => {
            io.to(entry.socketId).emit('queue:failed', {
              reason: 'Not enough players found. Try again or play vs AI.',
            });
          });
          matchmakingQueue.length = 0;
        }
      }, QUEUE_WAIT_MS);
    }
  });

  // queue:leave
  socket.on('queue:leave', () => {
    const index = matchmakingQueue.findIndex((e) => e.socketId === socket.id);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
      broadcastQueueUpdate(io);
    }
  });

  // disconnect
  socket.on('disconnect', () => {
    // Remove from matchmaking queue if present
    const queueIndex = matchmakingQueue.findIndex((e) => e.socketId === socket.id);
    if (queueIndex !== -1) {
      matchmakingQueue.splice(queueIndex, 1);
      broadcastQueueUpdate(io);
    }

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
