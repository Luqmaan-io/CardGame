import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import type { Card as CardType } from '../../engine/types';
import { THEME } from '../utils/theme';

interface CardProps {
  card: CardType;
  onPress?: () => void;
  isSelected?: boolean;
  isValid?: boolean;
  faceDown?: boolean;
  isDisabled?: boolean;
  // Override dimensions (used for mini history cards)
  width?: number;
  height?: number;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const RED_SUITS = new Set(['hearts', 'diamonds']);

// ─── CardBack ────────────────────────────────────────────────────────────────
// Navy background with gold diamond pattern. Used for all face-down cards.

export function CardBack({ width = 70, height = 100 }: { width?: number; height?: number }) {
  return (
    <View
      style={[
        styles.cardBack,
        { width, height, borderRadius: Math.round(height * 0.07) },
      ]}
    >
      {/* Outer diamond */}
      <View
        style={{
          width: width * 0.6,
          height: height * 0.6,
          borderWidth: 1.5,
          borderColor: THEME.gold,
          transform: [{ rotate: '45deg' }],
          position: 'absolute',
        }}
      />
      {/* Inner diamond */}
      <View
        style={{
          width: width * 0.38,
          height: height * 0.38,
          borderWidth: 1,
          borderColor: THEME.goldLight,
          transform: [{ rotate: '45deg' }],
          position: 'absolute',
        }}
      />
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  card,
  onPress,
  isSelected = false,
  isValid = false,
  faceDown = false,
  isDisabled = false,
  width = 70,
  height = 100,
}: CardProps) {
  const isRed = RED_SUITS.has(card.suit);
  const symbol = SUIT_SYMBOLS[card.suit] ?? '';
  const suitColour = isRed ? THEME.cardRed : THEME.cardBlack;

  const rankFontSize = Math.round(height * 0.14);
  const suitFontSize = Math.round(height * 0.24);
  const borderRadius = Math.round(height * 0.07);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          width,
          height,
          borderRadius,
        },
        isSelected && styles.selected,
        isValid && !isSelected && styles.valid,
        isDisabled && styles.disabled,
      ]}
      disabled={!onPress}
    >
      {faceDown ? (
        <CardBack width={width} height={height} />
      ) : (
        <View style={[styles.cardFace, { borderRadius }]}>
          {/* Top-left rank + suit */}
          <View style={styles.rankCornerTL}>
            <Text style={[styles.rankText, { fontSize: rankFontSize, color: suitColour }]}>
              {card.rank}
            </Text>
            <Text style={[styles.suitSmall, { fontSize: rankFontSize - 2, color: suitColour }]}>
              {symbol}
            </Text>
          </View>

          {/* Centre suit symbol */}
          <Text style={[styles.suitCenter, { fontSize: suitFontSize, color: suitColour }]}>
            {symbol}
          </Text>

          {/* Bottom-right rank + suit (rotated 180°) */}
          <View style={[styles.rankCornerBR, { transform: [{ rotate: '180deg' }] }]}>
            <Text style={[styles.rankText, { fontSize: rankFontSize, color: suitColour }]}>
              {card.rank}
            </Text>
            <Text style={[styles.suitSmall, { fontSize: rankFontSize - 2, color: suitColour }]}>
              {symbol}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 70,
    height: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  selected: {
    borderColor: THEME.gold,
    borderWidth: 2,
    shadowColor: THEME.gold,
    shadowOpacity: 0.55,
    shadowRadius: 8,
    // Lift handled by parent transform in Hand component
  },
  valid: {
    borderColor: THEME.goldLight,
    borderWidth: 1.5,
    shadowColor: THEME.gold,
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  disabled: {
    opacity: 0.4,
  },
  // Face-down card — navy with gold diamond pattern
  cardBack: {
    backgroundColor: THEME.cardBack,
    borderWidth: 1,
    borderColor: THEME.gold,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Face-up card — warm white
  cardFace: {
    flex: 1,
    backgroundColor: THEME.cardFace,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  rankCornerTL: {
    position: 'absolute',
    top: 4,
    left: 5,
    alignItems: 'center',
  },
  rankCornerBR: {
    position: 'absolute',
    bottom: 4,
    right: 5,
    alignItems: 'center',
  },
  rankText: {
    fontWeight: '800',
    lineHeight: 16,
  },
  suitSmall: {
    lineHeight: 13,
  },
  suitCenter: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    // web fallback
    lineHeight: 100,
  },
});
