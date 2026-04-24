"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slideCard = slideCard;
exports.flipCard = flipCard;
exports.bounceSettle = bounceSettle;
exports.cascadeDelay = cascadeDelay;
exports.dealCard = dealCard;
exports.flashOpacity = flashOpacity;
exports.shakeX = shakeX;
exports.getGamePositions = getGamePositions;
const react_native_1 = require("react-native");
// ─── slideCard ────────────────────────────────────────────────────────────────
// Moves a card from one position to another.
function slideCard(animValue, from, to, duration) {
    animValue.setValue(from);
    return new Promise((resolve) => {
        react_native_1.Animated.timing(animValue, {
            toValue: to,
            duration,
            useNativeDriver: false,
        }).start(() => resolve());
    });
}
// ─── flipCard ─────────────────────────────────────────────────────────────────
// Scales X from 1→0 then 0→1. Caller swaps card face at midpoint.
function flipCard(animValue, duration) {
    animValue.setValue(1);
    return new Promise((resolve) => {
        react_native_1.Animated.sequence([
            react_native_1.Animated.timing(animValue, {
                toValue: 0,
                duration: duration / 2,
                useNativeDriver: false,
            }),
            react_native_1.Animated.timing(animValue, {
                toValue: 1,
                duration: duration / 2,
                useNativeDriver: false,
            }),
        ]).start(() => resolve());
    });
}
// ─── bounceSettle ─────────────────────────────────────────────────────────────
// Scale: 1 → 1.1 → 0.95 → 1.0 over 300ms. Used when a card lands.
function bounceSettle(animValue) {
    animValue.setValue(1);
    return new Promise((resolve) => {
        react_native_1.Animated.sequence([
            react_native_1.Animated.timing(animValue, {
                toValue: 1.1,
                duration: 80,
                useNativeDriver: false,
            }),
            react_native_1.Animated.timing(animValue, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: false,
            }),
            react_native_1.Animated.timing(animValue, {
                toValue: 1.0,
                duration: 120,
                useNativeDriver: false,
            }),
        ]).start(() => resolve());
    });
}
// ─── cascadeDelay ─────────────────────────────────────────────────────────────
// Returns stagger delay in ms for a card at a given index.
function cascadeDelay(index) {
    return index * 120;
}
// ─── dealCard ─────────────────────────────────────────────────────────────────
// Slides from deck position to player position, staggered by index.
function dealCard(animValue, deckPosition, playerPosition, index) {
    const delay = cascadeDelay(index);
    return new Promise((resolve) => {
        setTimeout(() => {
            slideCard(animValue, deckPosition, playerPosition, 320).then(resolve);
        }, delay);
    });
}
// ─── flashOpacity ─────────────────────────────────────────────────────────────
// Pulses opacity N times. Used for timeout flash, win glow.
function flashOpacity(animValue, fromOpacity, toOpacity, cycleDuration, cycles) {
    const sequence = [];
    for (let i = 0; i < cycles; i++) {
        sequence.push(react_native_1.Animated.timing(animValue, {
            toValue: toOpacity,
            duration: cycleDuration / 2,
            useNativeDriver: false,
        }), react_native_1.Animated.timing(animValue, {
            toValue: fromOpacity,
            duration: cycleDuration / 2,
            useNativeDriver: false,
        }));
    }
    return new Promise((resolve) => {
        react_native_1.Animated.sequence(sequence).start(() => resolve());
    });
}
// ─── shakeX ───────────────────────────────────────────────────────────────────
// Brief left-right shake. Used on deck reshuffle.
function shakeX(animValue) {
    animValue.setValue(0);
    return new Promise((resolve) => {
        react_native_1.Animated.sequence([
            react_native_1.Animated.timing(animValue, { toValue: -6, duration: 50, useNativeDriver: false }),
            react_native_1.Animated.timing(animValue, { toValue: 6, duration: 50, useNativeDriver: false }),
            react_native_1.Animated.timing(animValue, { toValue: -4, duration: 40, useNativeDriver: false }),
            react_native_1.Animated.timing(animValue, { toValue: 4, duration: 40, useNativeDriver: false }),
            react_native_1.Animated.timing(animValue, { toValue: 0, duration: 40, useNativeDriver: false }),
        ]).start(() => resolve());
    });
}
function getGamePositions(screenWidth, screenHeight) {
    return {
        // Centre-left of the table area (approximately 40% down the screen)
        deck: { x: screenWidth * 0.28 - 35, y: screenHeight * 0.38 - 50 },
        // Centre-right of the table area
        discard: { x: screenWidth * 0.62 - 35, y: screenHeight * 0.38 - 50 },
        // Bottom hand area centre
        myHand: { x: screenWidth / 2 - 35, y: screenHeight * 0.72 - 50 },
        // Opponent slots distributed across the top
        opponent(index, total) {
            let xFraction;
            if (total === 1) {
                xFraction = 0.5;
            }
            else if (total === 2) {
                xFraction = index === 0 ? 0.25 : 0.75;
            }
            else {
                xFraction = 0.17 + index * 0.33;
            }
            return { x: screenWidth * xFraction - 35, y: screenHeight * 0.07 };
        },
    };
}
//# sourceMappingURL=animations.js.map