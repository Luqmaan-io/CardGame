import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TURN_SECONDS = 30;

interface TurnTimerProps {
  timerStartedAt: number | null;
}

export function TurnTimer({ timerStartedAt }: TurnTimerProps) {
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
    secondsLeft > 15 ? '#4caf50' : secondsLeft > 8 ? '#ff9800' : '#f44336';

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { flex: fraction, backgroundColor: color }]} />
        <View style={{ flex: 1 - fraction }} />
      </View>
      <Text style={[styles.label, { color }]}>{secondsLeft}s</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
