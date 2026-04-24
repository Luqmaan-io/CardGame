"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardBack = CardBack;
exports.Card = Card;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const theme_1 = require("../utils/theme");
const SUIT_SYMBOLS = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
};
const RED_SUITS = new Set(['hearts', 'diamonds']);
// ─── CardBack ────────────────────────────────────────────────────────────────
// Navy background with gold diamond pattern. Used for all face-down cards.
function CardBack({ width = 88, height = 124 }) {
    return (<react_native_1.View style={[
            styles.cardBack,
            { width, height, borderRadius: Math.round(height * 0.07) },
        ]}>
      {/* Outer diamond */}
      <react_native_1.View style={{
            width: width * 0.6,
            height: height * 0.6,
            borderWidth: 1.5,
            borderColor: theme_1.THEME.gold,
            transform: [{ rotate: '45deg' }],
            position: 'absolute',
        }}/>
      {/* Inner diamond */}
      <react_native_1.View style={{
            width: width * 0.38,
            height: height * 0.38,
            borderWidth: 1,
            borderColor: theme_1.THEME.goldLight,
            transform: [{ rotate: '45deg' }],
            position: 'absolute',
        }}/>
    </react_native_1.View>);
}
// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ card, onPress, isSelected = false, isValid = false, faceDown = false, isDisabled = false, width = 88, height = 124, }) {
    const isRed = RED_SUITS.has(card.suit);
    const symbol = SUIT_SYMBOLS[card.suit] ?? '';
    const suitColour = isRed ? theme_1.THEME.cardRed : theme_1.THEME.cardBlack;
    const rankFontSize = Math.round(height * 0.14);
    const suitFontSize = Math.round(height * 0.24);
    const borderRadius = Math.round(height * 0.07);
    return (<react_native_1.TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[
            styles.card,
            {
                width,
                height,
                borderRadius,
            },
            isSelected && styles.selected,
            isValid && !isSelected && styles.valid,
            isDisabled && styles.disabled,
        ]} disabled={!onPress}>
      {faceDown ? (<CardBack width={width} height={height}/>) : (<react_native_1.View style={[styles.cardFace, { borderRadius }]}>
          {/* Top-left rank + suit */}
          <react_native_1.View style={styles.rankCornerTL}>
            <react_native_1.Text style={[styles.rankText, { fontSize: rankFontSize, color: suitColour }]}>
              {card.rank}
            </react_native_1.Text>
            <react_native_1.Text style={[styles.suitSmall, { fontSize: rankFontSize - 2, color: suitColour }]}>
              {symbol}
            </react_native_1.Text>
          </react_native_1.View>

          {/* Centre suit symbol */}
          <react_native_1.Text style={[styles.suitCenter, { fontSize: suitFontSize, color: suitColour }]}>
            {symbol}
          </react_native_1.Text>

          {/* Bottom-right rank + suit (rotated 180°) */}
          <react_native_1.View style={[styles.rankCornerBR, { transform: [{ rotate: '180deg' }] }]}>
            <react_native_1.Text style={[styles.rankText, { fontSize: rankFontSize, color: suitColour }]}>
              {card.rank}
            </react_native_1.Text>
            <react_native_1.Text style={[styles.suitSmall, { fontSize: rankFontSize - 2, color: suitColour }]}>
              {symbol}
            </react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>)}
    </react_native_1.TouchableOpacity>);
}
const styles = react_native_1.StyleSheet.create({
    card: {
        width: 88,
        height: 124,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
        overflow: 'hidden',
    },
    selected: {
        borderColor: theme_1.THEME.gold,
        borderWidth: 2,
        shadowColor: theme_1.THEME.gold,
        shadowOpacity: 0.55,
        shadowRadius: 8,
        // Lift handled by parent transform in Hand component
    },
    valid: {
        borderColor: theme_1.THEME.goldLight,
        borderWidth: 1.5,
        shadowColor: theme_1.THEME.gold,
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    disabled: {
        opacity: 0.4,
    },
    // Face-down card — navy with gold diamond pattern
    cardBack: {
        backgroundColor: theme_1.THEME.cardBack,
        borderWidth: 1,
        borderColor: theme_1.THEME.gold,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    // Face-up card — warm white
    cardFace: {
        flex: 1,
        backgroundColor: theme_1.THEME.cardFace,
        borderWidth: 1,
        borderColor: theme_1.THEME.cardBorder,
    },
    rankCornerTL: {
        position: 'absolute',
        top: 4,
        left: 5,
        alignItems: 'center',
    },
    rankCornerBR: {
        position: 'absolute',
        bottom: 4,
        right: 5,
        alignItems: 'center',
    },
    rankText: {
        fontWeight: '800',
        lineHeight: 16,
    },
    suitSmall: {
        lineHeight: 13,
    },
    suitCenter: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        textAlign: 'center',
        textAlignVertical: 'center',
        // web fallback
        lineHeight: 124,
    },
});
//# sourceMappingURL=Card.js.map