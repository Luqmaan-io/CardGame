import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import type { Card as CardType, Suit } from '../../engine/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const VISIBLE_STACK = 5;
const CARD_W = 70;
const CARD_H = 100;

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const RED_SUITS = new Set<Suit>(['hearts', 'diamonds']);

// ─── Seeded randomness ────────────────────────────────────────────────────────
// Uses Math.sin so the same card at the same pile position always gets the
// same offset — no re-randomisation on re-renders.

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x); // [0, 1)
}

const RANK_ORDER = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUIT_ORDER: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

interface CardOffset {
  rot: number;
  dx: number;
  dy: number;
}

function getCardOffset(card: CardType, indexInPile: number, isTop: boolean): CardOffset {
  const rankCode = RANK_ORDER.indexOf(card.rank) + 1;
  const suitCode = SUIT_ORDER.indexOf(card.suit) + 1;
  const base = rankCode * 1000 + suitCode * 100 + indexInPile;

  const r1 = seededRandom(base);
  const r2 = seededRandom(base + 50);
  const r3 = seededRandom(base + 100);

  // Top card is most readable — tighter rotation range
  const rotRange = isTop ? 10 : 24;
  return {
    rot: r1 * rotRange - rotRange / 2, // [-rotRange/2, rotRange/2]
    dx: r2 * 12 - 6,                   // [-6, +6]
    dy: r3 * 8 - 4,                    // [-4, +4]
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DiscardPileProps {
  discard: CardType[];
  activeSuit: Suit | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DiscardPile({ discard, activeSuit }: DiscardPileProps) {
  // ── Active suit fade ─────────────────────────────────────────────────────────
  const suitOpacity = useRef(new Animated.Value(activeSuit ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(suitOpacity, {
      toValue: activeSuit ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [activeSuit]);

  // ── Landing settle animation for the top card ─────────────────────────────────
  // Scale: 1.1 → 0.95 → 1.0  |  Rotation: 0° → final resting rotation
  const landingScale = useRef(new Animated.Value(1)).current;
  const landingRot = useRef(new Animated.Value(0)).current;
  const prevTopRef = useRef<CardType | null>(discard[discard.length - 1] ?? null);

  useEffect(() => {
    const top = discard[discard.length - 1] ?? null;
    const prev = prevTopRef.current;
    const isNewCard =
      top !== null &&
      (prev === null || top.rank !== prev.rank || top.suit !== prev.suit);

    if (isNewCard && top) {
      const { rot } = getCardOffset(top, discard.length - 1, true);

      landingScale.setValue(1.1);
      landingRot.setValue(0);

      Animated.parallel([
        Animated.sequence([
          Animated.timing(landingScale, {
            toValue: 0.95,
            duration: 140,
            useNativeDriver: false,
          }),
          Animated.timing(landingScale, {
            toValue: 1.0,
            duration: 110,
            useNativeDriver: false,
          }),
        ]),
        Animated.timing(landingRot, {
          toValue: rot,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    }

    prevTopRef.current = top;
  }, [discard.length]);

  // ── Render ────────────────────────────────────────────────────────────────────

  const topAbsIdx = discard.length - 1;
  // Show at most VISIBLE_STACK cards, rendered bottom-first so topmost is on top
  const visibleCards = discard.slice(-VISIBLE_STACK);
  const topVisIdx = visibleCards.length - 1;

  // Interpolate landingRot (number in degrees) → string for the transform prop
  const landingRotDeg = landingRot.interpolate({
    inputRange: [-90, 0, 90],
    outputRange: ['-90deg', '0deg', '90deg'],
  });

  return (
    <View style={styles.container}>
      {discard.length === 0 && <View style={styles.emptyPile} />}

      {visibleCards.map((card, visIdx) => {
        const absIdx = topAbsIdx - (topVisIdx - visIdx);
        const isTop = visIdx === topVisIdx;
        const { rot, dx, dy } = getCardOffset(card, absIdx, isTop);

        if (isTop) {
          // Top card gets the landing animation
          return (
            <Animated.View
              key={`${card.rank}-${card.suit}-${absIdx}`}
              style={[
                styles.cardSlot,
                {
                  zIndex: visIdx + 1,
                  transform: [
                    { translateX: dx },
                    { translateY: dy },
                    { rotate: landingRotDeg },
                    { scale: landingScale },
                  ],
                },
              ]}
            >
              <Card card={card} />
            </Animated.View>
          );
        }

        // Non-top cards use static seeded offsets
        return (
          <View
            key={`${card.rank}-${card.suit}-${absIdx}`}
            style={[
              styles.cardSlot,
              {
                zIndex: visIdx + 1,
                transform: [
                  { translateX: dx },
                  { translateY: dy },
                  { rotate: `${rot}deg` },
                ],
              },
            ]}
          >
            <Card card={card} />
          </View>
        );
      })}

      {/* Active suit pill — overlaid above the pile, fades in/out */}
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
  // Fixed card dimensions; overflow visible so rotated cards and the suit pill
  // can extend beyond the bounding box without being clipped.
  container: {
    width: CARD_W,
    height: CARD_H,
    position: 'relative',
  },
  cardSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  emptyPile: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    borderStyle: 'dashed',
  },
  // Suit pill floats above the top card, centred over the pile
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
