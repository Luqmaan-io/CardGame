import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export interface ToastMessage {
  id: number;
  text: string;
}

interface ToastProps {
  messages: ToastMessage[];
  onExpire: (id: number) => void;
}

function SingleToast({
  message,
  onExpire,
}: {
  message: ToastMessage;
  onExpire: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.delay(3600),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]).start(() => onExpire());
  }, []);

  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Text style={styles.toastText}>{message.text}</Text>
    </Animated.View>
  );
}

export function Toast({ messages, onExpire }: ToastProps) {
  if (messages.length === 0) return null;
  return (
    <View style={styles.container} pointerEvents="none">
      {messages.map((msg) => (
        <SingleToast key={msg.id} message={msg} onExpire={() => onExpire(msg.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
    zIndex: 999,
  },
  toast: {
    backgroundColor: 'rgba(18,18,18,0.93)',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.4)',
  },
  toastText: {
    color: '#ffc107',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
