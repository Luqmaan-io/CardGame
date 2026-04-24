"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RED_JACKS = exports.BLACK_JACKS = exports.POWER_CARDS = void 0;
exports.isPowerCard = isPowerCard;
exports.isBlackJack = isBlackJack;
exports.isRedJack = isRedJack;
exports.POWER_CARDS = ['A', '2', '8', 'J', 'Q', 'K'];
exports.BLACK_JACKS = [
    { rank: 'J', suit: 'spades' },
    { rank: 'J', suit: 'clubs' },
];
exports.RED_JACKS = [
    { rank: 'J', suit: 'hearts' },
    { rank: 'J', suit: 'diamonds' },
];
function isPowerCard(card) {
    return exports.POWER_CARDS.includes(card.rank);
}
function isBlackJack(card) {
    return card.rank === 'J' && (card.suit === 'spades' || card.suit === 'clubs');
}
function isRedJack(card) {
    return card.rank === 'J' && (card.suit === 'hearts' || card.suit === 'diamonds');
}
