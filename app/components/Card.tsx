import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import type { Card as CardType } from '../../engine/types';

interface CardProps {
  card: CardType;
  onPress?: () => void;
  isSelected?: boolean;
  isValid?: boolean;
  faceDown?: boolean;
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
}: CardProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(isSelected ? -8 : 0, { damping: 15 }) }],
  }));

  const isRed = RED_SUITS.has(card.suit);
  const symbol = SUIT_SYMBOLS[card.suit] ?? '';

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          styles.card,
          isSelected && styles.selected,
          isValid && !isSelected && styles.valid,
          faceDown && styles.faceDown,
        ]}
        disabled={!onPress}
      >
        {faceDown ? (
          <View style={styles.cardBack}>
            <Text style={styles.backPattern}>◆</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.rank, isRed ? styles.red : styles.dark]}>
              {card.rank}
            </Text>
            <Text style={[styles.suit, isRed ? styles.red : styles.dark]}>
              {symbol}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 56,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    gap: 2,
  },
  selected: {
    borderColor: '#4A90E2',
    borderWidth: 2.5,
  },
  valid: {
    borderColor: '#66bb6a',
    borderWidth: 2,
  },
  faceDown: {
    backgroundColor: '#1a237e',
    borderColor: '#283593',
  },
  cardBack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPattern: {
    fontSize: 28,
    color: '#3949ab',
  },
  rank: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  suit: {
    fontSize: 15,
    lineHeight: 18,
  },
  red: {
    color: '#c62828',
  },
  dark: {
    color: '#212121',
  },
});
