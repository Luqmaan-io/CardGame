import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import type { Card as CardType } from '../../engine/types';

interface CardProps {
  card: CardType;
  onPress?: () => void;
  isSelected?: boolean;
  isValid?: boolean;
  faceDown?: boolean;
  isDisabled?: boolean;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const RED_SUITS = new Set(['hearts', 'diamonds']);

export function Card({
  card,
  onPress,
  isSelected = false,
  isValid = false,
  faceDown = false,
  isDisabled = false,
}: CardProps) {
  const isRed = RED_SUITS.has(card.suit);
  const symbol = SUIT_SYMBOLS[card.suit] ?? '';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        isSelected && styles.selected,
        isValid && !isSelected && styles.valid,
        faceDown && styles.faceDown,
        isDisabled && styles.disabled,
      ]}
      disabled={!onPress}
    >
      {faceDown ? (
        <View style={styles.cardBack}>
          <Text style={styles.backPattern}>◆ ◆</Text>
          <Text style={styles.backPattern}>◆ ◆</Text>
        </View>
      ) : (
        <View style={styles.cardFace}>
          <View style={styles.rankCorner}>
            <Text style={[styles.rank, isRed ? styles.red : styles.dark]}>
              {card.rank}
            </Text>
          </View>
          <Text style={[styles.suitCenter, isRed ? styles.red : styles.dark]}>
            {symbol}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 70,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  selected: {
    borderColor: '#4A90E2',
    borderWidth: 2.5,
    shadowColor: '#4A90E2',
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  valid: {
    borderColor: '#43a047',
    borderWidth: 2,
    shadowColor: '#43a047',
    shadowOpacity: 0.55,
    shadowRadius: 5,
  },
  faceDown: {
    backgroundColor: '#1a237e',
    borderColor: '#283593',
  },
  disabled: {
    opacity: 0.5,
  },
  cardBack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backPattern: {
    fontSize: 14,
    color: '#5c6bc0',
    letterSpacing: 2,
  },
  cardFace: {
    flex: 1,
  },
  rankCorner: {
    position: 'absolute',
    top: 5,
    left: 6,
  },
  rank: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 17,
  },
  suitCenter: {
    position: 'absolute',
    top: 37,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 24,
  },
  red: {
    color: '#c62828',
  },
  dark: {
    color: '#1a1a1a',
  },
});
