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

// ─── Fan offset ───────────────────────────────────────────────────────────────
// index 0 = top card (flat, centred)
// index 1-3 = progressively more fanned out so rank/suit are clearly visible

interface CardOffset {
  rotation: number;
  offsetX: number;
  offsetY: number;
}

function calcCardOffset(card: CardType, index: number): CardOffset {
  if (index === 0) {
    return { rotation: 0, offsetX: 0, offsetY: 0 };
  }
  const seed = card.rank.charCodeAt(0) + card.suit.charCodeAt(0);
  const direction = seed % 2 === 0 ? 1 : -1;
  return {
    rotation: direction * (8 * index),   // gentle ±8°, ±16°, ±24°
    offsetX: direction * (10 * index),   // slight spread left/right
    offsetY: index * 4,                  // slight cascade down
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DiscardPileProps {
  discard: CardType[];
  activeSuit: Suit | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DiscardPile({ discard, activeSuit }: DiscardPileProps) {
  // ── Stable offset cache — prevents existing card rotations from jumping when a new card lands
  const offsetsRef = useRef<Record<string, CardOffset>>({});
  const recentCards = useMemo(
    () => discard.slice(-FAN_SIZE).reverse(), // [top, 2nd, 3rd, bottom]
    [discard]
  );

  function getCardKey(card: CardType, index: number) {
    return `${card.rank}${card.suit}${index}`;
  }

  function getStableOffset(card: CardType, index: number): CardOffset {
    const key = getCardKey(card, index);
    if (!offsetsRef.current[key]) {
      offsetsRef.current[key] = calcCardOffset(card, index);
    }
    return offsetsRef.current[key]!;
  }

  // Prune keys that no longer correspond to the current fan
  useEffect(() => {
    const validKeys = new Set(recentCards.map((card, i) => getCardKey(card, i)));
    for (const key of Object.keys(offsetsRef.current)) {
      if (!validKeys.has(key)) {
        delete offsetsRef.current[key];
      }
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
        // reversedIdx counts from the bottom; convert back to fan index
        const fanIdx = recentCards.length - 1 - reversedIdx;
        const { rotation, offsetX, offsetY } = getStableOffset(card, fanIdx);
        const isTop = fanIdx === 0;

        if (isTop) {
          return (
            <Animated.View
              key={`${card.rank}-${card.suit}-top`}
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
            key={`${card.rank}-${card.suit}-${fanIdx}`}
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
