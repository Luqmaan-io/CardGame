"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LastMoveBanner = LastMoveBanner;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const Avatar_1 = __importDefault(require("./Avatar"));
const theme_1 = require("../utils/theme");
// ─── MiniCard ─────────────────────────────────────────────────────────────────
const SUIT_SYMBOLS = {
    hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
};
function MiniCard({ card }) {
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    return (<react_native_1.View style={{
            width: 32,
            height: 46,
            backgroundColor: theme_1.THEME.cardFace,
            borderRadius: 4,
            borderWidth: 0.5,
            borderColor: theme_1.THEME.cardBorder,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
        }}>
      <react_native_1.Text style={{
            color: isRed ? theme_1.THEME.cardRed : '#1A1A2E',
            fontSize: 11,
            fontWeight: '500',
            lineHeight: 13,
        }}>
        {card.rank}
      </react_native_1.Text>
      <react_native_1.Text style={{
            color: isRed ? theme_1.THEME.cardRed : '#1A1A2E',
            fontSize: 13,
            lineHeight: 14,
        }}>
        {SUIT_SYMBOLS[card.suit] ?? ''}
      </react_native_1.Text>
    </react_native_1.View>);
}
const MAX_CARDS_SHOWN = 4;
function LastMoveBanner({ entry }) {
    if (!entry)
        return null;
    const actionLabel = entry.action === 'play' ? 'played' :
        entry.action === 'draw' ? 'picked up' : 'was penalised';
    const cardCount = entry.cards.length;
    const shownCards = entry.action === 'play' ? entry.cards.slice(0, MAX_CARDS_SHOWN) : [];
    const overflow = entry.action === 'play' && cardCount > MAX_CARDS_SHOWN ? cardCount - MAX_CARDS_SHOWN : 0;
    return (<react_native_1.View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(13, 27, 42, 0.88)',
            borderBottomWidth: 0.5,
            borderBottomColor: theme_1.THEME.gold,
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            zIndex: 10,
        }}>
      <Avatar_1.default avatarId={entry.playerAvatarId} size={32} colourHex={entry.playerColour}/>

      <react_native_1.Text style={{ color: entry.playerColour, fontSize: 13, fontWeight: '500' }}>
        {entry.playerName}
      </react_native_1.Text>

      <react_native_1.Text style={{ color: theme_1.THEME.textMuted, fontSize: 12 }}>
        {actionLabel}
      </react_native_1.Text>

      {/* Mini cards for play action */}
      {shownCards.map((card, i) => (<MiniCard key={`${card.rank}${card.suit}${i}`} card={card}/>))}

      {/* Overflow label */}
      {overflow > 0 && (<react_native_1.Text style={{ color: theme_1.THEME.textSecondary, fontSize: 12, fontWeight: '600' }}>
          +{overflow} more
        </react_native_1.Text>)}

      {/* Card count for draw/penalty */}
      {entry.action !== 'play' && (<react_native_1.Text style={{ color: theme_1.THEME.textPrimary, fontSize: 13, fontWeight: '500' }}>
          {cardCount} card{cardCount !== 1 ? 's' : ''}
        </react_native_1.Text>)}
    </react_native_1.View>);
}
//# sourceMappingURL=LastMoveBanner.js.map