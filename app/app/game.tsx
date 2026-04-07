import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSocket } from '../hooks/useSocket';
import { useLocalGame } from '../hooks/useLocalGame';
import { useGameStore } from '../store/gameStore';
import { GameBoard } from '../components/GameBoard';
import { SuitPicker } from '../components/SuitPicker';
import { TurnTimer } from '../components/TurnTimer';
import { Toast, ToastMessage } from '../components/Toast';
import { getValidPlays } from '../../engine/ai';
import type { Card, GameState, Suit } from '../../engine/types';

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; playerName?: string; aiCount?: string }>();
  const isLocalMode = params.mode === 'local';

  // ── Online hook (always mounted) ──────────────────────────────────────
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

  // ── Local AI hook (always mounted) ────────────────────────────────────
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

  function addToast(text: string) {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, text }]);
  }

  // Start local game on mount
  const localGameStartedRef = useRef(false);
  useEffect(() => {
    if (isLocalMode && !localGameStartedRef.current) {
      localGameStartedRef.current = true;
      const name = params.playerName ?? 'Player';
      const count = parseInt(params.aiCount ?? '1', 10);
      startLocalGame(name, count);
    }
  }, []);

  // Online: navigate to results on game-over
  useEffect(() => {
    if (!isLocalMode && onlineGameState?.phase === 'game-over') {
      router.replace('/results');
    }
  }, [onlineGameState?.phase, isLocalMode]);

  // Online: toast notifications
  useEffect(() => {
    if (!pendingTimeoutNotification) return;
    addToast(pendingTimeoutNotification);
    useGameStore.getState().setPendingTimeoutNotification(null);
  }, [pendingTimeoutNotification]);

  // Show suit picker when entering declare-suit phase (online only)
  // Must be above the early return so hook count is stable across renders
  useEffect(() => {
    if (!isLocalMode && gameState?.phase === 'declare-suit' && gameState?.players[gameState.currentPlayerIndex]?.id === myPlayerId) {
      setShowSuitPicker(true);
    }
  }, [gameState?.phase, myPlayerId, isLocalMode]);

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

  // In local mode, block UI while AI is thinking or it's not human's turn
  const localActionDisabled = isLocalMode && (!isMyTurn || isAIThinking);

  const validPlays = isMyTurn && !isAIThinking && !hasActed ? getValidPlays(gameState) : [];

  // Build player name map
  const playerNamesMap: Record<string, string> = isLocalMode ? localPlayerNames : {};

  function getMessage(): string {
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
    }
  }

  function handlePlay() {
    if (selectedCards.length === 0) return;

    const lastCard = selectedCards[selectedCards.length - 1];
    if (lastCard?.rank === 'A') {
      setShowSuitPicker(true);
      return;
    }

    if (isLocalMode) {
      try {
        humanPlay(selectedCards);
      } catch {
        // Invalid play — ignore
      }
    } else {
      socketPlayCards(selectedCards);
    }
    clearSelection();
  }

  function handleSuitSelected(suit: Suit) {
    setShowSuitPicker(false);
    if (isLocalMode) {
      try {
        humanPlay(selectedCards, suit);
      } catch {
        // Invalid play
      }
    } else {
      socketPlayCards(selectedCards, suit);
    }
    clearSelection();
  }

  function handleDraw() {
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
      } else {
        addToast("You're not on cards — 2 cards added to your hand");
      }
    } else {
      socketDeclareOnCards();
      // Feedback for online comes via game:on-cards-declared / game:false-declaration events
    }
  }

  const onCardsActive = gameState.onCardsDeclarations.includes(myPlayerId);

  // Whether to show action buttons:
  // Pre-action: show play/draw buttons (only when it's my turn and haven't acted yet)
  // Post-action: show End Turn + "I'm on cards" buttons
  const showPreAction = isMyTurn && !hasActed && !isAIThinking && gameState.phase !== 'declare-suit';
  const showPostAction = isMyTurn && hasActed && !isAIThinking && gameState.phase !== 'declare-suit';

  return (
    <SafeAreaView style={styles.safe}>
      <Toast messages={toasts} onExpire={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      <GameBoard
        gameState={gameState}
        myPlayerId={myPlayerId}
        validPlays={validPlays}
        selectedCards={selectedCards}
        onCardSelect={(!isMyTurn || localActionDisabled || hasActed) ? () => {} : handleCardSelect}
        onClearSelection={clearSelection}
        isMyTurn={isMyTurn && !isAIThinking && !hasActed}
        selectionDisabled={localActionDisabled || hasActed}
        playerNames={playerNamesMap}
        message={getMessage()}
      />

      {/* Timer — hidden in local AI mode */}
      {!isLocalMode && (
        <TurnTimer timerStartedAt={gameState.timerStartedAt} />
      )}

      {/* Pre-action bar: play / draw */}
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

      {/* Post-action bar: End Turn + I'm on cards */}
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
