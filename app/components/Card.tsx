import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import type { Card as CardType } from '../../engine/types';
import { THEME } from '../utils/theme';
import { CARD_BACKS_MAP } from '../assets/cardbacks';
import { CARD_FACES_MAP } from '../assets/cardfaces';

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
  // Design IDs — falls back to defaults if not provided
  backDesignId?: string;
  faceDesignId?: string;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const RED_SUITS = new Set(['hearts', 'diamonds']);

// ─── CardBack ────────────────────────────────────────────────────────────────

export function CardBack({
  width = 88,
  height = 124,
  backDesignId = 'back_00',
}: {
  width?: number;
  height?: number;
  backDesignId?: string;
}) {
  const design = CARD_BACKS_MAP[backDesignId] ?? CARD_BACKS_MAP['back_00'];
  const borderRadius = Math.round(height * 0.07);

  if (Platform.OS === 'web' && design) {
    return (
      <View
        style={[
          styles.cardBack,
          {
            width,
            height,
            borderRadius,
            backgroundColor: design.bgColour,
            borderColor: design.accentColour,
          },
          { overflow: 'hidden' },
        ]}
      >
        {/* @ts-ignore — web-only SVG rendering */}
        <svg
          width={width}
          height={height}
          viewBox="0 0 200 300"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', top: 0, left: 0 }}
          dangerouslySetInnerHTML={{ __html: design.svgContent }}
        />
      </View>
    );
  }

  // Native fallback — geometric diamond pattern using the design's accent colour
  return (
    <View
      style={[
        styles.cardBack,
        {
          width,
          height,
          borderRadius,
          backgroundColor: design?.bgColour ?? THEME.cardBack,
          borderColor: design?.accentColour ?? THEME.gold,
        },
      ]}
    >
      {/* Outer diamond */}
      <View
        style={{
          width: width * 0.6,
          height: height * 0.6,
          borderWidth: 1.5,
          borderColor: design?.accentColour ?? THEME.gold,
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
          borderColor: design?.accentColour ?? THEME.goldLight,
          transform: [{ rotate: '45deg' }],
          position: 'absolute',
          opacity: 0.55,
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
  width = 88,
  height = 124,
  backDesignId = 'back_00',
  faceDesignId = 'face_00',
}: CardProps) {
  const isRed = RED_SUITS.has(card.suit);
  const symbol = SUIT_SYMBOLS[card.suit] ?? '';

  const faceDesign = CARD_FACES_MAP[faceDesignId] ?? CARD_FACES_MAP['face_00'];
  const suitColour = isRed
    ? (faceDesign?.rankColourRed ?? THEME.cardRed)
    : (faceDesign?.rankColourBlack ?? THEME.cardBlack);

  const rankFontSize = Math.round(height * 0.14);
  const suitFontSize = Math.round(height * 0.24);
  const borderRadius = faceDesign?.cornerStyle === 'sharp'
    ? Math.round(height * 0.03)
    : faceDesign?.cornerStyle === 'rounded'
      ? Math.round(height * 0.1)
      : Math.round(height * 0.07);

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
        <CardBack width={width} height={height} backDesignId={backDesignId} />
      ) : (
        <View
          style={[
            styles.cardFace,
            {
              borderRadius,
              backgroundColor: faceDesign?.bgColour ?? THEME.cardFace,
              borderColor: faceDesign?.borderColour ?? THEME.cardBorder,
              borderWidth: faceDesign?.borderWidth ?? 1,
            },
          ]}
        >
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
          <Text style={[styles.suitCenter, { fontSize: suitFontSize, color: suitColour, lineHeight: height }]}>
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
    width: 88,
    height: 124,
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
  cardBack: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardFace: {
    flex: 1,
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
  },
});
