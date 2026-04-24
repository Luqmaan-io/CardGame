"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hand = Hand;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const Card_1 = require("./Card");
// ─── Constants ────────────────────────────────────────────────────────────────
const CARD_W = 88;
const CARD_H = 124;
const MAX_ROTATION = 20;
const ARC_HEIGHT = 16;
const SELECTED_LIFT = 20;
const DRAG_LIFT = 15;
const DRAG_DELAY_MS = 200;
const PAD_TOP = SELECTED_LIFT + DRAG_LIFT + 8;
const PAD_BOTTOM = 16;
const CONTAINER_HEIGHT = PAD_TOP + ARC_HEIGHT + CARD_H + PAD_BOTTOM;
// ─── Layout helpers ───────────────────────────────────────────────────────────
function computeLayout(n, screenWidth) {
    const maxSpacing = CARD_W * 0.65;
    const spacing = n <= 1 ? 0 : Math.min(maxSpacing, (screenWidth - 32 - CARD_W) / (n - 1));
    const totalSpan = (n - 1) * spacing;
    const startX = (screenWidth - CARD_W) / 2 - totalSpan / 2;
    return { spacing, startX };
}
function getT(index, n) {
    return n <= 1 ? 0 : (index / (n - 1)) * 2 - 1;
}
function getArcY(index, n) {
    const t = getT(index, n);
    return PAD_TOP + ARC_HEIGHT * (1 - t * t);
}
function getRotation(index, n) {
    return getT(index, n) * MAX_ROTATION;
}
// ─── Shift computation ────────────────────────────────────────────────────────
function targetShift(cardIdx, dragIdx, hoverIdx, spacing) {
    const r = cardIdx > dragIdx ? cardIdx - 1 : cardIdx;
    const finalPos = r >= hoverIdx ? r + 1 : r;
    return (finalPos - cardIdx) * spacing;
}
// ─── Hit-test helpers ─────────────────────────────────────────────────────────
function cardAtLocalX(localX, n, startX, spacing) {
    for (let i = n - 1; i >= 0; i--) {
        const x = startX + i * spacing;
        if (localX >= x && localX <= x + CARD_W)
            return i;
    }
    if (localX < startX)
        return 0;
    return Math.max(0, n - 1);
}
function localXToHoverIdx(localX, n, startX, spacing) {
    if (spacing === 0 || n <= 1)
        return 0;
    const raw = Math.round((localX - startX - CARD_W / 2) / spacing);
    return Math.max(0, Math.min(n - 1, raw));
}
// ─── Component ────────────────────────────────────────────────────────────────
function Hand({ cards, validPlays, onCardSelect, onClearSelection, selectedCards = [], faceDown = false, isMyTurn = true, visibleCardCount, }) {
    const { width: screenWidth } = (0, react_native_1.useWindowDimensions)();
    // ── Deal mode vs normal mode ──────────────────────────────────────────────
    // dealMode: visibleCardCount is defined — slice cards and disable drag
    const isDealMode = visibleCardCount !== undefined;
    // ── Local card order (user can reorder; persists cosmetically) ───────────
    const [localCards, setLocalCards] = (0, react_1.useState)(cards);
    (0, react_1.useEffect)(() => {
        setLocalCards((prev) => {
            const kept = prev.filter((c) => cards.some((nc) => nc.rank === c.rank && nc.suit === c.suit));
            const added = cards.filter((nc) => !prev.some((c) => c.rank === nc.rank && c.suit === nc.suit));
            return [...kept, ...added];
        });
    }, [cards]);
    // In deal mode use the sliced array; in normal mode use localCards.
    const renderCards = isDealMode
        ? cards.slice(0, visibleCardCount)
        : localCards;
    // ── Slide-in animation for newly dealt cards ───────────────────────────────
    // Tracks the index of the most recently revealed card so we can animate it.
    const [newCardIdx, setNewCardIdx] = (0, react_1.useState)(null);
    const prevVisibleCountRef = (0, react_1.useRef)(0);
    // One animated value reused for each new card that arrives.
    const newCardSlideAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    (0, react_1.useEffect)(() => {
        if (!isDealMode) {
            prevVisibleCountRef.current = 0;
            return;
        }
        const count = visibleCardCount ?? 0;
        if (count > prevVisibleCountRef.current) {
            const idx = count - 1;
            setNewCardIdx(idx);
            newCardSlideAnim.setValue(50);
            react_native_1.Animated.timing(newCardSlideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
                easing: react_native_1.Easing.out(react_native_1.Easing.quad),
            }).start(() => setNewCardIdx(null));
        }
        prevVisibleCountRef.current = count;
    }, [visibleCardCount, isDealMode]);
    // ── Drag visual state ─────────────────────────────────────────────────────
    const [draggingIdx, setDraggingIdx] = (0, react_1.useState)(null);
    const dragCardX = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const dragCardY = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const dragScale = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    const shiftAnims = (0, react_1.useRef)([]);
    // Grow shift anims array to cover all currently-rendered cards
    while (shiftAnims.current.length < renderCards.length) {
        shiftAnims.current.push(new react_native_1.Animated.Value(0));
    }
    // ── Stable refs ────────────────────────────────────────────────────────────
    const localCardsRef = (0, react_1.useRef)(renderCards);
    localCardsRef.current = renderCards;
    const screenWidthRef = (0, react_1.useRef)(screenWidth);
    screenWidthRef.current = screenWidth;
    const isMyTurnRef = (0, react_1.useRef)(isMyTurn);
    isMyTurnRef.current = isMyTurn;
    const faceDownRef = (0, react_1.useRef)(faceDown);
    faceDownRef.current = faceDown;
    const onCardSelectRef = (0, react_1.useRef)(onCardSelect);
    onCardSelectRef.current = onCardSelect;
    const onClearSelectionRef = (0, react_1.useRef)(onClearSelection);
    onClearSelectionRef.current = onClearSelection;
    const selectedCardsRef = (0, react_1.useRef)(selectedCards);
    selectedCardsRef.current = selectedCards;
    const isDealModeRef = (0, react_1.useRef)(isDealMode);
    isDealModeRef.current = isDealMode;
    const containerPageXRef = (0, react_1.useRef)(0);
    const hoverIdxRef = (0, react_1.useRef)(null);
    const dragStateRef = (0, react_1.useRef)(null);
    // ── Pan handler functions ──────────────────────────────────────────────────
    const panHandlersRef = (0, react_1.useRef)({
        onGrant: (_gs) => { },
        onMove: (_gs) => { },
        onRelease: (_gestureState) => { },
        onTerminate: () => { },
    });
    function doAnimateShifts(dragIdx, hoverI, spacing) {
        const n = localCardsRef.current.length;
        for (let i = 0; i < n; i++) {
            if (i === dragIdx)
                continue;
            const anim = shiftAnims.current[i];
            if (!anim)
                continue;
            react_native_1.Animated.spring(anim, {
                toValue: targetShift(i, dragIdx, hoverI, spacing),
                useNativeDriver: false,
                speed: 25,
                bounciness: 0,
            }).start();
        }
    }
    function doResetShifts() {
        shiftAnims.current.forEach((anim) => {
            react_native_1.Animated.spring(anim, {
                toValue: 0,
                useNativeDriver: false,
                speed: 25,
                bounciness: 0,
            }).start();
        });
    }
    panHandlersRef.current = {
        onGrant(gestureState) {
            // Block all interaction during deal
            if (isDealModeRef.current)
                return;
            const n = localCardsRef.current.length;
            if (n <= 1 || faceDownRef.current)
                return;
            const { spacing, startX } = computeLayout(n, screenWidthRef.current);
            const localX = gestureState.x0 - containerPageXRef.current;
            const touchedIdx = cardAtLocalX(localX, n, startX, spacing);
            dragStateRef.current = {
                cardIndex: touchedIdx,
                pressTime: Date.now(),
                isDragging: false,
                origCardX: startX + touchedIdx * spacing,
                origCardY: getArcY(touchedIdx, n),
            };
        },
        onMove(gestureState) {
            if (isDealModeRef.current)
                return;
            const ds = dragStateRef.current;
            if (!ds)
                return;
            if (!ds.isDragging) {
                if (Date.now() - ds.pressTime < DRAG_DELAY_MS)
                    return;
                ds.isDragging = true;
                if (selectedCardsRef.current.length > 0) {
                    onClearSelectionRef.current?.();
                }
                dragCardX.setValue(ds.origCardX + gestureState.dx);
                dragCardY.setValue(ds.origCardY + gestureState.dy - DRAG_LIFT);
                react_native_1.Animated.spring(dragScale, {
                    toValue: 1.1,
                    useNativeDriver: false,
                    speed: 30,
                    bounciness: 2,
                }).start();
                setDraggingIdx(ds.cardIndex);
                const { spacing, startX } = computeLayout(localCardsRef.current.length, screenWidthRef.current);
                const localX = gestureState.moveX - containerPageXRef.current;
                const newHover = localXToHoverIdx(localX, localCardsRef.current.length, startX, spacing);
                hoverIdxRef.current = newHover;
                doAnimateShifts(ds.cardIndex, newHover, spacing);
                return;
            }
            dragCardX.setValue(ds.origCardX + gestureState.dx);
            dragCardY.setValue(ds.origCardY + gestureState.dy - DRAG_LIFT);
            const { spacing, startX } = computeLayout(localCardsRef.current.length, screenWidthRef.current);
            const localX = gestureState.moveX - containerPageXRef.current;
            const newHover = localXToHoverIdx(localX, localCardsRef.current.length, startX, spacing);
            if (newHover !== hoverIdxRef.current) {
                hoverIdxRef.current = newHover;
                doAnimateShifts(ds.cardIndex, newHover, spacing);
            }
        },
        onRelease(gestureState) {
            if (isDealModeRef.current)
                return;
            const ds = dragStateRef.current;
            dragStateRef.current = null;
            if (!ds)
                return;
            if (!ds.isDragging) {
                const elapsed = Date.now() - ds.pressTime;
                if (elapsed < 500 &&
                    !faceDownRef.current &&
                    isMyTurnRef.current &&
                    onCardSelectRef.current) {
                    const card = localCardsRef.current[ds.cardIndex];
                    if (card)
                        onCardSelectRef.current(card);
                }
                return;
            }
            // Recalculate drop index from moveX at the moment of release
            // (more reliable than hoverIdxRef which may lag on quick lifts)
            const fromIdx = ds.cardIndex;
            const n = localCardsRef.current.length;
            const { spacing, startX } = computeLayout(n, screenWidthRef.current);
            const releaseLocalX = gestureState.moveX - containerPageXRef.current;
            const calculatedIdx = localXToHoverIdx(releaseLocalX, n, startX, spacing);
            const toIdx = calculatedIdx;
            const next = [...localCardsRef.current];
            const [removed] = next.splice(fromIdx, 1);
            if (removed !== undefined)
                next.splice(toIdx, 0, removed);
            // Reset drag animation values immediately before re-rendering
            dragCardX.setValue(0);
            dragCardY.setValue(0);
            doResetShifts();
            react_native_1.Animated.spring(dragScale, { toValue: 1, useNativeDriver: false, speed: 30 }).start();
            hoverIdxRef.current = null;
            setDraggingIdx(null);
            setLocalCards(next);
        },
        onTerminate() {
            dragStateRef.current = null;
            // Reset all animation values instantly so the card never stays hovering
            dragCardX.setValue(0);
            dragCardY.setValue(0);
            dragScale.setValue(1);
            shiftAnims.current.forEach((a) => a.setValue(0));
            hoverIdxRef.current = null;
            setDraggingIdx(null);
        },
    };
    const panResponder = (0, react_1.useRef)(react_native_1.PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (_, gs) => panHandlersRef.current.onGrant(gs),
        onPanResponderMove: (_, gs) => panHandlersRef.current.onMove(gs),
        onPanResponderRelease: (_, gs) => panHandlersRef.current.onRelease(gs),
        onPanResponderTerminate: () => panHandlersRef.current.onTerminate(),
    })).current;
    const containerRef = (0, react_1.useRef)(null);
    // ── Render ─────────────────────────────────────────────────────────────────
    const n = renderCards.length;
    const { spacing, startX } = computeLayout(n, screenWidth);
    function inValidPlay(card) {
        return validPlays.some((combo) => combo.some((c) => c.rank === card.rank && c.suit === card.suit));
    }
    function isSelected(card) {
        return selectedCards.some((c) => c.rank === card.rank && c.suit === card.suit);
    }
    const draggingCard = draggingIdx !== null ? renderCards[draggingIdx] : null;
    return (<react_native_1.View ref={containerRef} style={[styles.container, { width: screenWidth, height: CONTAINER_HEIGHT }]} onLayout={() => {
            containerRef.current?.measure((_, __, ___, ____, pageX) => {
                containerPageXRef.current = pageX;
            });
        }} {...panResponder.panHandlers}>
      {renderCards.map((card, index) => {
            const isDragging = index === draggingIdx;
            const rot = getRotation(index, n);
            const yPos = getArcY(index, n) - (!isDragging && isSelected(card) ? SELECTED_LIFT : 0);
            const xPos = startX + index * spacing;
            const shiftAnim = shiftAnims.current[index] ?? new react_native_1.Animated.Value(0);
            // Apply slide-in translateX for the most recently dealt card
            const isNewCard = index === newCardIdx;
            if (isDragging) {
                return (<react_native_1.View key={`${card.rank}-${card.suit}-${index}`} style={[
                        styles.wrapper,
                        {
                            left: xPos,
                            top: yPos,
                            zIndex: index,
                            opacity: 0.25,
                            transform: [{ rotate: `${rot}deg` }],
                        },
                    ]}>
              <Card_1.Card card={card} faceDown={faceDown} isDisabled/>
            </react_native_1.View>);
            }
            return (<react_native_1.Animated.View key={`${card.rank}-${card.suit}-${index}`} style={[
                    styles.wrapper,
                    {
                        left: xPos,
                        top: yPos,
                        zIndex: index,
                        transform: [
                            { translateX: isNewCard ? newCardSlideAnim : shiftAnim },
                            { rotate: `${rot}deg` },
                        ],
                    },
                ]}>
            <Card_1.Card card={card} faceDown={faceDown} isSelected={isSelected(card)} isValid={!faceDown && inValidPlay(card) && !isDealMode} isDisabled={!isMyTurn || isDealMode}/>
          </react_native_1.Animated.View>);
        })}

      {/* Dragged card — floats above all other cards */}
      {draggingCard && (<react_native_1.Animated.View style={[
                styles.wrapper,
                styles.dragging,
                {
                    left: dragCardX,
                    top: dragCardY,
                    zIndex: 999,
                    transform: [{ scale: dragScale }],
                },
            ]}>
          <Card_1.Card card={draggingCard} faceDown={faceDown} isDisabled={false}/>
        </react_native_1.Animated.View>)}
    </react_native_1.View>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        position: 'relative',
    },
    wrapper: {
        position: 'absolute',
    },
    dragging: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 12,
    },
});
//# sourceMappingURL=Hand.js.map