import { Card, GameState } from './types';
/**
 * Returns all valid single cards and valid combos the current player could play.
 * Combos are returned as Card[][] (each inner array is one playable set).
 */
export declare function getValidPlays(state: GameState): Card[][];
/**
 * Simple heuristic AI:
 * - Prefer longest valid combo
 * - Among equal-length combos, prefer power cards
 * - Draw if no valid play
 */
export declare function pickAIMove(state: GameState): Card[] | 'draw';
//# sourceMappingURL=ai.d.ts.map