"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeck = createDeck;
exports.shuffleDeck = shuffleDeck;
exports.dealCards = dealCards;
exports.reshuffleDiscard = reshuffleDiscard;
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ rank, suit });
        }
    }
    return deck;
}
function shuffleDeck(deck) {
    const result = [...deck];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = result[i];
        result[i] = result[j];
        result[j] = temp;
    }
    return result;
}
function dealCards(deck, playerCount, cardsEach) {
    const totalNeeded = playerCount * cardsEach;
    if (deck.length < totalNeeded) {
        throw new Error(`Not enough cards to deal. Need ${totalNeeded}, have ${deck.length}.`);
    }
    const hands = Array.from({ length: playerCount }, () => []);
    const remaining = [...deck];
    for (let i = 0; i < cardsEach; i++) {
        for (let p = 0; p < playerCount; p++) {
            const card = remaining.shift();
            if (card !== undefined) {
                hands[p].push(card);
            }
        }
    }
    return { hands, remaining };
}
function reshuffleDiscard(state) {
    if (state.discard.length <= 1) {
        // Nothing to reshuffle — keep as-is
        return state;
    }
    const topCard = state.discard[state.discard.length - 1];
    const cardsToShuffle = state.discard.slice(0, state.discard.length - 1);
    const newDeck = shuffleDeck(cardsToShuffle);
    return {
        ...state,
        deck: [...state.deck, ...newDeck],
        discard: [topCard],
    };
}
