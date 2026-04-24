"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidPlays = getValidPlays;
exports.pickAIMove = pickAIMove;
const types_1 = require("./types");
const validation_1 = require("./validation");
/**
 * Returns all valid single cards and valid combos the current player could play.
 * Combos are returned as Card[][] (each inner array is one playable set).
 */
function getValidPlays(state) {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer)
        return [];
    const hand = currentPlayer.hand;
    const validPlays = [];
    // Single-card plays
    for (const card of hand) {
        if ((0, validation_1.isValidPlay)(card, state)) {
            validPlays.push([card]);
        }
    }
    // Multi-card combos (brute-force up to hand size)
    // Build combos by extending valid single plays
    const comboCandidates = buildCombos(hand, state);
    for (const combo of comboCandidates) {
        if (combo.length > 1 && (0, validation_1.isValidCombo)(combo, state)) {
            // Avoid duplicates of single-card entries
            validPlays.push(combo);
        }
    }
    return validPlays;
}
/**
 * Simple heuristic AI:
 * - Prefer longest valid combo
 * - Among equal-length combos, prefer power cards
 * - Draw if no valid play
 */
function pickAIMove(state) {
    const plays = getValidPlays(state);
    if (plays.length === 0)
        return 'draw';
    // Sort by combo length descending, then prefer power card endings
    const sorted = plays.slice().sort((a, b) => {
        if (b.length !== a.length)
            return b.length - a.length;
        const aLast = a[a.length - 1];
        const bLast = b[b.length - 1];
        const aPower = (0, types_1.isPowerCard)(aLast) ? 1 : 0;
        const bPower = (0, types_1.isPowerCard)(bLast) ? 1 : 0;
        return bPower - aPower;
    });
    return sorted[0];
}
/**
 * Builds candidate combos from a hand by extending starting cards.
 * Uses DFS up to hand size. Only returns combos of length >= 2.
 */
function buildCombos(hand, state) {
    const results = [];
    function dfs(current, remaining) {
        if (current.length >= 2) {
            results.push([...current]);
        }
        for (let i = 0; i < remaining.length; i++) {
            const candidate = [...current, remaining[i]];
            if ((0, validation_1.isValidCombo)(candidate, state)) {
                const next = remaining.filter((_, idx) => idx !== i);
                dfs(candidate, next);
            }
        }
    }
    // Start from each card that is valid as a first play
    for (let i = 0; i < hand.length; i++) {
        if ((0, validation_1.isValidPlay)(hand[i], state)) {
            const remaining = hand.filter((_, idx) => idx !== i);
            dfs([hand[i]], remaining);
        }
    }
    return results;
}
