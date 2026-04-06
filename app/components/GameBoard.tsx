import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Card } from './Card';
import { Hand } from './Hand';
import { DiscardPile } from './DiscardPile';
import type { GameState, Card as CardType } from '../../engine/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GameBoardProps {
  gameState: GameState | null | undefined;
  myPlayerId: string;
  validPlays: CardType[][];
  selectedCards: CardType[];
  onCardSelect: (card: CardType) => void;
  onClearSelection?: () => void;
  isMyTurn: boolean;
  selectionDisabled?: boolean;
  playerNames?: Record<string, string>;
  message: string;
}

interface OpponentSlotProps {
  playerId: string;
  hand: CardType[];
  name: string;
  isCurrentTurn: boolean;
  hasOnCardsDeclaration: boolean;
  strikes: number;
}

// ─── OpponentSlot ─────────────────────────────────────────────────────────────

function OpponentSlot({
  hand,
  name,
  isCurrentTurn,
  hasOnCardsDeclaration,
  strikes,
}: OpponentSlotProps) {
  const liftAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isCurrentTurn && hand.length > 0) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(liftAnim, { toValue: -8, duration: 350, useNativeDriver: false }),
          Animated.timing(liftAnim, { toValue: 0, duration: 350, useNativeDriver: false }),
          Animated.delay(1300),
        ])
      );
      loopRef.current = loop;
      loop.start();
    } else {
      loopRef.current?.stop();
      liftAnim.setValue(0);
    }
    return () => { loopRef.current?.stop(); };
  }, [isCurrentTurn, hand.length]);

  const displayCount = Math.min(hand.length, 5);
  const midIndex = Math.floor(displayCount / 2);

  return (
    <View style={[styles.opponentSlot, isCurrentTurn && styles.opponentSlotActive]}>
      <View style={styles.opponentNameRow}>
        {strikes >= 1 && (
          <View style={styles.strikeIcon}>
            <Text style={styles.strikeIconText}>!</Text>
          </View>
        )}
        <Text style={styles.opponentName} numberOfLines={1}>{name}</Text>
      </View>

      {hasOnCardsDeclaration && (
        <Text style={styles.onCardsLabel}>On cards!</Text>
      )}

      <View style={styles.opponentCardRow}>
        {hand.length === 0 ? (
          <Text style={styles.emptyHand}>Empty</Text>
        ) : (
          Array.from({ length: displayCount }).map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.faceDownSlot,
                i > 0 && { marginLeft: -22 },
                i === midIndex && isCurrentTurn && { transform: [{ translateY: liftAnim }] },
                { zIndex: i },
              ]}
            >
              <Card card={hand[i] ?? { rank: 'A', suit: 'spades' }} faceDown />
            </Animated.View>
          ))
        )}
      </View>

      <View style={styles.cardCountBadge}>
        <Text style={styles.cardCountText}>{hand.length}</Text>
      </View>
    </View>
  );
}

// ─── DrawPileView ─────────────────────────────────────────────────────────────

function DrawPileView({ count }: { count: number }) {
  return (
    <View style={styles.pileOuter}>
      {count > 2 && (
        <View style={[styles.stackBehind, { bottom: -5, left: -5, transform: [{ rotate: '3deg' }] }]} />
      )}
      {count > 1 && (
        <View style={[styles.stackBehind, { bottom: -2.5, left: -2.5, transform: [{ rotate: '1.5deg' }] }]} />
      )}
      <Card card={{ rank: 'A', suit: 'spades' }} faceDown />
      <View style={styles.deckCountBadge}>
        <Text style={styles.deckCountText}>{count}</Text>
      </View>
    </View>
  );
}

// ─── GameBoard ────────────────────────────────────────────────────────────────

export function GameBoard({
  gameState,
  myPlayerId,
  validPlays,
  selectedCards,
  onCardSelect,
  onClearSelection,
  isMyTurn,
  selectionDisabled,
  playerNames = {},
  message,
}: GameBoardProps) {
  if (!gameState || !gameState.players) {
    return (
      <View style={styles.board}>
        <View style={styles.connectingContainer}>
          <Text style={styles.connectingText}>Connecting…</Text>
        </View>
      </View>
    );
  }

  const { players, discard, deck, currentPlayerIndex, activeSuit } = gameState;

  const myPlayer = players.find((p) => p.id === myPlayerId);
  const opponents = players.filter((p) => p.id !== myPlayerId);
  const currentPlayer = players[currentPlayerIndex];

  const handleCardSelect = selectionDisabled ? undefined : onCardSelect;

  return (
    <View style={styles.board}>
      {/* ── Opponents ─────────────────────────────────────────────────── */}
      <View style={styles.opponentsRow}>
        {opponents.map((opp) => (
          <OpponentSlot
            key={opp.id}
            playerId={opp.id}
            hand={opp.hand}
            name={playerNames[opp.id] ?? opp.id.slice(0, 8)}
            isCurrentTurn={opp.id === currentPlayer?.id}
            hasOnCardsDeclaration={gameState.onCardsDeclarations.includes(opp.id)}
            strikes={gameState.timeoutStrikes[opp.id] ?? 0}
          />
        ))}
      </View>

      {/* ── Centre table ──────────────────────────────────────────────── */}
      <View style={styles.centre}>
        <View style={styles.pileGroup}>
          <DrawPileView count={deck.length} />
          <Text style={styles.pileLabel}>Draw</Text>
        </View>

        {/* Message column */}
        <View style={styles.centreInfo}>
          {message ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}
        </View>

        {/* Discard pile — loose stack effect + active suit pill built in */}
        <View style={styles.pileGroup}>
          <View style={styles.pileOuter}>
            <DiscardPile discard={discard} activeSuit={activeSuit} />
          </View>
          <Text style={styles.pileLabel}>Discard</Text>
        </View>
      </View>

      {/* ── My area ───────────────────────────────────────────────────── */}
      <View style={styles.myArea}>
        {isMyTurn && (
          <View style={styles.yourTurnBanner}>
            <Text style={styles.yourTurnText}>Your turn</Text>
          </View>
        )}
        {myPlayer ? (
          <Hand
            cards={myPlayer.hand}
            validPlays={validPlays}
            selectedCards={selectedCards}
            onCardSelect={handleCardSelect ? (c) => handleCardSelect(c) : undefined}
            onClearSelection={onClearSelection}
            isMyTurn={isMyTurn}
          />
        ) : null}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  board: {
    flex: 1,
    backgroundColor: '#35654d',
  },
  connectingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '500',
  },

  // Opponents
  opponentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 6,
    minHeight: 130,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  opponentSlot: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 180,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  opponentSlotActive: {
    borderColor: '#ffc107',
    backgroundColor: 'rgba(255,193,7,0.07)',
    shadowColor: '#ffc107',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  opponentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  strikeIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff6d00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strikeIconText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 14,
  },
  opponentName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.9,
    maxWidth: 110,
  },
  onCardsLabel: {
    color: '#ffc107',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  opponentCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  faceDownSlot: {},
  emptyHand: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  cardCountBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  cardCountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Centre
  centre: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 12,
  },
  pileGroup: {
    alignItems: 'center',
    gap: 8,
  },
  pileLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  centreInfo: {
    alignItems: 'center',
    minWidth: 80,
  },
  messageBox: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 140,
  },
  messageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Piles
  pileOuter: {
    position: 'relative',
  },
  stackBehind: {
    position: 'absolute',
    width: 70,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#e8e0d0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  deckCountBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#1b5e20',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#fff',
    minWidth: 22,
    alignItems: 'center',
  },
  deckCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  // My area
  myArea: {
    minHeight: 170,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.2)',
  },
  yourTurnBanner: {
    alignSelf: 'center',
    backgroundColor: 'rgba(76,175,80,0.18)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.4)',
  },
  yourTurnText: {
    color: '#a5d6a7',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
