import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../utils/theme';

const TURN_SECONDS = 30;

interface TurnTimerProps {
  timerStartedAt: number | null;
  currentPlayerColourHex?: string;
  isMyTurn?: boolean;
  currentPlayerName?: string;
}

export function TurnTimer({
  timerStartedAt,
  currentPlayerColourHex,
  isMyTurn = false,
  currentPlayerName,
}: TurnTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(TURN_SECONDS);

  useEffect(() => {
    if (!timerStartedAt) {
      setSecondsLeft(TURN_SECONDS);
      return;
    }

    function tick() {
      const elapsed = Math.floor((Date.now() - timerStartedAt!) / 1000);
      setSecondsLeft(Math.max(0, TURN_SECONDS - elapsed));
    }

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timerStartedAt]);

  const fraction = secondsLeft / TURN_SECONDS;
  const color =
    secondsLeft <= 8
      ? THEME.danger
      : secondsLeft <= 15
      ? THEME.warning
      : (currentPlayerColourHex ?? THEME.success);

  return (
    <View style={styles.container}>
      {/* Turn label */}
      <View style={styles.labelRow}>
        <Text style={[styles.turnLabel, { color: isMyTurn ? THEME.gold : THEME.textSecondary }]}>
          {isMyTurn ? 'Your turn' : currentPlayerName ? `${currentPlayerName}'s turn` : ''}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.barRow}>
        <View style={styles.track}>
          <View style={[styles.fill, { flex: fraction, backgroundColor: color }]} />
          <View style={{ flex: 1 - fraction }} />
        </View>
        <Text style={[styles.label, { color }]}>{secondsLeft}s</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'transparent',
    gap: 4,
  },
  labelRow: {
    alignItems: 'center',
  },
  turnLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    width: 28,
    textAlign: 'right',
  },
});
