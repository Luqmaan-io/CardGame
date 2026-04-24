import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import type { Card as CardType, Suit } from '../../engine/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const FAN_SIZE = 4;
const CARD_W = 68;
const CARD_H = 99;

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const RED_SUITS = new Set<Suit>(['hearts', 'diamonds']);


// ─── Props ────────────────────────────────────────────────────────────────────

interface DiscardPileProps {
  discard: CardType[];
  activeSuit: Suit | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DiscardPile({ discard, activeSuit }: DiscardPileProps) {
  function getCardKey(card: CardType) {
    return `${card.rank}_${card.suit}`;
  }

  const recentCards = useMemo(
    () => discard.slice(-FAN_SIZE).reverse(), // index 0 = top card
    [discard]
  );

  // ── Active suit fade ──────────────────────────────────────────────────────────
  const suitOpacity = useRef(new Animated.Value(activeSuit ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(suitOpacity, {
      toValue: activeSuit ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [activeSuit]);

  // ── Landing settle animation for the top card ─────────────────────────────────
  // Scale: 1.1 → 0.95 → 1.0
  const landingScale = useRef(new Animated.Value(1)).current;
  const prevTopRef = useRef<CardType | null>(discard[discard.length - 1] ?? null);

  useEffect(() => {
    const top = discard[discard.length - 1] ?? null;
    const prev = prevTopRef.current;
    const isNewCard =
      top !== null &&
      (prev === null || top.rank !== prev.rank || top.suit !== prev.suit);

    if (isNewCard) {
      landingScale.setValue(1.1);
      Animated.sequence([
        Animated.timing(landingScale, { toValue: 0.95, duration: 140, useNativeDriver: false }),
        Animated.timing(landingScale, { toValue: 1.0, duration: 110, useNativeDriver: false }),
      ]).start();
    }

    prevTopRef.current = top;
  }, [discard.length]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {discard.length === 0 && <View style={styles.emptyPile} />}

      {/* Render bottom-to-top so top card is drawn last (highest z) */}
      {/* Each card sits 1.5px lower than the one above it — just enough depth to show the stack */}
      {[...recentCards].reverse().map((card, reversedIdx) => {
        const stackIdx = recentCards.length - 1 - reversedIdx; // 0 = top
        const isTop = stackIdx === 0;

        if (isTop) {
          return (
            <Animated.View
              key={getCardKey(card)}
              style={[
                styles.cardSlot,
                {
                  top: 0,
                  zIndex: FAN_SIZE,
                  transform: [{ scale: landingScale }],
                },
              ]}
            >
              <Card card={card} width={CARD_W} height={CARD_H} />
            </Animated.View>
          );
        }

        return (
          <View
            key={getCardKey(card)}
            style={[
              styles.cardSlot,
              {
                top: stackIdx * 1.5,
                zIndex: FAN_SIZE - stackIdx,
              },
            ]}
          >
            <Card card={card} width={CARD_W} height={CARD_H} />
          </View>
        );
      })}

      {/* Active suit pill — floats above the fan, centred */}
      <Animated.View
        style={[styles.suitPillWrapper, { opacity: suitOpacity }]}
        pointerEvents="none"
      >
        <View style={styles.suitPill}>
          <Text
            style={[
              styles.suitSymbol,
              activeSuit && RED_SUITS.has(activeSuit) ? styles.redSuit : styles.darkSuit,
            ]}
          >
            {activeSuit ? SUIT_SYMBOLS[activeSuit] : ''}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: CARD_W,
    height: CARD_H + 6,  // 6px for stack depth offset
    position: 'relative',
  },
  cardSlot: {
    position: 'absolute',
  },
  emptyPile: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    borderStyle: 'dashed',
  },
  suitPillWrapper: {
    position: 'absolute',
    top: -38,
    left: -20,
    right: -20,
    alignItems: 'center',
  },
  suitPill: {
    backgroundColor: 'rgba(255,193,7,0.88)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  suitSymbol: {
    fontSize: 20,
    fontWeight: '700',
  },
  redSuit: {
    color: '#c62828',
  },
  darkSuit: {
    color: '#1a1a1a',
  },
});
