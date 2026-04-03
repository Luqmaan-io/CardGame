import { isPowerCard, isBlackJack, isRedJack, POWER_CARDS, BLACK_JACKS, RED_JACKS } from '../types';
import { Card } from '../types';

describe('isPowerCard', () => {
  it('returns true for power card ranks', () => {
    for (const rank of POWER_CARDS) {
      expect(isPowerCard({ rank, suit: 'hearts' })).toBe(true);
    }
  });

  it('returns false for non-power card ranks', () => {
    const nonPower = ['3', '4', '5', '6', '7', '9', '10'] as const;
    for (const rank of nonPower) {
      expect(isPowerCard({ rank, suit: 'clubs' })).toBe(false);
    }
  });
});

describe('isBlackJack', () => {
  it('identifies J♠ and J♣ as black jacks', () => {
    expect(isBlackJack({ rank: 'J', suit: 'spades' })).toBe(true);
    expect(isBlackJack({ rank: 'J', suit: 'clubs' })).toBe(true);
  });

  it('does not identify red jacks as black jacks', () => {
    expect(isBlackJack({ rank: 'J', suit: 'hearts' })).toBe(false);
    expect(isBlackJack({ rank: 'J', suit: 'diamonds' })).toBe(false);
  });

  it('BLACK_JACKS constant matches', () => {
    for (const card of BLACK_JACKS) {
      expect(isBlackJack(card)).toBe(true);
    }
  });
});

describe('isRedJack', () => {
  it('identifies J♥ and J♦ as red jacks', () => {
    expect(isRedJack({ rank: 'J', suit: 'hearts' })).toBe(true);
    expect(isRedJack({ rank: 'J', suit: 'diamonds' })).toBe(true);
  });

  it('does not identify black jacks as red jacks', () => {
    expect(isRedJack({ rank: 'J', suit: 'spades' })).toBe(false);
    expect(isRedJack({ rank: 'J', suit: 'clubs' })).toBe(false);
  });

  it('RED_JACKS constant matches', () => {
    for (const card of RED_JACKS) {
      expect(isRedJack(card)).toBe(true);
    }
  });
});
