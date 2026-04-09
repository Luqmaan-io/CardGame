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
import { getGamePositions } from '../utils/animations';
import { getValidPlays } from '../../engine/ai';
import type { Card, GameState, Suit } from '../../engine/types';

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
  const params = useLocalSearchParams<{ mode?: string; playerName?: string; aiCount?: string }>();
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
    startLocalGame,
    humanPlay,
    humanDraw,
    humanEndTurn,
    humanDeclareOnCards,
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

  // ── Flashing player (timeout animation) ──────────────────────────────────
  const [flashingPlayerId, setFlashingPlayerId] = useState<string | null>(null);

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

    const positions = getGamePositions(screenWidth, screenHeight);

    for (let cardNum = 1; cardNum <= totalCards; cardNum++) {
      for (let playerIdx = 0; playerIdx < playerCount; playerIdx++) {
        // Check if skipped
        if (dealGenRef.current !== gen) return;

        const player = state.players[playerIdx]!;
        const playerId = player.id;
        const isHuman = playerId === myPlayerId;

        // Compute target position
        const oppIdx = state.players
          .filter((p) => p.id !== myPlayerId)
          .findIndex((p) => p.id === playerId);

        const toPos = isHuman
          ? positions.myHand
          : positions.opponent(oppIdx, playerCount - 1);

        // Add flying card to overlay
        overlayRef.current?.addCards([
          {
            id: animId(),
            card: isHuman ? (player.hand[cardNum - 1] ?? null) : null,
            fromX: positions.deck.x,
            fromY: positions.deck.y,
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
  }, [myPlayerId, screenWidth, screenHeight]);

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
      startLocalGame(name, count);
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

    const positions = getGamePositions(screenWidth, screenHeight);
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
        const oppPos = positions.opponent(oppIdx, opponents.length);
        overlayRef.current?.addCards([
          {
            id: animId(),
            card: null,
            fromX: oppPos.x,
            fromY: oppPos.y,
            toX: positions.discard.x,
            toY: positions.discard.y,
            delay: 0,
            duration: 400,
            onComplete: undefined,
          },
        ]);
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
      overlayRef.current?.addCards([
        {
          id: animId(),
          card: myPlayer?.hand[myPlayer.hand.length - 1] ?? null,
          fromX: positions.deck.x,
          fromY: positions.deck.y,
          toX: positions.myHand.x,
          toY: positions.myHand.y,
          delay: 0,
          duration: 300,
          onComplete: undefined,
        },
      ]);
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
      for (let i = 0; i < count; i++) {
        overlayRef.current?.addCards([
          {
            id: animId(),
            card: myPlayer?.hand[myPlayer.hand.length - count + i] ?? null,
            fromX: positions.deck.x,
            fromY: positions.deck.y,
            toX: positions.myHand.x + (i - Math.floor(count / 2)) * 12,
            toY: positions.myHand.y,
            delay: i * 150,
            duration: 300,
            onComplete: undefined,
          },
        ]);
        if (i > 0) {
          setTimeout(() => playSound('card_draw'), i * 150);
        }
      }
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
    if (isMyTurn && hasActed) return 'End your turn or declare';
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

  function handlePlay() {
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

    const positions = getGamePositions(screenWidth, screenHeight);
    selectedCards.forEach((card, i) => {
      overlayRef.current?.addCards([
        {
          id: animId(),
          card,
          fromX: positions.myHand.x + (i - Math.floor(selectedCards.length / 2)) * 40,
          fromY: positions.myHand.y,
          toX: positions.discard.x,
          toY: positions.discard.y,
          delay: i * 100,
          duration: 350,
          onComplete: undefined,
        },
      ]);
    });

    if (isLocalMode) {
      try { humanPlay(selectedCards); } catch { /* invalid */ }
    } else {
      socketPlayCards(selectedCards);
    }
    clearSelection();
  }

  function handleSuitSelected(suit: Suit) {
    setShowSuitPicker(false);
    playSound('power_card');
    haptic('medium');

    const positions = getGamePositions(screenWidth, screenHeight);
    selectedCards.forEach((card, i) => {
      overlayRef.current?.addCards([
        {
          id: animId(),
          card,
          fromX: positions.myHand.x + (i - Math.floor(selectedCards.length / 2)) * 40,
          fromY: positions.myHand.y,
          toX: positions.discard.x,
          toY: positions.discard.y,
          delay: i * 100,
          duration: 350,
          onComplete: undefined,
        },
      ]);
    });

    if (isLocalMode) {
      try { humanPlay(selectedCards, suit); } catch { /* invalid */ }
    } else {
      socketPlayCards(selectedCards, suit);
    }
    clearSelection();
  }

  function handleDraw() {
    haptic('light');
    if (isLocalMode) {
      humanDraw();
    } else {
      socketDrawCard();
    }
    clearSelection();
  }

  function handleEndTurn() {
    if (isLocalMode) {
      humanEndTurn();
    } else {
      socketEndTurn();
    }
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
    if (isLocalMode) {
      const isValid = humanDeclareOnCards();
      if (isValid) {
        const humanName = localPlayerNames[localMyPlayerId] ?? 'You';
        addToast(`${humanName} is on cards!`);
        playSound('on_cards');
        haptic('success');
      } else {
        addToast("You're not on cards — 2 cards added to your hand");
        haptic('error');
      }
    } else {
      socketDeclareOnCards();
    }
  }

  const onCardsActive = gameState.onCardsDeclarations.includes(myPlayerId);
  const showPreAction =
    isMyTurn && !hasActed && !isAIThinking && !isDealing && gameState.phase !== 'declare-suit';
  const showPostAction =
    isMyTurn && hasActed && !isAIThinking && !isDealing && gameState.phase !== 'declare-suit';

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
      />

      <AnimationOverlay ref={overlayRef} />

      {/* Timer — hidden in local mode and during deal */}
      {!isLocalMode && !isDealing && (
        <TurnTimer timerStartedAt={gameState.timerStartedAt} />
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

      {showPostAction && (
        <View style={styles.postActionBar}>
          {!onCardsActive && (
            <TouchableOpacity style={styles.onCardsBtn} onPress={handleDeclareOnCards}>
              <Text style={styles.onCardsBtnText}>I'm on cards!</Text>
            </TouchableOpacity>
          )}
          {onCardsActive && (
            <View style={styles.declaredBadge}>
              <Text style={styles.declaredBadgeText}>Declared!</Text>
            </View>
          )}
          <TouchableOpacity style={styles.endTurnBtn} onPress={handleEndTurn}>
            <Text style={styles.endTurnBtnText}>End Turn</Text>
          </TouchableOpacity>
        </View>
      )}

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
  postActionBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingBottom: 16,
    alignItems: 'center',
  },
  onCardsBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,193,7,0.18)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,193,7,0.55)',
  },
  onCardsBtnText: {
    color: '#ffc107',
    fontSize: 14,
    fontWeight: '700',
  },
  declaredBadge: {
    flex: 1,
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.35)',
  },
  declaredBadgeText: {
    color: '#81c784',
    fontSize: 14,
    fontWeight: '600',
  },
  endTurnBtn: {
    flex: 2,
    backgroundColor: '#37474f',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  endTurnBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
