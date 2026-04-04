import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card } from './Card';
import type { Card as CardType } from '../../engine/types';

interface HandProps {
  cards: CardType[];
  validPlays: CardType[][];
  onCardSelect: (card: CardType) => void;
  selectedCards?: CardType[];
  faceDown?: boolean;
}

function isInValidPlay(card: CardType, validPlays: CardType[][]): boolean {
  return validPlays.some((combo) =>
    combo.some((c) => c.rank === card.rank && c.suit === card.suit)
  );
}

function isSelected(card: CardType, selectedCards: CardType[]): boolean {
  return selectedCards.some((c) => c.rank === card.rank && c.suit === card.suit);
}

export function Hand({
  cards,
  validPlays,
  onCardSelect,
  selectedCards = [],
  faceDown = false,
}: HandProps) {
  // More cards = more overlap so the hand stays on screen
  const overlap = Math.max(12, 44 - cards.length * 2);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {cards.map((card, index) => (
        <View
          key={`${card.rank}-${card.suit}-${index}`}
          style={[
            styles.cardWrapper,
            index > 0 && { marginLeft: -overlap },
            { zIndex: index },
          ]}
        >
          <Card
            card={card}
            faceDown={faceDown}
            isSelected={isSelected(card, selectedCards)}
            isValid={!faceDown && isInValidPlay(card, validPlays)}
            onPress={faceDown ? undefined : () => onCardSelect(card)}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: 'flex-end',
  },
  cardWrapper: {
    // z-index set inline so later cards render on top
  },
});
