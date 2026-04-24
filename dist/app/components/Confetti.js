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
exports.Confetti = Confetti;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
// ─── Constants ────────────────────────────────────────────────────────────────
const NUM_PIECES = 20;
const COLORS = [
    '#ff6b6b', '#ffd166', '#06d6a0', '#118ab2',
    '#ff9f1c', '#e76f51', '#a8dadc', '#f72585',
    '#7209b7', '#4cc9f0',
];
const PIECE_SIZE = 10;
// ─── Single falling piece ─────────────────────────────────────────────────────
function FallingPiece({ piece, screenWidth, screenHeight, }) {
    const translateY = (0, react_1.useRef)(new react_native_1.Animated.Value(-20)).current;
    const opacity = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    const rotate = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    (0, react_1.useEffect)(() => {
        const timer = setTimeout(() => {
            react_native_1.Animated.parallel([
                react_native_1.Animated.timing(translateY, {
                    toValue: screenHeight + 40,
                    duration: 2000,
                    useNativeDriver: false,
                }),
                // Fade out in the last quarter of the fall
                react_native_1.Animated.sequence([
                    react_native_1.Animated.delay(1400),
                    react_native_1.Animated.timing(opacity, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: false,
                    }),
                ]),
                // Rotate as it falls
                react_native_1.Animated.timing(rotate, {
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
    return (<react_native_1.Animated.View style={[
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
        ]}/>);
}
// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti({ width, height, active }) {
    const pieces = (0, react_1.useMemo)(() => {
        const result = [];
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
    if (!active)
        return null;
    return (<react_native_1.View style={react_native_1.StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece) => (<FallingPiece key={piece.id} piece={piece} screenWidth={width} screenHeight={height}/>))}
    </react_native_1.View>);
}
// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = react_native_1.StyleSheet.create({
    piece: {
        position: 'absolute',
        borderRadius: 2,
    },
});
//# sourceMappingURL=Confetti.js.map