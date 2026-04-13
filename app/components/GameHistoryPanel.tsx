import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../utils/theme';
import type { Card as CardType } from '../../engine/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HistoryEntry = {
  playerId: string;
  playerName: string;
  playerColour: string;
  playerAvatarId: string;
  cards: CardType[];
  timestamp: number;
  action: 'play' | 'draw' | 'penalty';
};

// ─── Mini card ────────────────────────────────────────────────────────────────

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};
const RED_SUITS = new Set(['hearts', 'diamonds']);

function MiniCard({ card }: { card: CardType }) {
  const isRed = RED_SUITS.has(card.suit);
  const colour = isRed ? THEME.cardRed : THEME.cardBlack;
  return (
    <View style={styles.miniCard}>
      <Text style={[styles.miniRank, { color: colour }]}>{card.rank}</Text>
      <Text style={[styles.miniSuit, { color: colour }]}>{SUIT_SYMBOLS[card.suit]}</Text>
    </View>
  );
}

// ─── GameHistoryPanel ─────────────────────────────────────────────────────────

interface GameHistoryPanelProps {
  history: HistoryEntry[]; // last 3 entries, most recent first
}

const OPACITIES = [1, 0.6, 0.35];

export function GameHistoryPanel({ history }: GameHistoryPanelProps) {
  if (history.length === 0) return null;

  return (
    <View style={styles.panel}>
      {history.slice(0, 3).map((entry, idx) => {
        const opacity = OPACITIES[idx] ?? 0.35;
        return (
          <View key={entry.timestamp} style={[styles.entry, idx > 0 && styles.entryDivider, { opacity }]}>
            <View style={styles.entryHeader}>
              <View style={[styles.colourDot, { backgroundColor: entry.playerColour }]} />
              <Text style={styles.playerName} numberOfLines={1}>
                {entry.playerName}
              </Text>
              <Text style={styles.actionLabel}>
                {entry.action === 'play'
                  ? 'played'
                  : entry.action === 'draw'
                  ? `drew ${entry.cards.length}`
                  : `penalty ×${entry.cards.length}`}
              </Text>
            </View>

            {entry.action === 'play' && entry.cards.length > 0 && (
              <View style={styles.cardsRow}>
                {entry.cards.map((card, ci) => (
                  <View
                    key={`${card.rank}-${card.suit}`}
                    style={[styles.miniCardWrap, ci > 0 && { marginLeft: -8 }]}
                  >
                    <MiniCard card={card} />
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  panel: {
    width: 140,
    backgroundColor: 'rgba(13, 27, 42, 0.88)',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: THEME.gold,
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
    color: THEME.textPrimary,
    fontSize: 9,
    fontWeight: '700',
    flex: 1,
  },
  actionLabel: {
    color: THEME.textMuted,
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
    backgroundColor: THEME.cardFace,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: THEME.cardBorder,
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
