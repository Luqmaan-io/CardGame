import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import type { Card as CardType, Suit } from '../../engine/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const FAN_SIZE = 4;
const CARD_W = 62;
const CARD_H = 90;

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const RED_SUITS = new Set<Suit>(['hearts', 'diamonds']);

// ─── Stable offset cache ──────────────────────────────────────────────────────
// Keyed by card identity only (not position) so offsets survive re-ordering.
// Top card is always flat; non-top cards get a fixed deterministic offset.

interface CardOffset {
  rotation: number;
  offsetX: number;
  offsetY: number;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DiscardPileProps {
  discard: CardType[];
  activeSuit: Suit | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DiscardPile({ discard, activeSuit }: DiscardPileProps) {
  // Key by card identity — never changes regardless of fan position
  function getCardKey(card: CardType) {
    return `${card.rank}_${card.suit}`;
  }

  // Cache keyed by card identity: once set it never changes unless the card
  // becomes the top card (in which case we override to flat).
  const offsetsRef = useRef<Record<string, CardOffset>>({});

  function getStableOffset(card: CardType, isTop: boolean): CardOffset {
    const key = getCardKey(card);
    if (isTop) {
      offsetsRef.current[key] = { rotation: 0, offsetX: 0, offsetY: 0 };
      return offsetsRef.current[key]!;
    }
    if (!offsetsRef.current[key]) {
      const seed = card.rank.charCodeAt(0) + card.suit.charCodeAt(0);
      const direction = seed % 2 === 0 ? 1 : -1;
      offsetsRef.current[key] = {
        rotation: direction * 12,   // fixed ±12° for all non-top cards
        offsetX: direction * 14,
        offsetY: 6,
      };
    }
    return offsetsRef.current[key]!;
  }

  const recentCards = useMemo(
    () => discard.slice(-FAN_SIZE).reverse(), // index 0 = top card
    [discard]
  );

  // Prune stale keys when pile changes
  useEffect(() => {
    const validKeys = new Set(recentCards.map(getCardKey));
    for (const key of Object.keys(offsetsRef.current)) {
      if (!validKeys.has(key)) delete offsetsRef.current[key];
    }
  }, [recentCards]);

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
      {[...recentCards].reverse().map((card, reversedIdx) => {
        const fanIdx = recentCards.length - 1 - reversedIdx;
        const isTop = fanIdx === 0;
        const { rotation, offsetX, offsetY } = getStableOffset(card, isTop);

        if (isTop) {
          return (
            <Animated.View
              key={getCardKey(card)}
              style={[
                styles.cardSlot,
                {
                  zIndex: FAN_SIZE,
                  transform: [
                    { translateX: offsetX },
                    { translateY: offsetY },
                    { rotate: `${rotation}deg` },
                    { scale: landingScale },
                  ],
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
                zIndex: FAN_SIZE - fanIdx,
                transform: [
                  { translateX: offsetX },
                  { translateY: offsetY },
                  { rotate: `${rotation}deg` },
                ],
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
    width: 180,
    height: 160,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
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
    left: 0,
    right: 0,
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
