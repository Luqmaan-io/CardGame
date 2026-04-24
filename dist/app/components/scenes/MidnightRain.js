"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_svg_1 = __importStar(require("react-native-svg"));
const sceneRegistry_1 = require("./sceneRegistry");
// ─── Web CSS ──────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _mrDoc = () => globalThis.document;
let cssMRInjected = false;
function ensureMRCSS() {
    if (cssMRInjected || react_native_1.Platform.OS !== 'web')
        return;
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
    return (<>
      {/* Dark asphalt background */}
      <react_native_svg_1.Rect width="200" height="300" fill="#1a1a1a"/>

      {/* Road — centre 60% of width */}
      <react_native_svg_1.Rect x="40" y="0" width="120" height="300" fill="#242424"/>

      {/* Wet road sheen */}
      <react_native_svg_1.Rect x="40" y="0" width="120" height="300" fill="rgba(100,150,200,0.04)"/>

      {/* Centre dashed line */}
      <react_native_svg_1.Line x1="100" y1="0" x2="100" y2="300" stroke="#888" strokeWidth="2" strokeDasharray="20 15" opacity="0.4"/>

      {/* Road edges */}
      <react_native_svg_1.Line x1="40" y1="0" x2="40" y2="300" stroke="#555" strokeWidth="1" opacity="0.6"/>
      <react_native_svg_1.Line x1="160" y1="0" x2="160" y2="300" stroke="#555" strokeWidth="1" opacity="0.6"/>

      {/* Left gutter puddles */}
      <react_native_svg_1.Ellipse cx="20" cy="80" rx="18" ry="8" fill="rgba(100,160,220,0.25)"/>
      <react_native_svg_1.Ellipse cx="15" cy="200" rx="14" ry="6" fill="rgba(100,160,220,0.2)"/>

      {/* Right gutter puddles */}
      <react_native_svg_1.Ellipse cx="180" cy="120" rx="16" ry="7" fill="rgba(100,160,220,0.25)"/>
      <react_native_svg_1.Ellipse cx="185" cy="240" rx="12" ry="5" fill="rgba(100,160,220,0.2)"/>
    </>);
}
function Figure() {
    return (<>
      {/* Shadow on wet road */}
      <react_native_svg_1.Ellipse cx="100" cy="152" rx="7" ry="3" fill="rgba(0,0,0,0.3)"/>

      {/* Body */}
      <react_native_svg_1.Ellipse cx="100" cy="150" rx="5" ry="7" fill="rgba(40,40,60,0.9)"/>

      {/* Umbrella canopy */}
      <react_native_svg_1.Ellipse cx="100" cy="143" rx="18" ry="6" fill="rgba(30,40,80,0.85)" stroke="rgba(100,150,220,0.6)" strokeWidth="0.5"/>

      {/* Umbrella spokes */}
      <react_native_svg_1.Line x1="100" y1="143" x2="82" y2="143" stroke="rgba(100,150,220,0.4)" strokeWidth="0.5"/>
      <react_native_svg_1.Line x1="100" y1="143" x2="118" y2="143" stroke="rgba(100,150,220,0.4)" strokeWidth="0.5"/>
      <react_native_svg_1.Line x1="100" y1="143" x2="89" y2="138" stroke="rgba(100,150,220,0.4)" strokeWidth="0.5"/>
      <react_native_svg_1.Line x1="100" y1="143" x2="111" y2="138" stroke="rgba(100,150,220,0.4)" strokeWidth="0.5"/>
      <react_native_svg_1.Line x1="100" y1="143" x2="89" y2="148" stroke="rgba(100,150,220,0.4)" strokeWidth="0.5"/>
      <react_native_svg_1.Line x1="100" y1="143" x2="111" y2="148" stroke="rgba(100,150,220,0.4)" strokeWidth="0.5"/>

      {/* Umbrella handle */}
      <react_native_svg_1.Line x1="100" y1="143" x2="100" y2="157" stroke="rgba(100,150,220,0.5)" strokeWidth="0.8"/>
    </>);
}
// ─── Web version — CSS animated ───────────────────────────────────────────────
function MidnightRainWeb({ width, height }) {
    (0, react_1.useEffect)(() => { ensureMRCSS(); }, []);
    return (<react_native_svg_1.default width={width} height={height} viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice">
      <RoadBase />

      {/* Ripples — 8 circles at different road positions */}
      {/* @ts-ignore — className supported on web via react-native-svg */}
      <react_native_svg_1.Circle className="mr-ripple mr-ripple-1" cx="65" cy="60" r={0} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5"/>
      {/* @ts-ignore */}
      <react_native_svg_1.Circle className="mr-ripple mr-ripple-2" cx="130" cy="140" r={0} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5"/>
      {/* @ts-ignore */}
      <react_native_svg_1.Circle className="mr-ripple mr-ripple-3" cx="80" cy="220" r={0} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5"/>
      {/* @ts-ignore */}
      <react_native_svg_1.Circle className="mr-ripple mr-ripple-4" cx="120" cy="30" r={0} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5"/>
      {/* @ts-ignore */}
      <react_native_svg_1.Circle className="mr-ripple mr-ripple-5" cx="75" cy="200" r={0} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5"/>
      {/* @ts-ignore */}
      <react_native_svg_1.Circle className="mr-ripple mr-ripple-6" cx="120" cy="90" r={0} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5"/>
      {/* @ts-ignore */}
      <react_native_svg_1.Circle className="mr-ripple mr-ripple-7" cx="85" cy="250" r={0} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5"/>
      {/* @ts-ignore */}
      <react_native_svg_1.Circle className="mr-ripple mr-ripple-8" cx="110" cy="180" r={0} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5"/>

      {/* Left lane — cars moving downward (toward viewer) */}
      {/* @ts-ignore */}
      <react_native_svg_1.G className="mr-car-left-1">
        <react_native_svg_1.Rect x="50" y="-40" width="30" height="20" rx="4" fill="#2a2a2a"/>
        <react_native_svg_1.Ellipse cx="56" cy="-20" rx="4" ry="3" fill="rgba(255,240,200,0.9)"/>
        <react_native_svg_1.Ellipse cx="74" cy="-20" rx="4" ry="3" fill="rgba(255,240,200,0.9)"/>
        <react_native_svg_1.Path d="M52,-20 L44,20 L68,20 L78,-20" fill="rgba(255,240,180,0.06)"/>
      </react_native_svg_1.G>
      {/* @ts-ignore */}
      <react_native_svg_1.G className="mr-car-left-2">
        <react_native_svg_1.Rect x="50" y="-40" width="30" height="20" rx="4" fill="#2a2a2a"/>
        <react_native_svg_1.Ellipse cx="56" cy="-20" rx="4" ry="3" fill="rgba(255,240,200,0.9)"/>
        <react_native_svg_1.Ellipse cx="74" cy="-20" rx="4" ry="3" fill="rgba(255,240,200,0.9)"/>
        <react_native_svg_1.Path d="M52,-20 L44,20 L68,20 L78,-20" fill="rgba(255,240,180,0.06)"/>
      </react_native_svg_1.G>

      {/* Headlight reflections on wet road */}
      {/* @ts-ignore */}
      <react_native_svg_1.Ellipse className="mr-car-left-1" cx="65" cy="0" rx="20" ry="8" fill="rgba(255,240,180,0.08)"/>
      {/* @ts-ignore */}
      <react_native_svg_1.Ellipse className="mr-car-left-2" cx="65" cy="0" rx="20" ry="8" fill="rgba(255,240,180,0.06)"/>

      {/* Right lane — cars moving upward (away from viewer) */}
      {/* @ts-ignore */}
      <react_native_svg_1.G className="mr-car-right-1">
        <react_native_svg_1.Rect x="120" y="320" width="30" height="20" rx="4" fill="#2a2a2a"/>
        <react_native_svg_1.Ellipse cx="126" cy="340" rx="4" ry="3" fill="rgba(255,50,50,0.8)"/>
        <react_native_svg_1.Ellipse cx="144" cy="340" rx="4" ry="3" fill="rgba(255,50,50,0.8)"/>
      </react_native_svg_1.G>
      {/* @ts-ignore */}
      <react_native_svg_1.G className="mr-car-right-2">
        <react_native_svg_1.Rect x="120" y="320" width="30" height="20" rx="4" fill="#2a2a2a"/>
        <react_native_svg_1.Ellipse cx="126" cy="340" rx="4" ry="3" fill="rgba(255,50,50,0.8)"/>
        <react_native_svg_1.Ellipse cx="144" cy="340" rx="4" ry="3" fill="rgba(255,50,50,0.8)"/>
      </react_native_svg_1.G>

      {/* Figure — completely still */}
      <Figure />
    </react_native_svg_1.default>);
}
// ─── Native version — Animated ────────────────────────────────────────────────
const AnimatedG = react_native_1.Animated.createAnimatedComponent(react_native_svg_1.G);
const AnimatedCircle = react_native_1.Animated.createAnimatedComponent(react_native_svg_1.Circle);
// Ripple positions
const RIPPLE_POSITIONS = [
    { cx: 65, cy: 60 },
    { cx: 130, cy: 140 },
    { cx: 80, cy: 220 },
    { cx: 120, cy: 90 },
];
const RIPPLE_DELAYS = [0, 500, 1000, 1500];
function MidnightRainNative({ width, height }) {
    // Cars
    const carLeftY = (0, react_1.useRef)(new react_native_1.Animated.Value(-60)).current;
    const carRightY = (0, react_1.useRef)(new react_native_1.Animated.Value(60)).current;
    // Ripples — r and strokeOpacity per ripple
    const rippleRefs = (0, react_1.useRef)(RIPPLE_POSITIONS.map(() => ({
        r: new react_native_1.Animated.Value(0),
        opacity: new react_native_1.Animated.Value(0.6),
    }))).current;
    (0, react_1.useEffect)(() => {
        // Car — left lane, downward
        react_native_1.Animated.loop(react_native_1.Animated.timing(carLeftY, {
            toValue: 360,
            duration: 8000,
            easing: react_native_1.Easing.linear,
            useNativeDriver: false,
        })).start();
        // Car — right lane, upward
        react_native_1.Animated.loop(react_native_1.Animated.timing(carRightY, {
            toValue: -360,
            duration: 10000,
            easing: react_native_1.Easing.linear,
            useNativeDriver: false,
        })).start();
        // Ripples — staggered delays
        rippleRefs.forEach((vals, i) => {
            const startRipple = () => {
                vals.r.setValue(0);
                vals.opacity.setValue(0.6);
                react_native_1.Animated.parallel([
                    react_native_1.Animated.timing(vals.r, {
                        toValue: 12,
                        duration: 2000,
                        easing: react_native_1.Easing.out(react_native_1.Easing.ease),
                        useNativeDriver: false,
                    }),
                    react_native_1.Animated.timing(vals.opacity, {
                        toValue: 0,
                        duration: 2000,
                        easing: react_native_1.Easing.out(react_native_1.Easing.ease),
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
    return (<react_native_svg_1.default width={width} height={height} viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice">
      <RoadBase />

      {/* Ripples */}
      {rippleRefs.map((vals, i) => {
            const pos = RIPPLE_POSITIONS[i];
            return (<AnimatedCircle key={i} cx={pos.cx} cy={pos.cy} r={vals.r} fill="none" stroke="rgba(150,200,255,0.4)" strokeWidth="0.5" strokeOpacity={vals.opacity}/>);
        })}

      {/* Left lane car */}
      <AnimatedG y={carLeftY}>
        <react_native_svg_1.Rect x="50" y="-40" width="30" height="20" rx="4" fill="#2a2a2a"/>
        <react_native_svg_1.Ellipse cx="56" cy="-20" rx="4" ry="3" fill="rgba(255,240,200,0.9)"/>
        <react_native_svg_1.Ellipse cx="74" cy="-20" rx="4" ry="3" fill="rgba(255,240,200,0.9)"/>
        <react_native_svg_1.Path d="M52,-20 L44,20 L68,20 L78,-20" fill="rgba(255,240,180,0.06)"/>
      </AnimatedG>

      {/* Right lane car */}
      <AnimatedG y={carRightY}>
        <react_native_svg_1.Rect x="120" y="320" width="30" height="20" rx="4" fill="#2a2a2a"/>
        <react_native_svg_1.Ellipse cx="126" cy="340" rx="4" ry="3" fill="rgba(255,50,50,0.8)"/>
        <react_native_svg_1.Ellipse cx="144" cy="340" rx="4" ry="3" fill="rgba(255,50,50,0.8)"/>
      </AnimatedG>

      {/* Figure — completely still */}
      <Figure />
    </react_native_svg_1.default>);
}
// ─── Scene component ──────────────────────────────────────────────────────────
function MidnightRainScene({ width, height, isCurrentTurn, timerPercent }) {
    if (react_native_1.Platform.OS === 'web') {
        return <MidnightRainWeb width={width} height={height}/>;
    }
    return <MidnightRainNative width={width} height={height}/>;
}
// ─── Registration ─────────────────────────────────────────────────────────────
(0, sceneRegistry_1.registerScene)({
    id: 'midnight_rain',
    name: 'Midnight Rain',
    description: 'Standing in the road. The world moves around you.',
    rarity: 'default',
    component: MidnightRainScene,
});
exports.default = MidnightRainScene;
//# sourceMappingURL=MidnightRain.js.map