import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Card } from './Card';
import type { Card as CardType } from '../../engine/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnimCardTask {
  id: string;
  card: CardType | null; // null = face-down card
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delay: number;        // ms before this card starts moving
  duration: number;     // ms for the flight
  onComplete?: () => void;
  backDesignId?: string; // card back design for face-down animations
}

export interface AnimationOverlayHandle {
  // Queue one or more cards to fly across the screen
  addCards(tasks: AnimCardTask[]): void;
  // Clear all active animations (e.g. on unmount)
  clearAll(): void;
}

// ─── AnimatingCard ────────────────────────────────────────────────────────────
// Each in-flight card manages its own Animated.ValueXY lifecycle.

interface AnimatingCardProps {
  task: AnimCardTask;
  onDone: (id: string) => void;
}

function AnimatingCard({ task, onDone }: AnimatingCardProps) {
  const pos = useRef(
    new Animated.ValueXY({ x: task.fromX, y: task.fromY })
  ).current;

  // Scale: pop up slightly when landing
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(pos, {
          toValue: { x: task.toX, y: task.toY },
          duration: task.duration,
          useNativeDriver: false,
        }),
        // Subtle scale-up during flight for depth
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.08,
            duration: task.duration * 0.5,
            useNativeDriver: false,
          }),
          Animated.timing(scale, {
            toValue: 1.0,
            duration: task.duration * 0.5,
            useNativeDriver: false,
          }),
        ]),
      ]).start(() => {
        task.onComplete?.();
        onDone(task.id);
      });
    }, task.delay);

    return () => clearTimeout(timer);
  }, []); // Run once only on mount

  return (
    <Animated.View
      style={[
        styles.flyingCard,
        {
          left: pos.x,
          top: pos.y,
          transform: [{ scale }],
        },
      ]}
    >
      <Card
        card={task.card ?? { rank: 'A', suit: 'spades' }}
        faceDown={task.card === null}
        backDesignId={task.backDesignId}
      />
    </Animated.View>
  );
}

// ─── AnimationOverlay ─────────────────────────────────────────────────────────

export const AnimationOverlay = forwardRef<AnimationOverlayHandle>(
  function AnimationOverlay(_props, ref) {
    const [tasks, setTasks] = useState<AnimCardTask[]>([]);
    const idCounter = useRef(0);

    const handleDone = useCallback((id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useImperativeHandle(ref, () => ({
      addCards(newTasks: AnimCardTask[]) {
        setTasks((prev) => [...prev, ...newTasks]);
      },
      clearAll() {
        setTasks([]);
      },
    }));

    if (tasks.length === 0) return null;

    return (
      <View style={styles.overlay} pointerEvents="none">
        {tasks.map((task) => (
          <AnimatingCard key={task.id} task={task} onDone={handleDone} />
        ))}
      </View>
    );
  }
);

// ─── ID helper ────────────────────────────────────────────────────────────────
// Call this to generate unique IDs for animation tasks.

let _uidCounter = 0;
export function animId(): string {
  return `anim_${++_uidCounter}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  flyingCard: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
});
