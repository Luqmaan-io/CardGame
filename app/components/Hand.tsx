import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Card } from './Card';
import type { Card as CardType } from '../../engine/types';

interface HandProps {
  cards: CardType[];
  validPlays: CardType[][];
  onCardSelect: (card: CardType) => void;
  selectedCards?: CardType[];
  faceDown?: boolean;
  isMyTurn?: boolean;
}

// Card dimensions
const CARD_WIDTH = 70;
const CARD_HEIGHT = 100;
// Max rotation at the outermost card (degrees)
const MAX_ROTATION = 20;
// Max vertical arc — edge cards rise this many px above the centre card
const ARC_HEIGHT = 16;
// How far a selected card lifts above its arc position
const SELECTED_LIFT = 20;
// Padding so lifted/rotated cards aren't clipped
const PAD_TOP = SELECTED_LIFT + 6;
const PAD_BOTTOM = 16;

const CONTAINER_HEIGHT = PAD_TOP + ARC_HEIGHT + CARD_HEIGHT + PAD_BOTTOM;

function isInValidPlay(card: CardType, validPlays: CardType[][]): boolean {
  return validPlays.some((combo) =>
    combo.some((c) => c.rank === card.rank && c.suit === card.suit)
  );
}

function isCardSelected(card: CardType, selectedCards: CardType[]): boolean {
  return selectedCards.some((c) => c.rank === card.rank && c.suit === card.suit);
}

export function Hand({
  cards,
  validPlays,
  onCardSelect,
  selectedCards = [],
  faceDown = false,
  isMyTurn = true,
}: HandProps) {
  const { width: screenWidth } = useWindowDimensions();
  const n = cards.length;

  // Maximum spacing = 65% of card width (~35% overlap).
  // Scale down so all cards fit in (screenWidth - 32px horizontal padding).
  const maxSpacing = CARD_WIDTH * 0.65;
  const spacing =
    n <= 1 ? 0 : Math.min(maxSpacing, (screenWidth - 32 - CARD_WIDTH) / (n - 1));

  const totalSpan = (n - 1) * spacing;
  // x of the leftmost card so the fan is centred on screen
  const startX = (screenWidth - CARD_WIDTH) / 2 - totalSpan / 2;

  return (
    <View style={[styles.container, { width: screenWidth, height: CONTAINER_HEIGHT }]}>
      {cards.map((card, index) => {
        // t ∈ [-1, 1]: -1 = leftmost, 0 = centre, 1 = rightmost
        const t = n === 1 ? 0 : (index / (n - 1)) * 2 - 1;

        const rotation = t * MAX_ROTATION;

        // Arc: centre card is lowest (PAD_TOP + ARC_HEIGHT), edge cards are highest (PAD_TOP)
        const arcY = PAD_TOP + ARC_HEIGHT * (1 - t * t);

        const selected = isCardSelected(card, selectedCards);
        const yPos = arcY - (selected ? SELECTED_LIFT : 0);
        const xPos = startX + index * spacing;

        const valid = !faceDown && isInValidPlay(card, validPlays);
        const disabled = !isMyTurn;

        return (
          <View
            key={`${card.rank}-${card.suit}-${index}`}
            style={[
              styles.cardWrapper,
              {
                left: xPos,
                top: yPos,
                zIndex: index,
                transform: [{ rotate: `${rotation}deg` }],
              },
            ]}
          >
            <Card
              card={card}
              faceDown={faceDown}
              isSelected={selected}
              isValid={valid}
              isDisabled={disabled}
              onPress={faceDown || disabled ? undefined : () => onCardSelect(card)}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  cardWrapper: {
    position: 'absolute',
  },
});
