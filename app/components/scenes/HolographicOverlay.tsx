import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

type HolographicOverlayProps = {
  children: React.ReactNode;
  width: number;
  height: number;
  timerPercent: number;
  isCurrentTurn: boolean;
};

// Inject CSS keyframes once on web
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _webDoc = () => (globalThis as any).document as any;

let webCSSInjected = false;
function ensureWebCSS() {
  if (webCSSInjected || Platform.OS !== 'web') return;
  webCSSInjected = true;
  const doc = _webDoc();
  const style = doc.createElement('style');
  style.setAttribute('data-holo', '1');
  style.textContent = `
    @keyframes hologram-shimmer {
      0%, 100% { opacity: 0.88; }
      50% { opacity: 1.0; }
    }
    @keyframes hologram-scanline {
      0% { transform: translateY(0); }
      100% { transform: translateY(4px); }
    }
  `;
  doc.head.appendChild(style);
}

export function HolographicOverlay({
  children,
  width,
  height,
  timerPercent,
  isCurrentTurn,
}: HolographicOverlayProps) {
  const isWeb = Platform.OS === 'web';
  const [isGlitching, setIsGlitching] = useState(false);
  const glitchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const shimmerAnim = useRef(new Animated.Value(0.88)).current;
  const shimmerLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const isUrgent = timerPercent < 25;

  // Inject CSS once on web
  useEffect(() => {
    ensureWebCSS();
  }, []);

  // Shimmer — speed reacts to timer urgency
  useEffect(() => {
    const halfDuration = isUrgent ? 250 : 1500;
    shimmerLoopRef.current?.stop();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1.0,
          duration: halfDuration,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.88,
          duration: halfDuration,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerLoopRef.current = loop;
    loop.start();
    return () => shimmerLoopRef.current?.stop();
  }, [isUrgent]);

  // Glitch — web only, fires randomly every 8–15 seconds, lasts 80ms
  useEffect(() => {
    if (!isWeb) return;
    const scheduleGlitch = (): ReturnType<typeof setTimeout> => {
      const delay = 8000 + Math.random() * 7000;
      return setTimeout(() => {
        setIsGlitching(true);
        setTimeout(() => {
          setIsGlitching(false);
          glitchTimerRef.current = scheduleGlitch();
        }, 80);
      }, delay);
    };
    glitchTimerRef.current = scheduleGlitch();
    return () => clearTimeout(glitchTimerRef.current);
  }, []);

  const glowColor = isUrgent
    ? 'rgba(0, 180, 255, 0.28)'
    : 'rgba(0, 180, 255, 0.12)';

  const webGlitchStyle = isWeb && isGlitching
    ? ({ filter: 'hue-rotate(90deg) saturate(3) brightness(1.5)' } as object)
    : {};

  return (
    <View
      style={[styles.container, { width, height }, webGlitchStyle]}
    >
      {/* Scene content — wrapped in shimmer pulse */}
      <Animated.View style={[styles.fill, { opacity: shimmerAnim }]}>
        {children}
      </Animated.View>

      {/* Layer 1 — Blue tint */}
      <View
        pointerEvents="none"
        style={[
          styles.overlay,
          { backgroundColor: glowColor, zIndex: 10 },
          isWeb ? ({ mixBlendMode: 'screen' } as object) : {},
        ]}
      />

      {/* Layer 2 — Scan lines (web only) */}
      {isWeb && (
        <View
          pointerEvents="none"
          style={[
            styles.overlay,
            {
              zIndex: 11,
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
            } as object,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
});
