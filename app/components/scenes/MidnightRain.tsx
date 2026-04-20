import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { registerScene, SceneProps } from './sceneRegistry';

// ─── Web CSS ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _mrDoc = () => (globalThis as any).document as any;

let cssMRInjected = false;
function ensureMRCSS() {
  if (cssMRInjected || Platform.OS !== 'web') return;
  cssMRInjected = true;
  const doc = _mrDoc();
  const style = doc.createElement('style');
  style.setAttribute('data-mr', '1');
  doc.head.appendChild(style);
  style.textContent = `
    @keyframes mr-car-left {
      0%   { transform: translateY(-60px); }
      100% { transform: translateY(360px); }
    }
    @keyframes mr-car-right {
      0%   { transform: translateY(60px); }
      100% { transform: translateY(-360px); }
    }
    @keyframes mr-ripple {
      0%   { r: 0px; opacity: 0.6; }
      100% { r: 12px; opacity: 0; }
    }
    .mr-car-left-1  { animation: mr-car-left  8s  linear infinite; }
    .mr-car-left-2  { animation: mr-car-left  8s  linear infinite; animation-delay: -4s; }
    .mr-car-right-1 { animation: mr-car-right 10s linear infinite; }
    .mr-car-right-2 { animation: mr-car-right 10s linear infinite; animation-delay: -5s; }
    .mr-ripple      { animation: mr-ripple 2s ease-out infinite; }
    .mr-ripple-1    { animation-delay: 0s;   }
    .mr-ripple-2    { animation-delay: 0.4s; }
    .mr-ripple-3    { animation-delay: 0.9s; }
    .mr-ripple-4    { animation-delay: 1.3s; }
    .mr-ripple-5    { animation-delay: 0.2s; }
    .mr-ripple-6    { animation-delay: 0.7s; }
    .mr-ripple-7    { animation-delay: 1.1s; }
    .mr-ripple-8    { animation-delay: 1.6s; }
  `;
}

// ─── Shared static SVG elements ───────────────────────────────────────────────

function RoadBase() {
  return (
    <>
      {/* Dark asphalt background */}
      <Rect width="200" height="300" fill="#1a1a1a" />

      {/* Road — centre 60% of width */}
      <Rect x="40" y="0" width="120" height="300" fill="#242424" />

      {/* Wet road sheen */}
      <Rect x="40" y="0" width="120" height="300" fill="rgba(100,150,200,0.04)" />

      {/* Centre dashed line */}
      <Line
        x1="100" y1="0" x2="100" y2="300"
        stroke="#888" strokeWidth="2"
        strokeDasharray="20 15"
        opacity="0.4"
      />

      {/* Road edges */}
      <Line x1="40"  y1="0" x2="40"  y2="300" stroke="#555" strokeWidth="1" opacity="0.6" />
      <Line x1="160" y1="0" x2="160" y2="300" stroke="#555" strokeWidth="1" opacity="0.6" />

      {/* Left gutter puddles */}
      <Ellipse cx="20" cy="80"  rx="18" ry="8" fill="rgba(100,160,220,0.25)" />
      <Ellipse cx="15" cy="200" rx="14" ry="6" fill="rgba(100,160,220,0.2)"  />

      {/* Right gutter puddles */}
      <Ellipse cx="180" cy="120" rx="16" ry="7" fill="rgba(100,160,220,0.25)" />
      <Ellipse cx="185" cy="240" rx="12" ry="5" fill="rgba(100,160,220,0.2)"  />
    </>
  );
}

function Figure() {
  return (
    <>
      {/* Shadow on wet road */}
      <Ellipse cx="100" cy="152" rx="7" ry="3" fill="rgba(0,0,0,0.3)" />

      {/* Body */}
      <Ellipse cx="100" cy="150" rx="5" ry="7" fill="rgba(40,40,60,0.9)" />

      {/* Umbrella canopy */}
      <Ellipse
        cx="100" cy="143" rx="18" ry="6"
        fill="rgba(30,40,80,0.85)"
        stroke="rgba(100,150,220,0.6)"
        strokeWidth="0.5"
      />

      {/* Umbrella spokes */}
      <Line x1="100" y1="143" x2="82"  y2="143" stroke="rgba(100,150,220,0.4)" strokeWidth="0.5" />
      <Line x1="100" y1="143" x2="118" y2="143" stroke="rgba(100,150,220,0.4)" strokeWidth="0.5" />
      <Line x1="100" y1="143" x2="89"  y2="138" stroke="rgba(100,150,220,0.4)" strokeWidth="0.5" />
      <Line x1="100" y1="143" x2="111" y2="138" stroke="rgba(100,150,220,0.4)" strokeWidth="0.5" />
      <Line x1="100" y1="143" x2="89"  y2="148" stroke="rgba(100,150,220,0.4)" strokeWidth="0.5" />
      <Line x1="100" y1="143" x2="111" y2="148" stroke="rgba(100,150,220,0.4)" strokeWidth="0.5" />

      {/* Umbrella handle */}
      <Line x1="100" y1="143" x2="100" y2="157" stroke="rgba(100,150,220,0.5)" strokeWidth="0.8" />
    </>
  );
}

// ─── Web version — CSS animated ───────────────────────────────────────────────

function MidnightRainWeb({ width, height }: { width: number; height: number }) {
  useEffect(() => { ensureMRCSS(); }, []);

  return (
    <Svg width={width} height={height} viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice">
      <RoadBase />

      {/* Ripples — 8 circles at different road positions */}
      {/* @ts-ignore — className supported on web via react-native-svg */}
      <Circle className="mr-ripple mr-ripple-1" cx="65"  cy="60"  r={0} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5" />
      {/* @ts-ignore */}
      <Circle className="mr-ripple mr-ripple-2" cx="130" cy="140" r={0} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5" />
      {/* @ts-ignore */}
      <Circle className="mr-ripple mr-ripple-3" cx="80"  cy="220" r={0} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5" />
      {/* @ts-ignore */}
      <Circle className="mr-ripple mr-ripple-4" cx="120" cy="30"  r={0} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5" />
      {/* @ts-ignore */}
      <Circle className="mr-ripple mr-ripple-5" cx="75"  cy="200" r={0} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5" />
      {/* @ts-ignore */}
      <Circle className="mr-ripple mr-ripple-6" cx="120" cy="90"  r={0} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5" />
      {/* @ts-ignore */}
      <Circle className="mr-ripple mr-ripple-7" cx="85"  cy="250" r={0} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5" />
      {/* @ts-ignore */}
      <Circle className="mr-ripple mr-ripple-8" cx="110" cy="180" r={0} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5" />

      {/* Left lane — cars moving downward (toward viewer) */}
      {/* @ts-ignore */}
      <G className="mr-car-left-1">
        <Rect x="50" y="-40" width="30" height="20" rx="4" fill="#2a2a2a" />
        <Ellipse cx="56" cy="-20" rx="4" ry="3" fill="rgba(255,240,200,0.9)" />
        <Ellipse cx="74" cy="-20" rx="4" ry="3" fill="rgba(255,240,200,0.9)" />
        <Path d="M52,-20 L44,20 L68,20 L78,-20" fill="rgba(255,240,180,0.06)" />
      </G>
      {/* @ts-ignore */}
      <G className="mr-car-left-2">
        <Rect x="50" y="-40" width="30" height="20" rx="4" fill="#2a2a2a" />
        <Ellipse cx="56" cy="-20" rx="4" ry="3" fill="rgba(255,240,200,0.9)" />
        <Ellipse cx="74" cy="-20" rx="4" ry="3" fill="rgba(255,240,200,0.9)" />
        <Path d="M52,-20 L44,20 L68,20 L78,-20" fill="rgba(255,240,180,0.06)" />
      </G>

      {/* Headlight reflections on wet road */}
      {/* @ts-ignore */}
      <Ellipse className="mr-car-left-1" cx="65" cy="0" rx="20" ry="8" fill="rgba(255,240,180,0.08)" />
      {/* @ts-ignore */}
      <Ellipse className="mr-car-left-2" cx="65" cy="0" rx="20" ry="8" fill="rgba(255,240,180,0.06)" />

      {/* Right lane — cars moving upward (away from viewer) */}
      {/* @ts-ignore */}
      <G className="mr-car-right-1">
        <Rect x="120" y="320" width="30" height="20" rx="4" fill="#2a2a2a" />
        <Ellipse cx="126" cy="340" rx="4" ry="3" fill="rgba(255,50,50,0.8)" />
        <Ellipse cx="144" cy="340" rx="4" ry="3" fill="rgba(255,50,50,0.8)" />
      </G>
      {/* @ts-ignore */}
      <G className="mr-car-right-2">
        <Rect x="120" y="320" width="30" height="20" rx="4" fill="#2a2a2a" />
        <Ellipse cx="126" cy="340" rx="4" ry="3" fill="rgba(255,50,50,0.8)" />
        <Ellipse cx="144" cy="340" rx="4" ry="3" fill="rgba(255,50,50,0.8)" />
      </G>

      {/* Figure — completely still */}
      <Figure />
    </Svg>
  );
}

// ─── Native version — Animated ────────────────────────────────────────────────

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Ripple positions
const RIPPLE_POSITIONS = [
  { cx: 65,  cy: 60  },
  { cx: 130, cy: 140 },
  { cx: 80,  cy: 220 },
  { cx: 120, cy: 90  },
];
const RIPPLE_DELAYS = [0, 500, 1000, 1500];

function MidnightRainNative({ width, height }: { width: number; height: number }) {
  // Cars
  const carLeftY  = useRef(new Animated.Value(-60)).current;
  const carRightY = useRef(new Animated.Value(60)).current;

  // Ripples — r and strokeOpacity per ripple
  const rippleRefs = useRef(
    RIPPLE_POSITIONS.map(() => ({
      r: new Animated.Value(0),
      opacity: new Animated.Value(0.6),
    }))
  ).current;

  useEffect(() => {
    // Car — left lane, downward
    Animated.loop(
      Animated.timing(carLeftY, {
        toValue: 360,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    // Car — right lane, upward
    Animated.loop(
      Animated.timing(carRightY, {
        toValue: -360,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    // Ripples — staggered delays
    rippleRefs.forEach((vals, i) => {
      const startRipple = () => {
        vals.r.setValue(0);
        vals.opacity.setValue(0.6);
        Animated.parallel([
          Animated.timing(vals.r, {
            toValue: 12,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(vals.opacity, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
        ]).start(() => startRipple());
      };

      const t = setTimeout(startRipple, RIPPLE_DELAYS[i] ?? 0);
      return () => clearTimeout(t);
    });

    return () => {
      carLeftY.stopAnimation();
      carRightY.stopAnimation();
      rippleRefs.forEach((v) => { v.r.stopAnimation(); v.opacity.stopAnimation(); });
    };
  }, []);

  return (
    <Svg width={width} height={height} viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice">
      <RoadBase />

      {/* Ripples */}
      {rippleRefs.map((vals, i) => {
        const pos = RIPPLE_POSITIONS[i]!;
        return (
          <AnimatedCircle
            key={i}
            cx={pos.cx}
            cy={pos.cy}
            r={vals.r as unknown as number}
            fill="none"
            stroke="rgba(150,200,255,0.4)"
            strokeWidth="0.5"
            strokeOpacity={vals.opacity as unknown as number}
          />
        );
      })}

      {/* Left lane car */}
      <AnimatedG y={carLeftY as unknown as number}>
        <Rect x="50" y="-40" width="30" height="20" rx="4" fill="#2a2a2a" />
        <Ellipse cx="56" cy="-20" rx="4" ry="3" fill="rgba(255,240,200,0.9)" />
        <Ellipse cx="74" cy="-20" rx="4" ry="3" fill="rgba(255,240,200,0.9)" />
        <Path d="M52,-20 L44,20 L68,20 L78,-20" fill="rgba(255,240,180,0.06)" />
      </AnimatedG>

      {/* Right lane car */}
      <AnimatedG y={carRightY as unknown as number}>
        <Rect x="120" y="320" width="30" height="20" rx="4" fill="#2a2a2a" />
        <Ellipse cx="126" cy="340" rx="4" ry="3" fill="rgba(255,50,50,0.8)" />
        <Ellipse cx="144" cy="340" rx="4" ry="3" fill="rgba(255,50,50,0.8)" />
      </AnimatedG>

      {/* Figure — completely still */}
      <Figure />
    </Svg>
  );
}

// ─── Scene component ──────────────────────────────────────────────────────────

function MidnightRainScene({ width, height, isCurrentTurn, timerPercent }: SceneProps) {
  if (Platform.OS === 'web') {
    return <MidnightRainWeb width={width} height={height} />;
  }
  return <MidnightRainNative width={width} height={height} />;
}

// ─── Registration ─────────────────────────────────────────────────────────────

registerScene({
  id: 'midnight_rain',
  name: 'Midnight Rain',
  description: 'Standing in the road. The world moves around you.',
  rarity: 'default',
  component: MidnightRainScene,
});

export default MidnightRainScene;
