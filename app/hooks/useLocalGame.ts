import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { createDeck, shuffleDeck, dealCards } from '../../engine/deck';
import { applyPlay, advanceTurn, drawCard as engineDrawCard, declareOnCards as engineDeclareOnCards, applyTimeout } from '../../engine/state';
import { pickAIMove } from '../../engine/ai';
import { isValidCombo } from '../../engine/validation';
import { assignRandomColour } from '../../shared/colours';
import { useGameStore } from '../store/gameStore';
import { AVATAR_DATA } from '../assets/avatars/avatarData';
import type { Card, GameState, Player, Suit } from '../../engine/types';

export interface LocalGameParams {
  playerName: string;
  aiCount: number;
}

export function useLocalGame() {
  const router = useRouter();
  const { setGameState: storeSetGameState } = useGameStore();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [turnStartedAt, setTurnStartedAt] = useState<number | null>(null);
  const myPlayerId = 'player-human';
  const turnDurationRef = useRef<number>(30);

  // Ref to hold the latest state so the async AI loop always reads current state
  const stateRef = useRef<GameState | null>(null);
  // Prevent re-entrant AI turns
  const aiRunningRef = useRef(false);
  // Store human player's display name for results screen
  const humanNameRef = useRef<string>('Player');
  // Last AI play in submission order (for history banner)
  const lastAIPlayCardsRef = useRef<Card[]>([]);
  // Stable ref to runGameLoop so useCallback closures don't go stale
  const runGameLoopRef = useRef<(state: GameState) => void>(() => {});

  // ── Track turn start time for the visual timer ─────────────────────────────
  // Updates whenever the current player changes or game starts.
  useEffect(() => {
    if (!gameState || gameState.phase === 'game-over') {
      setTurnStartedAt(null);
      return;
    }
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer?.id === 'player-human') {
      setTurnStartedAt(Date.now());
    } else {
      setTurnStartedAt(null);
    }
  }, [gameState?.currentPlayerIndex, gameState?.phase]);

  function startLocalGame(playerName: string, aiCount: number, humanAvatarId?: string, turnDuration?: number) {
    humanNameRef.current = playerName;
    turnDurationRef.current = turnDuration ?? 30;
    const clampedAI = Math.min(3, Math.max(1, aiCount));
    const playerCount = 1 + clampedAI;

    // Assign unique random colours to every player
    const takenColourIds: string[] = [];
    const humanColour = assignRandomColour(takenColourIds);
    takenColourIds.push(humanColour.id);

    // Assign unique random avatars — shuffle and pick without repeats where possible
    const avatarIds = AVATAR_DATA.map((a) => a.id);
    const shuffledAvatars = [...avatarIds].sort(() => Math.random() - 0.5);
    const humanUsedAvatar = humanAvatarId ?? shuffledAvatars[0]!;
    const aiAvatarPool = shuffledAvatars.filter((id) => id !== humanUsedAvatar);

    const players: Player[] = [
      { id: 'player-human', hand: [], isHuman: true, colourHex: humanColour.hex, avatarId: humanUsedAvatar, sceneId: 'midnight_rain' } as Player & { avatarId: string },
      ...Array.from({ length: clampedAI }, (_, i) => {
        const colour = assignRandomColour(takenColourIds);
        takenColourIds.push(colour.id);
        return { id: `ai-${i + 1}`, hand: [], isHuman: false, colourHex: colour.hex, avatarId: aiAvatarPool[i % aiAvatarPool.length]!, sceneId: 'midnight_rain' } as Player & { avatarId: string };
      }),
    ] as Player[];

    const deck = shuffleDeck(createDeck());
    const { hands, remaining } = dealCards(deck, playerCount, 7);

    // Flip first card of remaining to start discard pile
    const firstDiscard = remaining[0]!;
    const drawPile = remaining.slice(1);

    const playersWithHands: Player[] = players.map((p, i) => ({
      ...p,
      hand: hands[i]!,
    }));

    const sessionScores: Record<string, number> = {};
    for (const p of playersWithHands) {
      sessionScores[p.id] = 0;
    }

    const initialState: GameState = {
      deck: drawPile,
      discard: [firstDiscard],
      players: playersWithHands,
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
      sessionScores,
      onCardsDeclarations: [],
      currentPlayerHasActed: false,
    };

    stateRef.current = initialState;
    setGameState(initialState);
    aiRunningRef.current = false;

    // If somehow first player is AI (shouldn't happen but guard it)
    if (initialState.players[0]?.id !== 'player-human') {
      runGameLoop(initialState);
    }
  }

  function runGameLoop(state: GameState) {
    if (state.phase === 'game-over') {
      handleGameOver(state);
      return;
    }

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer) return;

    if (currentPlayer.id !== 'player-human' && !aiRunningRef.current) {
      handleAITurn(state);
    }
  }

  // Keep the ref in sync on every render
  runGameLoopRef.current = runGameLoop;

  async function handleAITurn(state: GameState) {
    aiRunningRef.current = true;
    setIsAIThinking(true);

    const delay = 1500 + Math.random() * 1300;
    await new Promise<void>((resolve) => setTimeout(resolve, delay));

    // Always read from ref to get latest state
    const currentState = stateRef.current ?? state;

    // Confirm it's still an AI turn
    const currentPlayer = currentState.players[currentState.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id === 'player-human') {
      setIsAIThinking(false);
      aiRunningRef.current = false;
      return;
    }

    let actedState: GameState;
    try {
      const move = pickAIMove(currentState);

      if (move === 'draw') {
        const drawCount = currentState.pendingPickup > 0 ? currentState.pendingPickup : 1;
        actedState = engineDrawCard(drawCount, currentState);
      } else {
        const cards = move as Card[];
        lastAIPlayCardsRef.current = cards; // preserve submission order for history banner
        const lastCard = cards[cards.length - 1]!;
        let declaredSuit: Suit | null = null;
        if (lastCard.rank === 'A') {
          declaredSuit = getBestSuitDeclaration(currentPlayer.hand, cards);
        }
        actedState = applyPlay(cards, declaredSuit, currentState);
      }
    } catch {
      // Fallback: if something goes wrong, just draw
      const drawCount = currentState.pendingPickup > 0 ? currentState.pendingPickup : 1;
      actedState = engineDrawCard(drawCount, currentState);
    }

    // AI never declares — advance turn immediately
    const newState = actedState.phase === 'game-over' ? actedState : advanceTurn(actedState);

    stateRef.current = newState;
    setGameState(newState);
    setIsAIThinking(false);
    aiRunningRef.current = false;

    runGameLoopRef.current(newState);
  }

  function getBestSuitDeclaration(hand: Card[], playedCards: Card[]): Suit {
    // Count suits in hand excluding the cards being played
    const playedSet = [...playedCards];
    const remainingHand = [...hand];
    for (const played of playedSet) {
      const idx = remainingHand.findIndex(
        (c) => c.rank === played.rank && c.suit === played.suit
      );
      if (idx !== -1) remainingHand.splice(idx, 1);
    }

    const counts: Record<Suit, number> = {
      spades: 0,
      hearts: 0,
      clubs: 0,
      diamonds: 0,
    };
    for (const card of remainingHand) {
      counts[card.suit]++;
    }

    const preference: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
    let best: Suit = 'spades';
    let bestCount = -1;
    for (const suit of preference) {
      if (counts[suit] > bestCount) {
        bestCount = counts[suit];
        best = suit;
      }
    }
    return best;
  }

  function handleGameOver(state: GameState) {
    // Write final state into the global store so results screen can read it
    storeSetGameState(state);
    setTimeout(() => {
      router.replace({
        pathname: '/results',
        params: { mode: 'local', playerName: humanNameRef.current },
      });
    }, 1500);
  }

  const humanPlay = useCallback(
    (cards: Card[], declaredSuit?: Suit) => {
      const state = stateRef.current;
      if (!state) return;

      if (!isValidCombo(cards, state)) {
        throw new Error('Invalid play');
      }

      const suit = declaredSuit ?? null;
      const actedState = applyPlay(cards, suit, state);

      if (actedState.phase === 'game-over') {
        stateRef.current = actedState;
        setGameState(actedState);
        runGameLoopRef.current(actedState);
        return;
      }

      // Stay on player's turn — they can now declare or end turn
      stateRef.current = actedState;
      setGameState(actedState);
      // Don't call runGameLoop — wait for humanEndTurn or humanDeclareOnCards
    },
    []
  );

  const humanDraw = useCallback(() => {
    const state = stateRef.current;
    if (!state) return;

    const drawCount = state.pendingPickup > 0 ? state.pendingPickup : 1;
    const isVoluntary = drawCount === 1 && state.pendingPickup === 0;
    const actedState = engineDrawCard(drawCount, state, isVoluntary);
    stateRef.current = actedState;
    setGameState(actedState);
    // Stay on player's turn — wait for humanEndTurn or humanDeclareOnCards
  }, []);

  const humanEndTurn = useCallback(() => {
    const state = stateRef.current;
    if (!state || !state.currentPlayerHasActed) return;

    const newState = advanceTurn(state);
    stateRef.current = newState;
    setGameState(newState);
    runGameLoopRef.current(newState);
  }, []);

  // Returns { isValid } so game.tsx can show appropriate toast
  const humanDeclareOnCards = useCallback((): boolean => {
    const state = stateRef.current;
    if (!state) return false;

    try {
      const { newState, isValid } = engineDeclareOnCards(myPlayerId, state);
      // Advance turn after declaration
      const advanced = advanceTurn(newState);
      stateRef.current = advanced;
      setGameState(advanced);
      runGameLoopRef.current(advanced);
      return isValid;
    } catch {
      return false;
    }
  }, []);

  // Applies a timeout strike for the human player (same as server-side applyTimeout).
  // Used by game.tsx when the local turn timer expires.
  const humanApplyTimeout = useCallback(() => {
    const state = stateRef.current;
    if (!state || state.phase === 'game-over') return;
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== 'player-human') return;

    const newState = applyTimeout(state);
    stateRef.current = newState;
    setGameState(newState);
    runGameLoopRef.current(newState);
  }, []);

  // Used by game screen to pause the timer while a modal is open.
  // Shifts turnStartedAt forward so elapsed time doesn't accumulate during the pause.
  const adjustTurnStartedAt = useCallback((msToAdd: number) => {
    setTurnStartedAt((prev) => (prev !== null ? prev + msToAdd : null));
  }, []);

  // Used by game screen to get player names for display
  const playerNames: Record<string, string> = {};
  if (gameState) {
    for (const p of gameState.players) {
      if (p.id === 'player-human') {
        playerNames[p.id] = humanNameRef.current;
      } else {
        const num = p.id.replace('ai-', '');
        playerNames[p.id] = `AI ${num}`;
      }
    }
  }

  return {
    gameState,
    myPlayerId,
    isAIThinking,
    playerNames,
    turnStartedAt,
    turnDurationRef,
    startLocalGame,
    humanPlay,
    humanDraw,
    humanEndTurn,
    humanDeclareOnCards,
    humanApplyTimeout,
    adjustTurnStartedAt,
    lastAIPlayCardsRef,
    // Ref always points to the latest state — use this for declarations so
    // the validation never reads a stale React-state closure value.
    localGameStateRef: stateRef,
  };
}
