import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Hand } from './Hand';
import type { GameState, Card as CardType, Player } from '../../engine/types';

interface GameBoardProps {
  gameState: GameState;
  myPlayerId: string;
  validPlays: CardType[][];
  selectedCards: CardType[];
  onCardSelect: (card: CardType) => void;
  message?: string;
}

function OpponentArea({ player, label }: { player: Player; label: string }) {
  // Show up to 7 face-down cards to indicate hand size
  const displayCount = Math.min(player.hand.length, 7);
  const overlapSpacing = Math.max(8, 28 - displayCount * 2);

  return (
    <View style={styles.opponentArea}>
      <Text style={styles.playerLabel}>{label}</Text>
      <View style={styles.faceDownRow}>
        {Array.from({ length: displayCount }).map((_, i) => (
          <View
            key={i}
            style={[styles.faceDownSlot, i > 0 && { marginLeft: -overlapSpacing }]}
          >
            <Card card={player.hand[i] ?? { rank: 'A', suit: 'spades' }} faceDown />
          </View>
        ))}
        {player.hand.length === 0 && (
          <Text style={styles.emptyHand}>Empty</Text>
        )}
      </View>
      <Text style={styles.cardCount}>{player.hand.length} cards</Text>
    </View>
  );
}

export function GameBoard({
  gameState,
  myPlayerId,
  validPlays,
  selectedCards,
  onCardSelect,
  message,
}: GameBoardProps) {
  const { players, discard, deck } = gameState;

  const myPlayer = players.find((p) => p.id === myPlayerId);
  const opponents = players.filter((p) => p.id !== myPlayerId);
  const topDiscard = discard[discard.length - 1];

  return (
    <View style={styles.board}>
      {/* Opponents row at top */}
      <View style={styles.opponentsRow}>
        {opponents.map((opponent) => (
          <OpponentArea
            key={opponent.id}
            player={opponent}
            label={opponent.id.slice(0, 8)}
          />
        ))}
      </View>

      {/* Centre: draw pile, message, discard pile */}
      <View style={styles.centre}>
        <View style={styles.pile}>
          <Card card={{ rank: 'A', suit: 'spades' }} faceDown />
          <Text style={styles.pileCount}>{deck.length}</Text>
        </View>

        {message ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.pile}>
          {topDiscard ? (
            <Card card={topDiscard} />
          ) : (
            <View style={styles.emptyDiscard} />
          )}
          <Text style={styles.pileCount}>discard</Text>
        </View>
      </View>

      {/* Active suit indicator */}
      {gameState.activeSuit ? (
        <View style={styles.activeSuitBanner}>
          <Text style={styles.activeSuitText}>
            Active suit:{' '}
            {gameState.activeSuit === 'hearts'
              ? '♥'
              : gameState.activeSuit === 'diamonds'
              ? '♦'
              : gameState.activeSuit === 'clubs'
              ? '♣'
              : '♠'}{' '}
            {gameState.activeSuit}
          </Text>
        </View>
      ) : null}

      {/* My hand at bottom */}
      <View style={styles.myArea}>
        {myPlayer ? (
          <Hand
            cards={myPlayer.hand}
            validPlays={validPlays}
            selectedCards={selectedCards}
            onCardSelect={onCardSelect}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flex: 1,
    backgroundColor: '#1b5e20',
  },
  opponentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingTop: 8,
    minHeight: 130,
  },
  opponentArea: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 200,
  },
  playerLabel: {
    color: '#fff',
    fontSize: 11,
    marginBottom: 6,
    opacity: 0.8,
    fontWeight: '500',
  },
  faceDownRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  faceDownSlot: {
    zIndex: 1,
  },
  emptyHand: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  cardCount: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 6,
  },
  centre: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    paddingVertical: 8,
  },
  pile: {
    alignItems: 'center',
    gap: 6,
  },
  pileCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  emptyDiscard: {
    width: 56,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    borderStyle: 'dashed',
  },
  messageBox: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 160,
  },
  messageText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  activeSuitBanner: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  activeSuitText: {
    color: '#ffd54f',
    fontSize: 12,
    fontWeight: '600',
  },
  myArea: {
    minHeight: 162,
  },
});
