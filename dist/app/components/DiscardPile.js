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
exports.DiscardPile = DiscardPile;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const Card_1 = require("./Card");
// ─── Constants ────────────────────────────────────────────────────────────────
const FAN_SIZE = 4;
const CARD_W = 68;
const CARD_H = 99;
const SUIT_SYMBOLS = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
};
const RED_SUITS = new Set(['hearts', 'diamonds']);
// ─── Component ────────────────────────────────────────────────────────────────
function DiscardPile({ discard, activeSuit }) {
    function getCardKey(card) {
        return `${card.rank}_${card.suit}`;
    }
    const recentCards = (0, react_1.useMemo)(() => discard.slice(-FAN_SIZE).reverse(), // index 0 = top card
    [discard]);
    // ── Active suit fade ──────────────────────────────────────────────────────────
    const suitOpacity = (0, react_1.useRef)(new react_native_1.Animated.Value(activeSuit ? 1 : 0)).current;
    (0, react_1.useEffect)(() => {
        react_native_1.Animated.timing(suitOpacity, {
            toValue: activeSuit ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [activeSuit]);
    // ── Landing settle animation for the top card ─────────────────────────────────
    // Scale: 1.1 → 0.95 → 1.0
    const landingScale = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    const prevTopRef = (0, react_1.useRef)(discard[discard.length - 1] ?? null);
    (0, react_1.useEffect)(() => {
        const top = discard[discard.length - 1] ?? null;
        const prev = prevTopRef.current;
        const isNewCard = top !== null &&
            (prev === null || top.rank !== prev.rank || top.suit !== prev.suit);
        if (isNewCard) {
            landingScale.setValue(1.1);
            react_native_1.Animated.sequence([
                react_native_1.Animated.timing(landingScale, { toValue: 0.95, duration: 140, useNativeDriver: false }),
                react_native_1.Animated.timing(landingScale, { toValue: 1.0, duration: 110, useNativeDriver: false }),
            ]).start();
        }
        prevTopRef.current = top;
    }, [discard.length]);
    // ── Render ────────────────────────────────────────────────────────────────────
    return (<react_native_1.View style={styles.container}>
      {discard.length === 0 && <react_native_1.View style={styles.emptyPile}/>}

      {/* Render bottom-to-top so top card is drawn last (highest z) */}
      {/* Each card sits 1.5px lower than the one above it — just enough depth to show the stack */}
      {[...recentCards].reverse().map((card, reversedIdx) => {
            const stackIdx = recentCards.length - 1 - reversedIdx; // 0 = top
            const isTop = stackIdx === 0;
            if (isTop) {
                return (<react_native_1.Animated.View key={getCardKey(card)} style={[
                        styles.cardSlot,
                        {
                            top: 0,
                            zIndex: FAN_SIZE,
                            transform: [{ scale: landingScale }],
                        },
                    ]}>
              <Card_1.Card card={card} width={CARD_W} height={CARD_H}/>
            </react_native_1.Animated.View>);
            }
            return (<react_native_1.View key={getCardKey(card)} style={[
                    styles.cardSlot,
                    {
                        top: stackIdx * 1.5,
                        zIndex: FAN_SIZE - stackIdx,
                    },
                ]}>
            <Card_1.Card card={card} width={CARD_W} height={CARD_H}/>
          </react_native_1.View>);
        })}

      {/* Active suit pill — floats above the fan, centred */}
      <react_native_1.Animated.View style={[styles.suitPillWrapper, { opacity: suitOpacity }]} pointerEvents="none">
        <react_native_1.View style={styles.suitPill}>
          <react_native_1.Text style={[
            styles.suitSymbol,
            activeSuit && RED_SUITS.has(activeSuit) ? styles.redSuit : styles.darkSuit,
        ]}>
            {activeSuit ? SUIT_SYMBOLS[activeSuit] : ''}
          </react_native_1.Text>
        </react_native_1.View>
      </react_native_1.Animated.View>
    </react_native_1.View>);
}
// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = react_native_1.StyleSheet.create({
    container: {
        width: CARD_W,
        height: CARD_H + 6, // 6px for stack depth offset
        position: 'relative',
    },
    cardSlot: {
        position: 'absolute',
    },
    emptyPile: {
        width: CARD_W,
        height: CARD_H,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.25)',
        borderStyle: 'dashed',
    },
    suitPillWrapper: {
        position: 'absolute',
        top: -38,
        left: -20,
        right: -20,
        alignItems: 'center',
    },
    suitPill: {
        backgroundColor: 'rgba(255,193,7,0.88)',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    suitSymbol: {
        fontSize: 20,
        fontWeight: '700',
    },
    redSuit: {
        color: '#c62828',
    },
    darkSuit: {
        color: '#1a1a1a',
    },
});
//# sourceMappingURL=DiscardPile.js.map