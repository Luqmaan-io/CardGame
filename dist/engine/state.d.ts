import { Card, GameState, Suit } from './types';
export declare function getNextPlayerIndex(state: GameState): number;
export declare function checkWinCondition(playerId: string, state: GameState): boolean;
/**
 * Called after a player empties their hand (non-power card finish).
 * Records their placement, removes them from active players, and either
 * ends the game (≤1 player remaining) or continues play.
 */
export declare function checkPlayerFinished(playerId: string, state: GameState): GameState;
/**
 * Advance the turn to the next player.
 * Resets skipsRemaining, sets phase to 'play', clears currentPlayerHasActed,
 * and clears onCardsDeclarations for the incoming player.
 */
export declare function advanceTurn(state: GameState): GameState;
/**
 * Draw `count` cards for the current player.
 * Does NOT advance the turn — call advanceTurn() after this.
 * Sets currentPlayerHasActed: true.
 */
export declare function drawCard(count: number, state: GameState): GameState;
/**
 * When a combo contains multiple DIFFERENT power card types, only the last
 * power card's effect applies. Same-type stacking (two 2s, two Kings, etc.)
 * is unaffected — this only resolves conflicts between different types.
 */
export declare function resolveConflictingEffects(state: GameState, playedCards: Card[]): GameState;
/**
 * Apply a valid combo play for the current player.
 * Does NOT advance the turn — call advanceTurn() after this.
 * Sets currentPlayerHasActed: true.
 * Immediately returns game-over state when the win condition is met.
 */
export declare function applyPlay(cards: Card[], declaredSuit: Suit | null, state: GameState): GameState;
/**
 * Called when a player's turn timer expires.
 * Strike 1–2: auto-draw one card, advance turn immediately (no declaration window).
 * Strike 3: kick the player, shuffle their hand into the deck, advance turn.
 * If only one player remains after kick, that player wins immediately.
 */
export declare function applyTimeout(state: GameState): GameState;
/**
 * Resets the consecutive timeout strike for playerId to 0.
 * Called after any successful valid move.
 */
export declare function applyMoveSuccess(playerId: string, state: GameState): GameState;
/**
 * Declare "I'm on cards" for the current player.
 * Requires: it is currently this player's turn AND currentPlayerHasActed === true.
 * Validates whether the player can actually win next turn via canWinNextTurn.
 * If valid: adds playerId to onCardsDeclarations, returns { newState, isValid: true }.
 * If invalid: draws 2 cards as penalty (without advancing turn), returns { newState, isValid: false }.
 * Does NOT advance the turn — call advanceTurn() after this.
 */
export declare function declareOnCards(playerId: string, state: GameState): {
    newState: GameState;
    isValid: boolean;
};
/**
 * Removes playerId from onCardsDeclarations.
 * Called at the start of that player's next turn (internally by advanceTurn).
 */
export declare function clearOnCardsDeclaration(playerId: string, state: GameState): GameState;
/**
 * Increments sessionScores[playerId] by 1.
 * Called when a winner is determined.
 */
export declare function awardWin(playerId: string, state: GameState): GameState;
//# sourceMappingURL=state.d.ts.map