import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

// ─── Constants ────────────────────────────────────────────────────────────────

const NUM_PIECES = 20;
const COLORS = [
  '#ff6b6b', '#ffd166', '#06d6a0', '#118ab2',
  '#ff9f1c', '#e76f51', '#a8dadc', '#f72585',
  '#7209b7', '#4cc9f0',
];
const PIECE_SIZE = 10;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConfettiPiece {
  id: number;
  xFraction: number; // 0–1 of screen width
  color: string;
  delay: number;     // ms before it starts falling
  size: number;      // slight size variance
}

interface ConfettiProps {
  width: number;
  height: number;
  active: boolean;
}

// ─── Single falling piece ─────────────────────────────────────────────────────

function FallingPiece({
  piece,
  screenWidth,
  screenHeight,
}: {
  piece: ConfettiPiece;
  screenWidth: number;
  screenHeight: number;
}) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: screenHeight + 40,
          duration: 2000,
          useNativeDriver: false,
        }),
        // Fade out in the last quarter of the fall
        Animated.sequence([
          Animated.delay(1400),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: false,
          }),
        ]),
        // Rotate as it falls
        Animated.timing(rotate, {
          toValue: 4,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]).start();
    }, piece.delay);

    return () => clearTimeout(timer);
  }, []);

  const rotateInterpolated = rotate.interpolate({
    inputRange: [0, 4],
    outputRange: ['0deg', '720deg'],
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: piece.xFraction * screenWidth,
          top: -20,
          width: piece.size,
          height: piece.size,
          backgroundColor: piece.color,
          opacity,
          transform: [{ translateY }, { rotate: rotateInterpolated }],
        },
      ]}
    />
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

export function Confetti({ width, height, active }: ConfettiProps) {
  const pieces = useMemo<ConfettiPiece[]>(() => {
    const result: ConfettiPiece[] = [];
    for (let i = 0; i < NUM_PIECES; i++) {
      result.push({
        id: i,
        xFraction: (i / NUM_PIECES) + (Math.random() * 0.04 - 0.02),
        color: COLORS[i % COLORS.length] ?? '#ffd166',
        delay: Math.floor(Math.random() * 600),
        size: PIECE_SIZE + Math.floor(Math.random() * 6) - 3,
      });
    }
    return result;
  }, []);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece) => (
        <FallingPiece
          key={piece.id}
          piece={piece}
          screenWidth={width}
          screenHeight={height}
        />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    borderRadius: 2,
  },
});
