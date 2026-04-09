import { Animated } from 'react-native';

// ─── slideCard ────────────────────────────────────────────────────────────────
// Moves a card from one position to another.

export function slideCard(
  animValue: Animated.ValueXY,
  from: { x: number; y: number },
  to: { x: number; y: number },
  duration: number
): Promise<void> {
  animValue.setValue(from);
  return new Promise((resolve) => {
    Animated.timing(animValue, {
      toValue: to,
      duration,
      useNativeDriver: false,
    }).start(() => resolve());
  });
}

// ─── flipCard ─────────────────────────────────────────────────────────────────
// Scales X from 1→0 then 0→1. Caller swaps card face at midpoint.

export function flipCard(
  animValue: Animated.Value,
  duration: number
): Promise<void> {
  animValue.setValue(1);
  return new Promise((resolve) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0,
        duration: duration / 2,
        useNativeDriver: false,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: duration / 2,
        useNativeDriver: false,
      }),
    ]).start(() => resolve());
  });
}

// ─── bounceSettle ─────────────────────────────────────────────────────────────
// Scale: 1 → 1.1 → 0.95 → 1.0 over 300ms. Used when a card lands.

export function bounceSettle(animValue: Animated.Value): Promise<void> {
  animValue.setValue(1);
  return new Promise((resolve) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 1.1,
        duration: 80,
        useNativeDriver: false,
      }),
      Animated.timing(animValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(animValue, {
        toValue: 1.0,
        duration: 120,
        useNativeDriver: false,
      }),
    ]).start(() => resolve());
  });
}

// ─── cascadeDelay ─────────────────────────────────────────────────────────────
// Returns stagger delay in ms for a card at a given index.

export function cascadeDelay(index: number): number {
  return index * 120;
}

// ─── dealCard ─────────────────────────────────────────────────────────────────
// Slides from deck position to player position, staggered by index.

export function dealCard(
  animValue: Animated.ValueXY,
  deckPosition: { x: number; y: number },
  playerPosition: { x: number; y: number },
  index: number
): Promise<void> {
  const delay = cascadeDelay(index);
  return new Promise((resolve) => {
    setTimeout(() => {
      slideCard(animValue, deckPosition, playerPosition, 320).then(resolve);
    }, delay);
  });
}

// ─── flashOpacity ─────────────────────────────────────────────────────────────
// Pulses opacity N times. Used for timeout flash, win glow.

export function flashOpacity(
  animValue: Animated.Value,
  fromOpacity: number,
  toOpacity: number,
  cycleDuration: number,
  cycles: number
): Promise<void> {
  const sequence = [];
  for (let i = 0; i < cycles; i++) {
    sequence.push(
      Animated.timing(animValue, {
        toValue: toOpacity,
        duration: cycleDuration / 2,
        useNativeDriver: false,
      }),
      Animated.timing(animValue, {
        toValue: fromOpacity,
        duration: cycleDuration / 2,
        useNativeDriver: false,
      })
    );
  }
  return new Promise((resolve) => {
    Animated.sequence(sequence).start(() => resolve());
  });
}

// ─── shakeX ───────────────────────────────────────────────────────────────────
// Brief left-right shake. Used on deck reshuffle.

export function shakeX(animValue: Animated.Value): Promise<void> {
  animValue.setValue(0);
  return new Promise((resolve) => {
    Animated.sequence([
      Animated.timing(animValue, { toValue: -6, duration: 50, useNativeDriver: false }),
      Animated.timing(animValue, { toValue: 6, duration: 50, useNativeDriver: false }),
      Animated.timing(animValue, { toValue: -4, duration: 40, useNativeDriver: false }),
      Animated.timing(animValue, { toValue: 4, duration: 40, useNativeDriver: false }),
      Animated.timing(animValue, { toValue: 0, duration: 40, useNativeDriver: false }),
    ]).start(() => resolve());
  });
}

// ─── getGamePositions ─────────────────────────────────────────────────────────
// Returns approximate screen positions for game elements based on screen size.
// These are layout estimates — good enough for convincing fly animations.

export interface GamePositions {
  deck: { x: number; y: number };
  discard: { x: number; y: number };
  myHand: { x: number; y: number };
  opponent: (index: number, total: number) => { x: number; y: number };
}

export function getGamePositions(
  screenWidth: number,
  screenHeight: number
): GamePositions {
  return {
    // Centre-left of the table area (approximately 40% down the screen)
    deck: { x: screenWidth * 0.28 - 35, y: screenHeight * 0.38 - 50 },
    // Centre-right of the table area
    discard: { x: screenWidth * 0.62 - 35, y: screenHeight * 0.38 - 50 },
    // Bottom hand area centre
    myHand: { x: screenWidth / 2 - 35, y: screenHeight * 0.72 - 50 },
    // Opponent slots distributed across the top
    opponent(index: number, total: number) {
      let xFraction: number;
      if (total === 1) {
        xFraction = 0.5;
      } else if (total === 2) {
        xFraction = index === 0 ? 0.25 : 0.75;
      } else {
        xFraction = 0.17 + index * 0.33;
      }
      return { x: screenWidth * xFraction - 35, y: screenHeight * 0.07 };
    },
  };
}
