import { useEffect } from 'react';
import { io } from 'socket.io-client';
import type { Card, Suit } from '../../engine/types';
import { useGameStore, RoomInfo } from '../store/gameStore';
import { SERVER_URL } from '../config';

export function useSocket() {
  const {
    socket,
    setSocket,
    setGameState,
    setRoom,
    setRoomInfo,
    setError,
    setPendingTimeoutNotification,
    setConnectionState,
    connectionState,
  } = useGameStore();

  useEffect(() => {
    // Only create the socket once — reuse if already connected
    const existing = useGameStore.getState().socket;
    if (existing) return;

    const newSocket = io(SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    setSocket(newSocket);

    // ── Connection state tracking ──────────────────────────────────────────────
    // 'connect' fires on initial connect AND after every successful reconnect.
    newSocket.on('connect', () => {
      useGameStore.getState().setConnectionState('connected');
    });

    newSocket.on('disconnect', () => {
      useGameStore.getState().setConnectionState('disconnected');
    });

    newSocket.on('connect_error', () => {
      useGameStore.getState().setConnectionState('disconnected');
    });

    // Manager-level events for reconnection lifecycle (socket.io v4 API).
    newSocket.io.on('reconnect_attempt', () => {
      useGameStore.getState().setConnectionState('reconnecting');
    });

    newSocket.io.on('reconnect', () => {
      // 'connect' will also fire, but emit room:rejoin here while the reconnect
      // context is clear — before 'connect' handlers run.
      const { roomId, myPlayerId } = useGameStore.getState();
      if (roomId && myPlayerId) {
        newSocket.emit('room:rejoin', { roomId, playerId: myPlayerId });
      }
    });

    // ── Game events ────────────────────────────────────────────────────────────
    newSocket.on('game:state', ({ state }: { state: Parameters<typeof setGameState>[0] }) => {
      setGameState(state);
    });

    newSocket.on(
      'room:joined',
      ({ roomId, room }: { roomId: string; room: { id: string; players: { socketId: string; playerId: string; name: string; colourHex?: string }[]; maxPlayers: 2 | 3 | 4; status: RoomInfo['status'] } }) => {
        const playerId =
          room.players.find((p) => p.socketId === newSocket.id)?.playerId ?? '';
        setRoom(roomId, playerId);
        setRoomInfo({
          id: room.id,
          players: room.players.map((p) => ({ playerId: p.playerId, name: p.name, colourHex: p.colourHex })),
          maxPlayers: room.maxPlayers,
          status: room.status,
        });
      }
    );

    newSocket.on(
      'room:updated',
      ({ room }: { room: { id: string; players: { playerId: string; name: string; colourHex?: string }[]; maxPlayers: 2 | 3 | 4; status: RoomInfo['status'] } }) => {
        setRoomInfo({
          id: room.id,
          players: room.players.map((p) => ({ playerId: p.playerId, name: p.name, colourHex: p.colourHex })),
          maxPlayers: room.maxPlayers,
          status: room.status,
        });
      }
    );

    newSocket.on('room:rejoined', () => {
      useGameStore.getState().setPendingTimeoutNotification('Reconnected to game');
    });

    newSocket.on('game:error', ({ message }: { message: string }) => {
      setError(message);
    });

    newSocket.on(
      'game:timeout',
      ({ playerName, strikesRemaining }: { playerId: string; playerName: string; strikesRemaining: number }) => {
        let text: string;
        if (strikesRemaining === 0) {
          text = `${playerName} was removed from the game`;
        } else if (strikesRemaining === 1) {
          text = `${playerName} ran out of time — 1 more timeout and they're removed!`;
        } else {
          text = `${playerName} ran out of time`;
        }
        setPendingTimeoutNotification(text);
      }
    );

    newSocket.on(
      'game:on-cards-declared',
      ({ playerName }: { playerId: string; playerName: string }) => {
        setPendingTimeoutNotification(`${playerName} is on cards!`);
      }
    );

    newSocket.on(
      'game:false-declaration',
      ({ cardsDrawn }: { cardsDrawn: number }) => {
        setPendingTimeoutNotification(`You're not on cards — ${cardsDrawn} cards added to your hand`);
      }
    );

    newSocket.on(
      'game:player-disconnected',
      ({ playerName }: { playerId: string; playerName: string }) => {
        setPendingTimeoutNotification(`${playerName} lost connection — waiting for them to return…`);
      }
    );
  }, []);

  function playCards(cards: Card[], declaredSuit?: Suit) {
    const { socket: s, roomId } = useGameStore.getState();
    s?.emit('game:play', { roomId, cards, declaredSuit });
  }

  function drawCard() {
    const { socket: s, roomId } = useGameStore.getState();
    s?.emit('game:draw', { roomId });
  }

  function createRoom(maxPlayers: 2 | 3 | 4 = 4, userId?: string, colourHex?: string) {
    const { socket: s, playerName } = useGameStore.getState();
    s?.emit('room:create', { maxPlayers, name: playerName, userId, colourHex });
  }

  function joinRoom(roomId: string, userId?: string, colourHex?: string) {
    const { socket: s, playerName } = useGameStore.getState();
    s?.emit('room:join', { roomId, name: playerName, userId, colourHex });
  }

  function startGame(roomId: string) {
    const { socket: s } = useGameStore.getState();
    s?.emit('room:start', { roomId });
  }

  function declareSuit(suit: Suit) {
    const { socket: s, roomId } = useGameStore.getState();
    s?.emit('game:declare-suit', { roomId, suit });
  }

  function declareOnCards() {
    const { socket: s, roomId } = useGameStore.getState();
    s?.emit('game:declare-on-cards', { roomId });
  }

  function endTurn() {
    const { socket: s, roomId } = useGameStore.getState();
    s?.emit('game:end-turn', { roomId });
  }

  return {
    playCards,
    drawCard,
    createRoom,
    joinRoom,
    startGame,
    declareSuit,
    declareOnCards,
    endTurn,
    connectionState,
  };
}
