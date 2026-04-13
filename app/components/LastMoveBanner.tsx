import React from 'react';
import { View, Text } from 'react-native';
import Avatar from './Avatar';
import { THEME } from '../utils/theme';
import type { Card } from '../../engine/types';
import type { HistoryEntry } from './GameHistoryPanel';

// ─── MiniCard ─────────────────────────────────────────────────────────────────

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
};

function MiniCard({ card }: { card: Card }) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  return (
    <View style={{
      width: 28,
      height: 40,
      backgroundColor: THEME.cardFace,
      borderRadius: 4,
      borderWidth: 0.5,
      borderColor: THEME.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
    }}>
      <Text style={{
        color: isRed ? THEME.cardRed : '#1A1A2E',
        fontSize: 11,
        fontWeight: '500',
        lineHeight: 13,
      }}>
        {card.rank}
      </Text>
      <Text style={{
        color: isRed ? THEME.cardRed : '#1A1A2E',
        fontSize: 13,
        lineHeight: 14,
      }}>
        {SUIT_SYMBOLS[card.suit] ?? ''}
      </Text>
    </View>
  );
}

// ─── LastMoveBanner ───────────────────────────────────────────────────────────

interface LastMoveBannerProps {
  entry: HistoryEntry | null;
}

const MAX_CARDS_SHOWN = 4;

export function LastMoveBanner({ entry }: LastMoveBannerProps) {
  if (!entry) return null;

  const actionLabel =
    entry.action === 'play' ? 'played' :
    entry.action === 'draw' ? 'picked up' : 'was penalised';

  const cardCount = entry.cards.length;
  const shownCards = entry.action === 'play' ? entry.cards.slice(0, MAX_CARDS_SHOWN) : [];
  const overflow = entry.action === 'play' && cardCount > MAX_CARDS_SHOWN ? cardCount - MAX_CARDS_SHOWN : 0;

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(13, 27, 42, 0.88)',
      borderBottomWidth: 0.5,
      borderBottomColor: THEME.gold,
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      zIndex: 10,
    }}>
      <Avatar
        avatarId={entry.playerAvatarId}
        size={32}
        colourHex={entry.playerColour}
      />

      <Text style={{ color: entry.playerColour, fontSize: 13, fontWeight: '500' }}>
        {entry.playerName}
      </Text>

      <Text style={{ color: THEME.textMuted, fontSize: 12 }}>
        {actionLabel}
      </Text>

      {/* Mini cards for play action */}
      {shownCards.map((card, i) => (
        <MiniCard key={`${card.rank}${card.suit}${i}`} card={card} />
      ))}

      {/* Overflow label */}
      {overflow > 0 && (
        <Text style={{ color: THEME.textSecondary, fontSize: 12, fontWeight: '600' }}>
          +{overflow} more
        </Text>
      )}

      {/* Card count for draw/penalty */}
      {entry.action !== 'play' && (
        <Text style={{ color: THEME.textPrimary, fontSize: 13, fontWeight: '500' }}>
          {cardCount} card{cardCount !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
}
