import { Card, GameState } from './types';
export declare function isValidPlay(card: Card, state: GameState): boolean;
/**
 * Returns true if the player's hand contains a combo that empties it entirely
 * and ends on a non-power card. The current top discard card is deliberately
 * ignored — by the time it is this player's next turn, other players will have
 * played and the top card will be different.
 *
 * Queen rule: each Queen in the combo must be immediately followed by a card
 * of the same suit OR another Queen.
 */
export declare function canWinNextTurn(playerId: string, state: GameState): boolean;
export declare function isValidCombo(cards: Card[], state: GameState): boolean;
//# sourceMappingURL=validation.d.ts.map