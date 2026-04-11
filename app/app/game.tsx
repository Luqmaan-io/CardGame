import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSocket } from '../hooks/useSocket';
import { useLocalGame } from '../hooks/useLocalGame';
import { useGameStore } from '../store/gameStore';
import { GameBoard } from '../components/GameBoard';
import { SuitPicker } from '../components/SuitPicker';
import { TurnTimer } from '../components/TurnTimer';
import { Toast, ToastMessage } from '../components/Toast';
import { AnimationOverlay, AnimationOverlayHandle, animId } from '../components/AnimationOverlay';
import { useSounds } from '../hooks/useSounds';
import { useHaptics } from '../hooks/useHaptics';
import { HowToPlayModal } from '../components/HowToPlayModal';
import { getGamePositions } from '../utils/animations';
import { measurePosition, centreOf } from '../utils/measurePosition';
import { getValidPlays } from '../../engine/ai';
import { isValidPlay } from '../../engine/validation';
import type { Card, GameState, Suit } from '../../engine/types';
import { useAuth } from '../context/AuthContext';
import { recordGameStats } from '../lib/recordGameStats';

// ─── Power card ranks ─────────────────────────────────────────────────────────

const POWER_RANKS = new Set(['A', '2', '8', 'J', 'Q', 'K']);

function isPowerCard(card: Card): boolean {
  return POWER_RANKS.has(card.rank);
}

// ─── Deal timing by player count ─────────────────────────────────────────────

function dealIntervalMs(playerCount: number): number {
  if (playerCount <= 2) return 350;
  if (playerCount === 3) return 280;
  return 220; // 4 players
}

// ─── GameScreen ───────────────────────────────────────────────────────────────

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; playerName?: string; aiCount?: string; avatarId?: string }>();
  const isLocalMode = params.mode === 'local';
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // ── Audio / haptics ───────────────────────────────────────────────────────
  const { playSound, isMuted, toggleMute } = useSounds();
  const { trigger: haptic } = useHaptics();

  // ── Online hook (always mounted) ──────────────────────────────────────────
  const {
    playCards: socketPlayCards,
    drawCard: socketDrawCard,
    declareSuit: socketDeclareSuit,
    declareOnCards: socketDeclareOnCards,
    endTurn: socketEndTurn,
    connectionState,
  } = useSocket();
  const {
    gameState: onlineGameState,
    myPlayerId: onlineMyPlayerId,
    selectedCards,
    selectCard,
    deselectCard,
    clearSelection,
    pendingTimeoutNotification,
  } = useGameStore();

  // ── Local AI hook (always mounted) ────────────────────────────────────────
  const {
    gameState: localGameState,
    myPlayerId: localMyPlayerId,
    isAIThinking,
    playerNames: localPlayerNames,
    turnStartedAt: localTurnStartedAt,
    startLocalGame,
    humanPlay,
    humanDraw,
    humanEndTurn,
    humanDeclareOnCards,
    humanApplyTimeout,
    adjustTurnStartedAt,
  } = useLocalGame();

  // Pick active game data based on mode
  const gameState: GameState | null = isLocalMode ? localGameState : onlineGameState;
  const myPlayerId: string = isLocalMode ? localMyPlayerId : onlineMyPlayerId;

  const [showSuitPicker, setShowSuitPicker] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(0);

  // ── Deal animation state ──────────────────────────────────────────────────
  const [isDealing, setIsDealing] = useState(false);
  const [dealtCardCounts, setDealtCardCounts] = useState<Record<string, number> | null>(null);
  // Tracks the visual deck count shrinking as cards are dealt
  const [deckCountOverride, setDeckCountOverride] = useState<number | null>(null);
  // Cancel token: incremented on skip to abort the async deal loop
  const dealGenRef = useRef(0);
  const dealStartedRef = useRef(false);

  // ── Animation overlay ref ─────────────────────────────────────────────────
  const overlayRef = useRef<AnimationOverlayHandle>(null);

  // ── Pixel-accurate layout refs ────────────────────────────────────────────
  const drawPileRef = useRef<View>(null);
  const discardPileRef = useRef<View>(null);
  const humanHandRef = useRef<View>(null);
  const opponentRefs = useRef<Record<string, View | null>>({});

  // ── Flashing player (timeout animation) ──────────────────────────────────
  const [flashingPlayerId, setFlashingPlayerId] = useState<string | null>(null);

  // ── How to play modal ─────────────────────────────────────────────────────
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const modalOpenedAtRef = useRef<number | null>(null);

  // ── Auth context (for stats recording) ────────────────────────────────────
  const { profile, isGuest } = useAuth();

  // ── Game stats tracking ────────────────────────────────────────────────────
  const gameStatsRef = useRef({
    turnsPlayed: 0,
    maxCardsHeld: 0,
    cardsDrawn: 0,
    biggestPickup: 0,
    blackJacksReceived: 0,
    blackJacksCountered: 0,
    twosStacked: 0,
    twosReceived: 0,
    falseOnCardsCount: 0,
    correctOnCardsCount: 0,
    timedOutCount: 0,
    wasKicked: false,
    lastSuitWonWith: undefined as string | undefined,
  });

  // ── On-cards declaration window (Fix 2) ────────────────────────────────────
  const [showOnCardsWindow, setShowOnCardsWindow] = useState(false);
  const [onCardsCountdown, setOnCardsCountdown] = useState(3);
  const onCardsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCardsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref always points to the latest render's startOnCardsWindow so setTimeout
  // callbacks don't capture a stale closure.
  const startOnCardsWindowRef = useRef<() => void>(() => {});

  // ── Auto-draw countdown (Fix 3) ───────────────────────────────────────────
  const [autoDrawCountdown, setAutoDrawCountdown] = useState<number | null>(null);
  const autoDrawTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Set true when we initiate auto-draw for the current turn; prevents re-trigger
  const autoDrawInitiatedRef = useRef(false);
  // Set true if the player explicitly cancels; prevents re-trigger after cancel
  const autoDrawCancelledRef = useRef(false);
  // Set true after a draw action to trigger auto-advance in online mode
  const pendingAutoAdvanceAfterDrawRef = useRef(false);

  // ── Track previous game state for detecting mid-game changes ─────────────
  // Not updated during the deal sequence — only armed after deal completes.
  const prevGameStateRef = useRef<GameState | null>(null);
  const prevMyHandLengthRef = useRef<number>(0);
  const prevDiscardTopRef = useRef<string | null>(null);
  const prevPendingPickupRef = useRef<number>(0);
  // Armed once deal finishes so mid-game detections don't fire during deal
  const gameEventsArmedRef = useRef(false);

  function addToast(text: string) {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, text }]);
  }

  // ── On-cards window helpers ───────────────────────────────────────────────

  function advanceTurnFn() {
    if (isLocalMode) {
      humanEndTurn();
    } else {
      socketEndTurn();
    }
  }

  function closeOnCardsWindow() {
    setShowOnCardsWindow(false);
    if (onCardsTimerRef.current) { clearTimeout(onCardsTimerRef.current); onCardsTimerRef.current = null; }
    if (onCardsIntervalRef.current) { clearInterval(onCardsIntervalRef.current); onCardsIntervalRef.current = null; }
  }

  function startOnCardsWindow() {
    // Guard: only open if still my turn and acted
    const state = isLocalMode ? localGameState : onlineGameState;
    if (!state) return;
    const current = state.players[state.currentPlayerIndex];
    const isMine = current?.id === (isLocalMode ? localMyPlayerId : onlineMyPlayerId);
    if (!isMine || !state.currentPlayerHasActed) return;
    if (state.phase === 'declare-suit') return;

    setShowOnCardsWindow(true);
    setOnCardsCountdown(3);

    onCardsIntervalRef.current = setInterval(() => {
      setOnCardsCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    onCardsTimerRef.current = setTimeout(() => {
      closeOnCardsWindow();
      advanceTurnFn();
    }, 3100); // 3.1s gives the interval a final tick at 0
  }
  // Always point to the latest render so setTimeout callbacks don't go stale.
  startOnCardsWindowRef.current = startOnCardsWindow;

  // ── Auto-draw helpers ─────────────────────────────────────────────────────

  function cancelAutoDraw() {
    autoDrawCancelledRef.current = true;
    setAutoDrawCountdown(null);
    if (autoDrawTimerRef.current) { clearInterval(autoDrawTimerRef.current); autoDrawTimerRef.current = null; }
  }

  // ── runDealSequence ───────────────────────────────────────────────────────
  // Reveals cards one at a time, rotating through players.
  // Mutates dealtCardCounts and deckCountOverride on each step.

  const runDealSequence = useCallback(async (state: GameState) => {
    const gen = ++dealGenRef.current; // generation for cancel-on-skip

    const playerCount = state.players.length;
    const totalCards = 7;
    const interval = dealIntervalMs(playerCount);

    // Starting visual deck count = actual deck + all cards about to be dealt
    const totalToBeDealt = playerCount * totalCards;
    let visualDeckCount = state.deck.length + totalToBeDealt;
    setDeckCountOverride(visualDeckCount);

    // Initialise all counts at 0
    const initial: Record<string, number> = {};
    for (const p of state.players) initial[p.id] = 0;
    setDealtCardCounts({ ...initial });
    setIsDealing(true);

    // Measure pixel-accurate positions (with fallback to screen-fraction estimates)
    const fallback = getGamePositions(screenWidth, screenHeight);
    const deckPos = await measurePosition(drawPileRef).catch(() => null);
    const handPos = await measurePosition(humanHandRef).catch(() => null);

    const deckOrigin = deckPos ? centreOf(deckPos) : fallback.deck;
    const handTarget = handPos ? centreOf(handPos) : fallback.myHand;

    // Pre-measure opponent positions
    const oppTargets: Record<string, { x: number; y: number }> = {};
    const opponents = state.players.filter((p) => p.id !== myPlayerId);
    for (let i = 0; i < opponents.length; i++) {
      const opp = opponents[i]!;
      const oppRef = opponentRefs.current[opp.id];
      if (oppRef) {
        const pos = await measurePosition({ current: oppRef }).catch(() => null);
        oppTargets[opp.id] = pos ? centreOf(pos) : fallback.opponent(i, opponents.length);
      } else {
        oppTargets[opp.id] = fallback.opponent(i, opponents.length);
      }
    }

    for (let cardNum = 1; cardNum <= totalCards; cardNum++) {
      for (let playerIdx = 0; playerIdx < playerCount; playerIdx++) {
        // Check if skipped
        if (dealGenRef.current !== gen) return;

        const player = state.players[playerIdx]!;
        const playerId = player.id;
        const isHuman = playerId === myPlayerId;

        const toPos = isHuman
          ? handTarget
          : (oppTargets[playerId] ?? fallback.opponent(0, opponents.length));

        // Add flying card to overlay
        overlayRef.current?.addCards([
          {
            id: animId(),
            card: isHuman ? (player.hand[cardNum - 1] ?? null) : null,
            fromX: deckOrigin.x,
            fromY: deckOrigin.y,
            toX: toPos.x,
            toY: toPos.y,
            delay: 0,
            duration: Math.min(interval - 20, 300),
            onComplete: undefined,
          },
        ]);

        // Decrement visual deck
        visualDeckCount -= 1;
        setDeckCountOverride(visualDeckCount);

        // Sound + haptic when card lands in human hand
        playSound('card_deal');
        if (isHuman) haptic('light');

        // Wait the interval, then reveal the card
        await new Promise<void>((resolve) => setTimeout(resolve, interval));
        if (dealGenRef.current !== gen) return;

        // Reveal this card in the player's hand
        setDealtCardCounts((prev) => {
          if (!prev) return prev;
          return { ...prev, [playerId]: cardNum };
        });
      }
    }

    if (dealGenRef.current !== gen) return;

    // Deal complete — arm game-event detections and hand back control
    setIsDealing(false);
    setDealtCardCounts(null);     // null = show all cards normally
    setDeckCountOverride(null);   // null = show real deck count

    // Arm mid-game change detection, seeded with current state
    prevGameStateRef.current = state;
    const myPlayer = state.players.find((p) => p.id === myPlayerId);
    prevMyHandLengthRef.current = myPlayer?.hand.length ?? 0;
    const discardTop = state.discard[state.discard.length - 1];
    prevDiscardTopRef.current = discardTop ? `${discardTop.rank}-${discardTop.suit}` : null;
    prevPendingPickupRef.current = state.pendingPickup;
    gameEventsArmedRef.current = true;
  }, [myPlayerId, screenWidth, screenHeight, drawPileRef, humanHandRef, opponentRefs]);

  // ── handleSkipDeal ────────────────────────────────────────────────────────
  function handleSkipDeal() {
    if (!gameState) return;
    // Increment gen to abort the async loop on its next await
    dealGenRef.current++;
    overlayRef.current?.clearAll();

    // Reveal all cards immediately
    const full: Record<string, number> = {};
    for (const p of gameState.players) full[p.id] = p.hand.length;
    setDealtCardCounts(null);
    setDeckCountOverride(null);
    setIsDealing(false);

    // Arm mid-game events
    const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
    prevGameStateRef.current = gameState;
    prevMyHandLengthRef.current = myPlayer?.hand.length ?? 0;
    const discardTop = gameState.discard[gameState.discard.length - 1];
    prevDiscardTopRef.current = discardTop ? `${discardTop.rank}-${discardTop.suit}` : null;
    prevPendingPickupRef.current = gameState.pendingPickup;
    gameEventsArmedRef.current = true;
  }

  // ── Start local game on mount ─────────────────────────────────────────────
  const localGameStartedRef = useRef(false);
  useEffect(() => {
    if (isLocalMode && !localGameStartedRef.current) {
      localGameStartedRef.current = true;
      const name = params.playerName ?? 'Player';
      const count = parseInt(params.aiCount ?? '1', 10);
      startLocalGame(name, count, params.avatarId);
    }
  }, []);

  // ── Trigger deal sequence once when game state first arrives ──────────────
  useEffect(() => {
    if (!gameState) return;
    if (dealStartedRef.current) return;
    // Only start deal once we have a player with cards
    const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
    if (!myPlayer || myPlayer.hand.length === 0) return;

    dealStartedRef.current = true;
    runDealSequence(gameState);
  }, [gameState, myPlayerId, runDealSequence]);

  // ── Online: navigate to results on game-over ──────────────────────────────
  useEffect(() => {
    if (!isLocalMode && onlineGameState?.phase === 'game-over') {
      router.replace('/results');
    }
  }, [onlineGameState?.phase, isLocalMode]);

  // ── Online: toast notifications ───────────────────────────────────────────
  useEffect(() => {
    if (!pendingTimeoutNotification) return;
    addToast(pendingTimeoutNotification);
    useGameStore.getState().setPendingTimeoutNotification(null);
  }, [pendingTimeoutNotification]);

  // ── Online: suit picker on declare-suit ───────────────────────────────────
  useEffect(() => {
    if (
      !isLocalMode &&
      gameState?.phase === 'declare-suit' &&
      gameState?.players[gameState.currentPlayerIndex]?.id === myPlayerId
    ) {
      setShowSuitPicker(true);
    }
  }, [gameState?.phase, myPlayerId, isLocalMode]);

  // ── Mid-game change detection (opponent plays, draws, penalties, timeouts) ─
  // Only fires after deal is complete (gameEventsArmedRef.current === true).

  useEffect(() => {
    if (!gameState) return;
    if (!gameEventsArmedRef.current) return;

    const fallback = getGamePositions(screenWidth, screenHeight);
    const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
    const opponents = gameState.players.filter((p) => p.id !== myPlayerId);
    const discardTop = gameState.discard[gameState.discard.length - 1];
    const discardKey = discardTop ? `${discardTop.rank}-${discardTop.suit}` : null;
    const myHandLength = myPlayer?.hand.length ?? 0;
    const prevHandLength = prevMyHandLengthRef.current;
    const prevPending = prevPendingPickupRef.current;
    const currPending = gameState.pendingPickup;

    // ── Opponent plays a card ───────────────────────────────────────────────
    if (
      prevGameStateRef.current &&
      discardKey !== prevDiscardTopRef.current &&
      discardKey !== null
    ) {
      const justPlayedBy = gameState.players.find((p) => {
        const prev = prevGameStateRef.current?.players.find((pp) => pp.id === p.id);
        return prev && prev.hand.length > p.hand.length;
      });

      if (justPlayedBy && justPlayedBy.id !== myPlayerId) {
        const oppIdx = opponents.findIndex((o) => o.id === justPlayedBy.id);
        // Try measured position, fall back to screen fraction
        const oppRef = opponentRefs.current[justPlayedBy.id];
        const getOppPos = async () => {
          if (oppRef) {
            const pos = await measurePosition({ current: oppRef }).catch(() => null);
            if (pos) return centreOf(pos);
          }
          return fallback.opponent(oppIdx, opponents.length);
        };
        const getDiscardPos = async () => {
          const pos = await measurePosition(discardPileRef).catch(() => null);
          return pos ? centreOf(pos) : fallback.discard;
        };

        Promise.all([getOppPos(), getDiscardPos()]).then(([fromPos, toPos]) => {
          overlayRef.current?.addCards([
            {
              id: animId(),
              card: null,
              fromX: fromPos.x,
              fromY: fromPos.y,
              toX: toPos.x,
              toY: toPos.y,
              delay: 0,
              duration: 400,
              onComplete: undefined,
            },
          ]);
        });
        playSound('card_slide');
        setTimeout(() => {
          if (discardTop && isPowerCard(discardTop)) {
            playSound('power_card');
          } else {
            playSound('card_flip');
          }
        }, 420);
      }
    }

    // ── Human draws a single card ───────────────────────────────────────────
    if (
      prevGameStateRef.current &&
      myHandLength > prevHandLength &&
      myHandLength - prevHandLength === 1 &&
      prevPending === 0
    ) {
      const getDeckPos = async () => {
        const pos = await measurePosition(drawPileRef).catch(() => null);
        return pos ? centreOf(pos) : fallback.deck;
      };
      const getHandPos = async () => {
        const pos = await measurePosition(humanHandRef).catch(() => null);
        return pos ? centreOf(pos) : fallback.myHand;
      };

      Promise.all([getDeckPos(), getHandPos()]).then(([fromPos, toPos]) => {
        overlayRef.current?.addCards([
          {
            id: animId(),
            card: myPlayer?.hand[myPlayer.hand.length - 1] ?? null,
            fromX: fromPos.x,
            fromY: fromPos.y,
            toX: toPos.x,
            toY: toPos.y,
            delay: 0,
            duration: 300,
            onComplete: undefined,
          },
        ]);
      });
      playSound('card_draw');
    }

    // ── Penalty draw ────────────────────────────────────────────────────────
    if (
      prevGameStateRef.current &&
      prevPending > 0 &&
      currPending === 0 &&
      myHandLength > prevHandLength
    ) {
      const count = myHandLength - prevHandLength;
      playSound('penalty');
      haptic('warning');

      const getDeckPos = async () => {
        const pos = await measurePosition(drawPileRef).catch(() => null);
        return pos ? centreOf(pos) : fallback.deck;
      };
      const getHandPos = async () => {
        const pos = await measurePosition(humanHandRef).catch(() => null);
        return pos ? centreOf(pos) : fallback.myHand;
      };

      Promise.all([getDeckPos(), getHandPos()]).then(([fromPos, toPos]) => {
        for (let i = 0; i < count; i++) {
          overlayRef.current?.addCards([
            {
              id: animId(),
              card: myPlayer?.hand[myPlayer.hand.length - count + i] ?? null,
              fromX: fromPos.x,
              fromY: fromPos.y,
              toX: toPos.x + (i - Math.floor(count / 2)) * 12,
              toY: toPos.y,
              delay: i * 150,
              duration: 300,
              onComplete: undefined,
            },
          ]);
          if (i > 0) {
            setTimeout(() => playSound('card_draw'), i * 150);
          }
        }
      });
    }

    // ── Timeout strikes ─────────────────────────────────────────────────────
    if (prevGameStateRef.current) {
      for (const player of gameState.players) {
        const prevStrikes = prevGameStateRef.current.timeoutStrikes[player.id] ?? 0;
        const currStrikes = gameState.timeoutStrikes[player.id] ?? 0;
        if (currStrikes > prevStrikes) {
          if (player.id !== myPlayerId) {
            setFlashingPlayerId(player.id);
            setTimeout(() => setFlashingPlayerId(null), 1600);
          }
          playSound('timeout');
          if (player.id === myPlayerId) haptic('error');
        }
      }
    }

    // ── Reshuffle ───────────────────────────────────────────────────────────
    if (
      prevGameStateRef.current &&
      gameState.deck.length > prevGameStateRef.current.deck.length + 5
    ) {
      playSound('shuffle');
      addToast('Reshuffling deck…');
    }

    prevGameStateRef.current = gameState;
    prevMyHandLengthRef.current = myHandLength;
    prevDiscardTopRef.current = discardKey;
    prevPendingPickupRef.current = currPending;
  }, [gameState]);

  // ── Win detection ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState?.phase === 'game-over' && gameState.winnerId === myPlayerId) {
      playSound('win');
      haptic('success');
    }
  }, [gameState?.phase, gameState?.winnerId]);

  // ── Stats: track turnsPlayed and maxCardsHeld ─────────────────────────────
  const prevTurnPlayerRef = useRef<string | null>(null);
  useEffect(() => {
    if (!gameState || !gameEventsArmedRef.current) return;
    const current = gameState.players[gameState.currentPlayerIndex];
    // When the current player changes away from me — that turn is done
    if (prevTurnPlayerRef.current === myPlayerId && current?.id !== myPlayerId) {
      gameStatsRef.current.turnsPlayed++;
    }
    prevTurnPlayerRef.current = current?.id ?? null;

    // Track max cards held
    const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
    if (myPlayer) {
      gameStatsRef.current.maxCardsHeld = Math.max(gameStatsRef.current.maxCardsHeld, myPlayer.hand.length);
    }
  }, [gameState?.currentPlayerIndex, gameState]);

  // ── Stats: track timeout strikes and kicks on my player ───────────────────
  const prevMyStrikesRef = useRef(0);
  useEffect(() => {
    if (!gameState || !gameEventsArmedRef.current) return;
    const myStrikes = gameState.timeoutStrikes[myPlayerId] ?? 0;
    if (myStrikes > prevMyStrikesRef.current) {
      gameStatsRef.current.timedOutCount++;
      if (myStrikes >= 3) gameStatsRef.current.wasKicked = true;
    }
    prevMyStrikesRef.current = myStrikes;
  }, [gameState?.timeoutStrikes]);

  // ── Stats: record when game ends ──────────────────────────────────────────
  const statsRecordedRef = useRef(false);
  useEffect(() => {
    if (gameState?.phase !== 'game-over') return;
    if (statsRecordedRef.current) return;
    if (!profile || isGuest) return;
    statsRecordedRef.current = true;

    const won = gameState.winnerId === myPlayerId;
    // Best-effort: find winning suit from last discard if we won
    const winCard = won ? gameState.discard[gameState.discard.length - 1] : undefined;
    if (winCard) gameStatsRef.current.lastSuitWonWith = winCard.suit;

    // Find opponent (first non-me player)
    const opponent = gameState.players.find((p) => p.id !== myPlayerId);
    const opponentUsername = isLocalMode
      ? localPlayerNames[opponent?.id ?? ''] ?? 'AI'
      : undefined; // online: we don't have opponent userId easily, skip nemesis in v1

    recordGameStats({
      userId: profile.id,
      isGuest: false,
      won,
      turnsPlayed: gameStatsRef.current.turnsPlayed,
      maxCardsHeld: gameStatsRef.current.maxCardsHeld,
      cardsDrawn: gameStatsRef.current.cardsDrawn,
      biggestPickup: gameStatsRef.current.biggestPickup,
      blackJacksReceived: gameStatsRef.current.blackJacksReceived,
      blackJacksCountered: gameStatsRef.current.blackJacksCountered,
      twosStacked: gameStatsRef.current.twosStacked,
      twosReceived: gameStatsRef.current.twosReceived,
      falseOnCardsCount: gameStatsRef.current.falseOnCardsCount,
      correctOnCardsCount: gameStatsRef.current.correctOnCardsCount,
      timedOutCount: gameStatsRef.current.timedOutCount,
      wasKicked: gameStatsRef.current.wasKicked,
      opponentUsername,
      suitWonWith: gameStatsRef.current.lastSuitWonWith,
    }).catch(() => { /* best-effort — don't block UI */ });
  }, [gameState?.phase]);

  // ── Close on-cards window + reset auto-draw when turn is no longer mine ──
  useEffect(() => {
    if (!gameState) return;
    const current = gameState.players[gameState.currentPlayerIndex];
    const isMine = current?.id === myPlayerId;
    if (!isMine || gameState.phase === 'game-over') {
      closeOnCardsWindow();
      cancelAutoDraw();
      autoDrawInitiatedRef.current = false;
      autoDrawCancelledRef.current = false;
      pendingAutoAdvanceAfterDrawRef.current = false;
    }
  }, [gameState?.currentPlayerIndex, gameState?.phase]);

  // ── Online mode: auto-advance turn after draw card ────────────────────────
  useEffect(() => {
    if (isLocalMode) return;
    if (!gameState) return;
    if (!pendingAutoAdvanceAfterDrawRef.current) return;
    const current = gameState.players[gameState.currentPlayerIndex];
    if (current?.id !== myPlayerId) return;
    if (!gameState.currentPlayerHasActed) return;

    pendingAutoAdvanceAfterDrawRef.current = false;
    // Small delay so the draw animation completes before advancing
    const id = setTimeout(() => socketEndTurn(), 400);
    return () => clearTimeout(id);
  }, [gameState?.currentPlayerHasActed, gameState?.currentPlayerIndex, isLocalMode]);

  // ── Auto-draw detection: my turn + penalty + no counter ──────────────────
  useEffect(() => {
    if (!gameState || !gameEventsArmedRef.current || isDealing) return;
    const current = gameState.players[gameState.currentPlayerIndex];
    const isMine = current?.id === myPlayerId;

    if (!isMine || gameState.pendingPickup === 0) {
      autoDrawInitiatedRef.current = false;
      autoDrawCancelledRef.current = false;
      return;
    }
    if (gameState.currentPlayerHasActed) return; // already acted this turn
    if (autoDrawInitiatedRef.current) return;
    if (autoDrawCancelledRef.current) return;

    const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
    const hasCounter = myPlayer?.hand.some((card) => isValidPlay(card, gameState)) ?? false;

    if (!hasCounter) {
      autoDrawInitiatedRef.current = true;
      setAutoDrawCountdown(3);
      let count = 3;
      const interval = setInterval(() => {
        count--;
        setAutoDrawCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          autoDrawTimerRef.current = null;
          setAutoDrawCountdown(null);
          handleDrawFn();
        }
      }, 1000);
      autoDrawTimerRef.current = interval;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.currentPlayerIndex, gameState?.pendingPickup, isDealing]);

  // ── Local mode: fire humanApplyTimeout when 30s expires ──────────────────
  // NOTE: gameState?.currentPlayerHasActed and showHowToPlay are in deps so the
  // effect re-runs (and its cleanup cancels the pending timeout) the moment the
  // human acts OR the modal opens.
  useEffect(() => {
    if (!isLocalMode) return;
    if (!gameState || gameState.phase === 'game-over') return;
    if (!gameEventsArmedRef.current || isDealing) return;
    const current = gameState.players[gameState.currentPlayerIndex];
    if (!current || current.id !== myPlayerId) return;
    if (!localTurnStartedAt) return;
    // Already acted — cancel any pending timeout and don't schedule a new one
    if (gameState.currentPlayerHasActed) return;
    // Modal open — pause the turn timer; no timeout while rules are being read
    if (showHowToPlay) return;

    const elapsed = Date.now() - localTurnStartedAt;
    const remaining = Math.max(0, 30000 - elapsed);

    const id = setTimeout(() => humanApplyTimeout(), remaining);
    return () => clearTimeout(id);
  }, [isLocalMode, isDealing, localTurnStartedAt, gameState?.phase, gameState?.currentPlayerHasActed, showHowToPlay]);

  // ── Early return: no game state yet ──────────────────────────────────────
  if (!gameState) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>
          {isLocalMode ? 'Setting up game…' : 'Waiting for game…'}
        </Text>
      </View>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const hasPendingPickup = gameState.pendingPickup > 0;
  const hasActed = gameState.currentPlayerHasActed;

  // Block all player interaction during deal
  const localActionDisabled = isDealing || (isLocalMode && (!isMyTurn || isAIThinking));
  const validPlays =
    isMyTurn && !isAIThinking && !hasActed && !isDealing
      ? getValidPlays(gameState)
      : [];
  const playerNamesMap: Record<string, string> = isLocalMode ? localPlayerNames : {};

  function getMessage(): string {
    if (isDealing) return 'Dealing…';
    if (isLocalMode && isAIThinking) {
      const aiName = localPlayerNames[currentPlayer?.id ?? ''] ?? 'AI';
      return `${aiName} is thinking…`;
    }
    if (gameState!.phase === 'declare-suit') return 'Choose a suit';
    if (isMyTurn && hasActed) return '';
    if (!isMyTurn) {
      if (isLocalMode) {
        return `${localPlayerNames[currentPlayer?.id ?? ''] ?? 'AI'}'s turn`;
      }
      return `${currentPlayer?.id.slice(0, 8) ?? '?'}'s turn`;
    }
    if (hasPendingPickup) {
      const type = gameState!.pendingPickupType === 'jack' ? 'J' : '2';
      return `Draw ${gameState!.pendingPickup} (${type}) or counter`;
    }
    if (gameState!.phase === 'cover') return 'Cover the Queen';
    if (gameState!.phase === 'pickup') return `Draw ${gameState!.pendingPickup} cards`;
    return 'Your turn';
  }

  function handleCardSelect(card: Card) {
    const already = selectedCards.some(
      (c) => c.rank === card.rank && c.suit === card.suit
    );
    if (already) {
      deselectCard(card);
    } else {
      selectCard(card);
      haptic('light');
      playSound('card_slide');
    }
  }

  async function handlePlay() {
    if (selectedCards.length === 0) return;

    const lastCard = selectedCards[selectedCards.length - 1];
    if (lastCard?.rank === 'A') {
      setShowSuitPicker(true);
      return;
    }

    const hasPower = selectedCards.some(isPowerCard);
    if (hasPower) {
      playSound('power_card');
    } else {
      playSound('card_flip');
    }
    haptic('medium');

    // Measure hand + discard positions for pixel-accurate fly animation
    const fallback = getGamePositions(screenWidth, screenHeight);
    const handPos = await measurePosition(humanHandRef).catch(() => null);
    const discardPos = await measurePosition(discardPileRef).catch(() => null);
    const from = handPos ? centreOf(handPos) : fallback.myHand;
    const to = discardPos ? centreOf(discardPos) : fallback.discard;

    const cards = selectedCards.slice(); // capture before clearSelection
    cards.forEach((card, i) => {
      overlayRef.current?.addCards([
        {
          id: animId(),
          card,
          fromX: from.x + (i - Math.floor(cards.length / 2)) * 40,
          fromY: from.y,
          toX: to.x,
          toY: to.y,
          delay: i * 100,
          duration: 350,
          onComplete: undefined,
        },
      ]);
    });

    // Track power card counters (lastCard is already declared above)
    if (lastCard && gameState!.pendingPickupType === '2' && lastCard.rank === '2') gameStatsRef.current.twosStacked++;
    if (lastCard && gameState!.pendingPickupType === 'jack' && lastCard.rank === 'J' && (lastCard.suit === 'hearts' || lastCard.suit === 'diamonds')) gameStatsRef.current.blackJacksCountered++;

    if (isLocalMode) {
      try { humanPlay(cards); } catch { /* invalid */ }
    } else {
      socketPlayCards(cards);
    }
    clearSelection();
    // Open on-cards window after card animation (~350ms).
    // Use ref so the callback reads fresh state, not the stale closure.
    setTimeout(() => startOnCardsWindowRef.current(), 420);
  }

  async function handleSuitSelected(suit: Suit) {
    setShowSuitPicker(false);
    playSound('power_card');
    haptic('medium');

    const fallback = getGamePositions(screenWidth, screenHeight);
    const handPos = await measurePosition(humanHandRef).catch(() => null);
    const discardPos = await measurePosition(discardPileRef).catch(() => null);
    const from = handPos ? centreOf(handPos) : fallback.myHand;
    const to = discardPos ? centreOf(discardPos) : fallback.discard;

    const cards = selectedCards.slice(); // capture before clearSelection
    cards.forEach((card, i) => {
      overlayRef.current?.addCards([
        {
          id: animId(),
          card,
          fromX: from.x + (i - Math.floor(cards.length / 2)) * 40,
          fromY: from.y,
          toX: to.x,
          toY: to.y,
          delay: i * 100,
          duration: 350,
          onComplete: undefined,
        },
      ]);
    });

    // Track power card counters (Ace plays with declared suit)
    const lastCard2 = cards[cards.length - 1];
    if (lastCard2) {
      if (gameState!.pendingPickupType === '2' && lastCard2.rank === '2') gameStatsRef.current.twosStacked++;
      if (gameState!.pendingPickupType === 'jack' && lastCard2.rank === 'J' && (lastCard2.suit === 'hearts' || lastCard2.suit === 'diamonds')) gameStatsRef.current.blackJacksCountered++;
    }

    if (isLocalMode) {
      try { humanPlay(cards, suit); } catch { /* invalid */ }
    } else {
      socketPlayCards(cards, suit);
    }
    clearSelection();
    // Open on-cards window after card animation (~350ms).
    // Use ref so the callback reads fresh state, not the stale closure.
    setTimeout(() => startOnCardsWindowRef.current(), 420);
  }

  // handleDrawFn is the underlying draw — also used by auto-draw countdown
  function handleDrawFn() {
    haptic('light');

    // Track draw stats before the state changes
    const drawCount = gameState!.pendingPickup > 0 ? gameState!.pendingPickup : 1;
    gameStatsRef.current.cardsDrawn += drawCount;
    if (drawCount > 1) {
      gameStatsRef.current.biggestPickup = Math.max(gameStatsRef.current.biggestPickup, drawCount);
      if (gameState!.pendingPickupType === 'jack') gameStatsRef.current.blackJacksReceived++;
      else if (gameState!.pendingPickupType === '2') gameStatsRef.current.twosReceived++;
    }

    if (isLocalMode) {
      humanDraw();
      // Auto-advance turn after draw animation
      setTimeout(() => humanEndTurn(), 450);
    } else {
      socketDrawCard();
      pendingAutoAdvanceAfterDrawRef.current = true;
    }
    clearSelection();
  }

  function handleDraw() {
    handleDrawFn();
  }

  function handleDeclareSuit(suit: Suit) {
    setShowSuitPicker(false);
    if (isLocalMode) {
      handleSuitSelected(suit);
    } else {
      if (gameState!.phase === 'declare-suit') {
        socketDeclareSuit(suit);
      } else {
        handleSuitSelected(suit);
      }
    }
  }

  function handleDeclareOnCards() {
    closeOnCardsWindow();
    playSound('on_cards');
    haptic('success');
    if (isLocalMode) {
      const isValid = humanDeclareOnCards(); // advances turn internally
      if (isValid) {
        gameStatsRef.current.correctOnCardsCount++;
        const humanName = localPlayerNames[localMyPlayerId] ?? 'You';
        addToast(`${humanName} is on cards!`);
      } else {
        gameStatsRef.current.falseOnCardsCount++;
        addToast("You're not on cards — 2 cards added to your hand");
        haptic('error');
      }
    } else {
      socketDeclareOnCards(); // server declares + advances turn
    }
  }

  const onCardsActive = gameState.onCardsDeclarations.includes(myPlayerId);
  const showPreAction =
    isMyTurn && !hasActed && !isAIThinking && !isDealing && gameState.phase !== 'declare-suit';

  // timerStartedAt: cleared the moment the player acts so TurnTimer freezes/stops.
  // Local mode uses hook-tracked time; online uses server-stamped time.
  // Also frozen (display-only) while the HowToPlay modal is open in local mode.
  const rawTimerStartedAt = hasActed
    ? null
    : (isLocalMode ? localTurnStartedAt : gameState.timerStartedAt);
  const timerStartedAt = (isLocalMode && showHowToPlay && rawTimerStartedAt !== null && modalOpenedAtRef.current !== null)
    ? Date.now() - (modalOpenedAtRef.current - rawTimerStartedAt)  // freeze elapsed at modal-open time
    : rawTimerStartedAt;

  // Current player's colour for timer bar and turn message
  const currentPlayerColourHex = currentPlayer?.colourHex;
  // Message colour: applied when the message is a player-turn message (not system messages)
  const messageIsPlayerTurn = !isDealing && !isMyTurn && gameState.phase !== 'declare-suit';
  const messageColourHex = messageIsPlayerTurn ? currentPlayerColourHex : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <Toast
        messages={toasts}
        onExpire={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* Mute toggle */}
      <TouchableOpacity style={styles.muteBtn} onPress={toggleMute}>
        <Text style={styles.muteBtnText}>{isMuted ? '🔇' : '🔊'}</Text>
      </TouchableOpacity>

      {/* How to play button */}
      <TouchableOpacity
        style={styles.howToPlayBtn}
        onPress={() => {
          if (!showHowToPlay) {
            modalOpenedAtRef.current = Date.now();
          } else if (isLocalMode && modalOpenedAtRef.current !== null) {
            adjustTurnStartedAt(Date.now() - modalOpenedAtRef.current);
            modalOpenedAtRef.current = null;
          }
          setShowHowToPlay((v) => !v);
        }}
      >
        <Text style={styles.howToPlayBtnText}>?</Text>
      </TouchableOpacity>

      {/* Skip deal button — only visible while dealing */}
      {isDealing && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkipDeal}>
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      )}

      <GameBoard
        gameState={gameState}
        myPlayerId={myPlayerId}
        validPlays={validPlays}
        selectedCards={selectedCards}
        onCardSelect={(!isMyTurn || localActionDisabled || hasActed) ? () => {} : handleCardSelect}
        onClearSelection={clearSelection}
        isMyTurn={isMyTurn && !isAIThinking && !hasActed && !isDealing}
        selectionDisabled={localActionDisabled || hasActed}
        playerNames={playerNamesMap}
        message={getMessage()}
        flashingPlayerId={flashingPlayerId}
        isDealing={isDealing}
        dealtCardCounts={dealtCardCounts ?? undefined}
        deckCountOverride={deckCountOverride}
        drawPileRef={drawPileRef}
        discardPileRef={discardPileRef}
        humanHandRef={humanHandRef}
        opponentRefs={opponentRefs}
        isReconnecting={!isLocalMode && (connectionState === 'disconnected' || connectionState === 'reconnecting')}
        onReconnectTimeout={() => {
          useGameStore.getState().setError('You were removed from the game');
          router.replace('/');
        }}
        messageColourHex={messageColourHex}
      />

      <AnimationOverlay ref={overlayRef} />

      {/* Timer — shown in all game modes, hidden during deal */}
      {!isDealing && (
        <TurnTimer timerStartedAt={timerStartedAt} currentPlayerColourHex={currentPlayerColourHex} />
      )}

      {showPreAction && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.drawBtn} onPress={handleDraw}>
            <Text style={styles.drawBtnText}>
              {hasPendingPickup ? `Draw ${gameState.pendingPickup}` : 'Draw card'}
            </Text>
          </TouchableOpacity>

          {selectedCards.length > 0 && (
            <TouchableOpacity style={styles.playBtn} onPress={handlePlay}>
              <Text style={styles.playBtnText}>
                Play{selectedCards.length > 1 ? ` (${selectedCards.length})` : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── On-cards declaration window ───────────────────────────────── */}
      {showOnCardsWindow && (
        <View style={styles.onCardsOverlay}>
          <View style={styles.onCardsCard}>
            <Text style={styles.onCardsHandCount}>
              You have {gameState.players.find((p) => p.id === myPlayerId)?.hand.length ?? 0} card{(gameState.players.find((p) => p.id === myPlayerId)?.hand.length ?? 0) !== 1 ? 's' : ''} left
            </Text>
            {!onCardsActive ? (
              <TouchableOpacity style={styles.onCardsBigBtn} onPress={handleDeclareOnCards}>
                <Text style={styles.onCardsBigBtnText}>I'm on cards!</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.declaredBadge}>
                <Text style={styles.declaredBadgeText}>Already declared!</Text>
              </View>
            )}
            {/* Countdown bar */}
            <View style={styles.countdownTrack}>
              <View style={[styles.countdownFill, { flex: onCardsCountdown / 3 }]} />
              <View style={{ flex: (3 - onCardsCountdown) / 3 }} />
            </View>
            <Text style={styles.countdownLabel}>{onCardsCountdown}s</Text>
          </View>
        </View>
      )}

      {/* ── Auto-draw countdown overlay ───────────────────────────────── */}
      {autoDrawCountdown !== null && (
        <View style={styles.autoDrawOverlay}>
          <View style={styles.autoDrawCard}>
            <Text style={styles.autoDrawTitle}>No counter available</Text>
            <Text style={styles.autoDrawSub}>
              Drawing {gameState.pendingPickup} card{gameState.pendingPickup !== 1 ? 's' : ''} in {autoDrawCountdown}…
            </Text>
            <TouchableOpacity style={styles.autoDrawCancelBtn} onPress={cancelAutoDraw}>
              <Text style={styles.autoDrawCancelText}>Cancel — draw manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <HowToPlayModal
        visible={showHowToPlay}
        onClose={() => {
          if (isLocalMode && modalOpenedAtRef.current !== null) {
            adjustTurnStartedAt(Date.now() - modalOpenedAtRef.current);
            modalOpenedAtRef.current = null;
          }
          setShowHowToPlay(false);
        }}
      />

      <SuitPicker visible={showSuitPicker} onSelect={handleDeclareSuit} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1b5e20',
  },
  loading: {
    flex: 1,
    backgroundColor: '#1b5e20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  muteBtn: {
    position: 'absolute',
    top: 52,
    right: 14,
    zIndex: 50,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  muteBtnText: {
    fontSize: 20,
  },
  howToPlayBtn: {
    position: 'absolute',
    top: 52,
    left: 14,
    zIndex: 50,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  howToPlayBtnText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    position: 'absolute',
    top: 92,
    right: 14,
    zIndex: 50,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  skipBtnText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingBottom: 16,
  },
  drawBtn: {
    flex: 1,
    backgroundColor: '#4e342e',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  drawBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  playBtn: {
    flex: 2,
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  playBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  // ── On-cards declaration window ────────────────────────────────────────────
  onCardsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 120,
    paddingBottom: 24,
  },
  onCardsCard: {
    backgroundColor: '#1a237e',
    borderRadius: 20,
    padding: 24,
    width: '88%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,193,7,0.45)',
    gap: 14,
  },
  onCardsHandCount: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  onCardsBigBtn: {
    backgroundColor: '#ffc107',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
  },
  onCardsBigBtnText: {
    color: '#1a237e',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  countdownTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    width: '100%',
  },
  countdownFill: {
    backgroundColor: '#ffc107',
    borderRadius: 3,
  },
  countdownLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
  declaredBadge: {
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.35)',
  },
  declaredBadgeText: {
    color: '#81c784',
    fontSize: 16,
    fontWeight: '600',
  },
  // ── Auto-draw countdown overlay ────────────────────────────────────────────
  autoDrawOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 120,
    paddingBottom: 24,
  },
  autoDrawCard: {
    backgroundColor: '#4e342e',
    borderRadius: 20,
    padding: 24,
    width: '88%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,87,34,0.45)',
    gap: 12,
  },
  autoDrawTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  autoDrawSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    textAlign: 'center',
  },
  autoDrawCancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  autoDrawCancelText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
});
