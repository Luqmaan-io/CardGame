"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
describe('isPowerCard', () => {
    it('returns true for power card ranks', () => {
        for (const rank of types_1.POWER_CARDS) {
            expect((0, types_1.isPowerCard)({ rank, suit: 'hearts' })).toBe(true);
        }
    });
    it('returns false for non-power card ranks', () => {
        const nonPower = ['3', '4', '5', '6', '7', '9', '10'];
        for (const rank of nonPower) {
            expect((0, types_1.isPowerCard)({ rank, suit: 'clubs' })).toBe(false);
        }
    });
});
describe('isBlackJack', () => {
    it('identifies J♠ and J♣ as black jacks', () => {
        expect((0, types_1.isBlackJack)({ rank: 'J', suit: 'spades' })).toBe(true);
        expect((0, types_1.isBlackJack)({ rank: 'J', suit: 'clubs' })).toBe(true);
    });
    it('does not identify red jacks as black jacks', () => {
        expect((0, types_1.isBlackJack)({ rank: 'J', suit: 'hearts' })).toBe(false);
        expect((0, types_1.isBlackJack)({ rank: 'J', suit: 'diamonds' })).toBe(false);
    });
    it('BLACK_JACKS constant matches', () => {
        for (const card of types_1.BLACK_JACKS) {
            expect((0, types_1.isBlackJack)(card)).toBe(true);
        }
    });
});
describe('isRedJack', () => {
    it('identifies J♥ and J♦ as red jacks', () => {
        expect((0, types_1.isRedJack)({ rank: 'J', suit: 'hearts' })).toBe(true);
        expect((0, types_1.isRedJack)({ rank: 'J', suit: 'diamonds' })).toBe(true);
    });
    it('does not identify black jacks as red jacks', () => {
        expect((0, types_1.isRedJack)({ rank: 'J', suit: 'spades' })).toBe(false);
        expect((0, types_1.isRedJack)({ rank: 'J', suit: 'clubs' })).toBe(false);
    });
    it('RED_JACKS constant matches', () => {
        for (const card of types_1.RED_JACKS) {
            expect((0, types_1.isRedJack)(card)).toBe(true);
        }
    });
});
