"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPowerCardEffect = applyPowerCardEffect;
const types_1 = require("./types");
function applyPowerCardEffect(card, declaredSuit, state) {
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
            if ((0, types_1.isBlackJack)(card)) {
                return {
                    ...state,
                    pendingPickup: state.pendingPickup + 7,
                    pendingPickupType: 'jack',
                };
            }
            if ((0, types_1.isRedJack)(card)) {
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
            const newDirection = state.direction === 'clockwise' ? 'anticlockwise' : 'clockwise';
            return {
                ...state,
                direction: newDirection,
            };
        }
        default:
            return state;
    }
}
