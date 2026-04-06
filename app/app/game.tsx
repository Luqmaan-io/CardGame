import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';
import { GameBoard } from '../components/GameBoard';
import { SuitPicker } from '../components/SuitPicker';
import { TurnTimer } from '../components/TurnTimer';
import { Toast, ToastMessage } from '../components/Toast';
import { getValidPlays } from '../../engine/ai';
import type { Card, Suit } from '../../engine/types';

export default function GameScreen() {
  const router = useRouter();
  const { playCards, drawCard, declareSuit } = useSocket();
  const {
    gameState,
    myPlayerId,
    selectedCards,
    selectCard,
    deselectCard,
    clearSelection,
    pendingTimeoutNotification,
  } = useGameStore();
  const [showSuitPicker, setShowSuitPicker] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(0);

  useEffect(() => {
    if (gameState?.phase === 'game-over') {
      router.replace('/results');
    }
  }, [gameState?.phase]);

  useEffect(() => {
    if (!pendingTimeoutNotification) return;
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, text: pendingTimeoutNotification }]);
    useGameStore.getState().setPendingTimeoutNotification(null);
  }, [pendingTimeoutNotification]);

  if (!gameState) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Waiting for game…</Text>
      </View>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const hasPendingPickup = gameState.pendingPickup > 0;

  // getValidPlays works off currentPlayerIndex — only meaningful on my turn
  const validPlays = isMyTurn ? getValidPlays(gameState) : [];

  function getMessage(): string {
    if (gameState.phase === 'declare-suit') return 'Choose a suit';
    if (!isMyTurn) {
      return `${currentPlayer?.id.slice(0, 8) ?? '?'}'s turn`;
    }
    if (hasPendingPickup) {
      const type = gameState.pendingPickupType === 'jack' ? 'J' : '2';
      return `Draw ${gameState.pendingPickup} (${type}) or counter`;
    }
    if (gameState.phase === 'cover') return 'Cover the Queen';
    if (gameState.phase === 'pickup') return `Draw ${gameState.pendingPickup} cards`;
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

    // If the last card in the selection is an Ace, show suit picker before emitting
    const lastCard = selectedCards[selectedCards.length - 1];
    if (lastCard?.rank === 'A') {
      setShowSuitPicker(true);
      return;
    }

    playCards(selectedCards);
    clearSelection();
  }

  function handleSuitSelected(suit: Suit) {
    setShowSuitPicker(false);
    playCards(selectedCards, suit);
    clearSelection();
  }

  function handleDraw() {
    drawCard();
    clearSelection();
  }

  // If game is in declare-suit phase and it's my turn, show suit picker directly
  useEffect(() => {
    if (gameState.phase === 'declare-suit' && isMyTurn) {
      setShowSuitPicker(true);
    }
  }, [gameState.phase, isMyTurn]);

  function handleDeclareSuit(suit: Suit) {
    setShowSuitPicker(false);
    if (gameState.phase === 'declare-suit') {
      declareSuit(suit);
    } else {
      handleSuitSelected(suit);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Toast messages={toasts} onExpire={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      <GameBoard
        gameState={gameState}
        myPlayerId={myPlayerId}
        validPlays={validPlays}
        selectedCards={selectedCards}
        onCardSelect={isMyTurn ? handleCardSelect : () => {}}
        onClearSelection={clearSelection}
        isMyTurn={isMyTurn}
        message={getMessage()}
      />

      <TurnTimer timerStartedAt={gameState.timerStartedAt} />

      {/* Action bar — only shown on my turn */}
      {isMyTurn && gameState.phase !== 'declare-suit' && (
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
});
