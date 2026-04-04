import { useEffect } from 'react';
import { io } from 'socket.io-client';
import type { Card, Suit } from '../../engine/types';
import { useGameStore, RoomInfo } from '../store/gameStore';

// Change this to your machine's local IP when testing on a physical device
// e.g. 'http://192.168.1.100:3001'
const SERVER_URL = 'http://localhost:3001';

export function useSocket() {
  const { socket, setSocket, setGameState, setRoom, setRoomInfo, setError } =
    useGameStore();

  useEffect(() => {
    // Only create the socket once — reuse if already connected
    const existing = useGameStore.getState().socket;
    if (existing) return;

    const newSocket = io(SERVER_URL, { transports: ['websocket'] });
    setSocket(newSocket);

    newSocket.on('game:state', ({ state }: { state: Parameters<typeof setGameState>[0] }) => {
      setGameState(state);
    });

    newSocket.on(
      'room:joined',
      ({ roomId, room }: { roomId: string; room: { id: string; players: { socketId: string; playerId: string; name: string }[]; maxPlayers: 2 | 3 | 4; status: RoomInfo['status'] } }) => {
        const playerId =
          room.players.find((p) => p.socketId === newSocket.id)?.playerId ?? '';
        setRoom(roomId, playerId);
        setRoomInfo({
          id: room.id,
          players: room.players.map((p) => ({ playerId: p.playerId, name: p.name })),
          maxPlayers: room.maxPlayers,
          status: room.status,
        });
      }
    );

    newSocket.on(
      'room:updated',
      ({ room }: { room: { id: string; players: { playerId: string; name: string }[]; maxPlayers: 2 | 3 | 4; status: RoomInfo['status'] } }) => {
        setRoomInfo({
          id: room.id,
          players: room.players.map((p) => ({ playerId: p.playerId, name: p.name })),
          maxPlayers: room.maxPlayers,
          status: room.status,
        });
      }
    );

    newSocket.on('game:error', ({ message }: { message: string }) => {
      setError(message);
    });
  }, []);

  function playCards(cards: Card[], declaredSuit?: Suit) {
    const { socket: s, roomId } = useGameStore.getState();
    s?.emit('game:play', { roomId, cards, declaredSuit });
  }

  function drawCard() {
    const { socket: s, roomId } = useGameStore.getState();
    s?.emit('game:draw', { roomId });
  }

  function createRoom(maxPlayers: 2 | 3 | 4 = 4) {
    const { socket: s, playerName } = useGameStore.getState();
    s?.emit('room:create', { maxPlayers, name: playerName });
  }

  function joinRoom(roomId: string) {
    const { socket: s, playerName } = useGameStore.getState();
    s?.emit('room:join', { roomId, name: playerName });
  }

  function startGame(roomId: string) {
    const { socket: s } = useGameStore.getState();
    s?.emit('room:start', { roomId });
  }

  function declareSuit(suit: Suit) {
    const { socket: s, roomId } = useGameStore.getState();
    s?.emit('game:declare-suit', { roomId, suit });
  }

  return { playCards, drawCard, createRoom, joinRoom, startGame, declareSuit };
}
