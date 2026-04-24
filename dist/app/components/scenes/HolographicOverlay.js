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
exports.HolographicOverlay = HolographicOverlay;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
// Inject CSS keyframes once on web
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _webDoc = () => globalThis.document;
let webCSSInjected = false;
function ensureWebCSS() {
    if (webCSSInjected || react_native_1.Platform.OS !== 'web')
        return;
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
function HolographicOverlay({ children, width, height, timerPercent, isCurrentTurn, }) {
    const isWeb = react_native_1.Platform.OS === 'web';
    const [isGlitching, setIsGlitching] = (0, react_1.useState)(false);
    const glitchTimerRef = (0, react_1.useRef)();
    const shimmerAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0.88)).current;
    const shimmerLoopRef = (0, react_1.useRef)(null);
    const isUrgent = timerPercent < 25;
    // Inject CSS once on web
    (0, react_1.useEffect)(() => {
        ensureWebCSS();
    }, []);
    // Shimmer — speed reacts to timer urgency
    (0, react_1.useEffect)(() => {
        const halfDuration = isUrgent ? 250 : 1500;
        shimmerLoopRef.current?.stop();
        const loop = react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(shimmerAnim, {
                toValue: 1.0,
                duration: halfDuration,
                useNativeDriver: true,
            }),
            react_native_1.Animated.timing(shimmerAnim, {
                toValue: 0.88,
                duration: halfDuration,
                useNativeDriver: true,
            }),
        ]));
        shimmerLoopRef.current = loop;
        loop.start();
        return () => shimmerLoopRef.current?.stop();
    }, [isUrgent]);
    // Glitch — web only, fires randomly every 8–15 seconds, lasts 80ms
    (0, react_1.useEffect)(() => {
        if (!isWeb)
            return;
        const scheduleGlitch = () => {
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
        ? { filter: 'hue-rotate(90deg) saturate(3) brightness(1.5)' }
        : {};
    return (<react_native_1.View style={[styles.container, { width, height }, webGlitchStyle]}>
      {/* Scene content — wrapped in shimmer pulse */}
      <react_native_1.Animated.View style={[styles.fill, { opacity: shimmerAnim }]}>
        {children}
      </react_native_1.Animated.View>

      {/* Layer 1 — Blue tint */}
      <react_native_1.View pointerEvents="none" style={[
            styles.overlay,
            { backgroundColor: glowColor, zIndex: 10 },
            isWeb ? { mixBlendMode: 'screen' } : {},
        ]}/>

      {/* Layer 2 — Scan lines (web only) */}
      {isWeb && (<react_native_1.View pointerEvents="none" style={[
                styles.overlay,
                {
                    zIndex: 11,
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
                },
            ]}/>)}
    </react_native_1.View>);
}
const styles = react_native_1.StyleSheet.create({
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
//# sourceMappingURL=HolographicOverlay.js.map