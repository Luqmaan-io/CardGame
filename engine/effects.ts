import { Card, GameState, Suit } from './types';
import { isBlackJack, isRedJack } from './types';

export function applyPowerCardEffect(
  card: Card,
  declaredSuit: Suit | null,
  state: GameState
): GameState {
  switch (card.rank) {
    case 'A':
      // Set active suit to declared suit (can be same as current)
      return {
        ...state,
        activeSuit: declaredSuit,
        phase: declaredSuit === null ? 'declare-suit' : state.phase,
      };

    case '2':
      return {
        ...state,
        pendingPickup: state.pendingPickup + 2,
        pendingPickupType: '2',
      };

    case '8':
      return {
        ...state,
        skipsRemaining: state.skipsRemaining + 1,
      };

    case 'J':
      if (isBlackJack(card)) {
        return {
          ...state,
          pendingPickup: state.pendingPickup + 7,
          pendingPickupType: 'jack',
        };
      }
      if (isRedJack(card)) {
        // Red Jack counters black Jack penalty — reset it
        return {
          ...state,
          pendingPickup: 0,
          pendingPickupType: null,
        };
      }
      return state;

    case 'Q':
      return {
        ...state,
        phase: 'cover',
      };

    case 'K': {
      const newDirection =
        state.direction === 'clockwise' ? 'anticlockwise' : 'clockwise';
      return {
        ...state,
        direction: newDirection,
      };
    }

    default:
      return state;
  }
}
