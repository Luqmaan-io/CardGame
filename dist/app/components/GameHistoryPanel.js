"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameHistoryPanel = GameHistoryPanel;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const theme_1 = require("../utils/theme");
// ─── Mini card ────────────────────────────────────────────────────────────────
const SUIT_SYMBOLS = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
};
const RED_SUITS = new Set(['hearts', 'diamonds']);
function MiniCard({ card }) {
    const isRed = RED_SUITS.has(card.suit);
    const colour = isRed ? theme_1.THEME.cardRed : theme_1.THEME.cardBlack;
    return (<react_native_1.View style={styles.miniCard}>
      <react_native_1.Text style={[styles.miniRank, { color: colour }]}>{card.rank}</react_native_1.Text>
      <react_native_1.Text style={[styles.miniSuit, { color: colour }]}>{SUIT_SYMBOLS[card.suit]}</react_native_1.Text>
    </react_native_1.View>);
}
const OPACITIES = [1, 0.6, 0.35];
function GameHistoryPanel({ history }) {
    if (history.length === 0)
        return null;
    return (<react_native_1.View style={styles.panel}>
      {history.slice(0, 3).map((entry, idx) => {
            const opacity = OPACITIES[idx] ?? 0.35;
            return (<react_native_1.View key={entry.timestamp} style={[styles.entry, idx > 0 && styles.entryDivider, { opacity }]}>
            <react_native_1.View style={styles.entryHeader}>
              <react_native_1.View style={[styles.colourDot, { backgroundColor: entry.playerColour }]}/>
              <react_native_1.Text style={styles.playerName} numberOfLines={1}>
                {entry.playerName}
              </react_native_1.Text>
              <react_native_1.Text style={styles.actionLabel}>
                {entry.action === 'play'
                    ? 'played'
                    : entry.action === 'draw'
                        ? `drew ${entry.cards.length}`
                        : `penalty ×${entry.cards.length}`}
              </react_native_1.Text>
            </react_native_1.View>

            {entry.action === 'play' && entry.cards.length > 0 && (<react_native_1.View style={styles.cardsRow}>
                {entry.cards.map((card, ci) => (<react_native_1.View key={`${card.rank}-${card.suit}`} style={[styles.miniCardWrap, ci > 0 && { marginLeft: -8 }]}>
                    <MiniCard card={card}/>
                  </react_native_1.View>))}
              </react_native_1.View>)}
          </react_native_1.View>);
        })}
    </react_native_1.View>);
}
// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = react_native_1.StyleSheet.create({
    panel: {
        width: 140,
        backgroundColor: 'rgba(13, 27, 42, 0.88)',
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: theme_1.THEME.gold,
        overflow: 'hidden',
    },
    entry: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        gap: 4,
    },
    entryDivider: {
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(201, 168, 76, 0.2)',
    },
    entryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    colourDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        flexShrink: 0,
    },
    playerName: {
        color: theme_1.THEME.textPrimary,
        fontSize: 9,
        fontWeight: '700',
        flex: 1,
    },
    actionLabel: {
        color: theme_1.THEME.textMuted,
        fontSize: 9,
    },
    cardsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'nowrap',
        overflow: 'hidden',
    },
    miniCardWrap: {},
    miniCard: {
        width: 22,
        height: 30,
        backgroundColor: theme_1.THEME.cardFace,
        borderRadius: 3,
        borderWidth: 0.5,
        borderColor: theme_1.THEME.cardBorder,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 1,
    },
    miniRank: {
        fontSize: 8,
        fontWeight: '800',
        lineHeight: 10,
    },
    miniSuit: {
        fontSize: 8,
        lineHeight: 10,
    },
});
//# sourceMappingURL=GameHistoryPanel.js.map