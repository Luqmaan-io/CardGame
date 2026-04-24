import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  PanResponderGestureState,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Card } from './Card';
import type { Card as CardType } from '../../engine/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_W = 88;
const CARD_H = 124;
const MAX_ROTATION = 20;
const ARC_HEIGHT = 16;
const SELECTED_LIFT = 20;
const DRAG_LIFT = 15;
const DRAG_DELAY_MS = 120;
const PAD_TOP = SELECTED_LIFT + DRAG_LIFT + 8;
const PAD_BOTTOM = 16;
const CONTAINER_HEIGHT = PAD_TOP + ARC_HEIGHT + CARD_H + PAD_BOTTOM;

// ─── Layout helpers ───────────────────────────────────────────────────────────

function computeLayout(n: number, screenWidth: number): { spacing: number; startX: number } {
  const maxSpacing = CARD_W * 0.65;
  const spacing =
    n <= 1 ? 0 : Math.min(maxSpacing, (screenWidth - 32 - CARD_W) / (n - 1));
  const totalSpan = (n - 1) * spacing;
  const startX = (screenWidth - CARD_W) / 2 - totalSpan / 2;
  return { spacing, startX };
}

function getT(index: number, n: number): number {
  return n <= 1 ? 0 : (index / (n - 1)) * 2 - 1;
}

function getArcY(index: number, n: number): number {
  const t = getT(index, n);
  return PAD_TOP + ARC_HEIGHT * (1 - t * t);
}

function getRotation(index: number, n: number): number {
  return getT(index, n) * MAX_ROTATION;
}

// ─── Shift computation ────────────────────────────────────────────────────────

function targetShift(
  cardIdx: number,
  dragIdx: number,
  hoverIdx: number,
  spacing: number
): number {
  const r = cardIdx > dragIdx ? cardIdx - 1 : cardIdx;
  const finalPos = r >= hoverIdx ? r + 1 : r;
  return (finalPos - cardIdx) * spacing;
}

// ─── Hit-test helpers ─────────────────────────────────────────────────────────

function cardAtLocalX(
  localX: number,
  n: number,
  startX: number,
  spacing: number
): number {
  for (let i = n - 1; i >= 0; i--) {
    const x = startX + i * spacing;
    if (localX >= x && localX <= x + CARD_W) return i;
  }
  if (localX < startX) return 0;
  return Math.max(0, n - 1);
}

function localXToHoverIdx(
  localX: number,
  n: number,
  startX: number,
  spacing: number
): number {
  if (spacing === 0 || n <= 1) return 0;
  const raw = Math.round((localX - startX - CARD_W / 2) / spacing);
  return Math.max(0, Math.min(n - 1, raw));
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HandProps {
  cards: CardType[];
  validPlays: CardType[][];
  onCardSelect?: (card: CardType) => void;
  onClearSelection?: () => void;
  selectedCards?: CardType[];
  faceDown?: boolean;
  isMyTurn?: boolean;
  // When provided, only render the first visibleCardCount cards.
  // Used during the deal animation to reveal cards one by one.
  visibleCardCount?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Hand({
  cards,
  validPlays,
  onCardSelect,
  onClearSelection,
  selectedCards = [],
  faceDown = false,
  isMyTurn = true,
  visibleCardCount,
}: HandProps) {
  const { width: screenWidth } = useWindowDimensions();

  // ── Deal mode vs normal mode ──────────────────────────────────────────────
  // dealMode: visibleCardCount is defined — slice cards and disable drag
  const isDealMode = visibleCardCount !== undefined;

  // ── Local card order (user can reorder; persists cosmetically) ───────────
  const [localCards, setLocalCards] = useState<CardType[]>(cards);

  useEffect(() => {
    setLocalCards((prev) => {
      const kept = prev.filter((c) =>
        cards.some((nc) => nc.rank === c.rank && nc.suit === c.suit)
      );
      const added = cards.filter(
        (nc) => !prev.some((c) => c.rank === nc.rank && c.suit === nc.suit)
      );
      return [...kept, ...added];
    });
  }, [cards]);

  // In deal mode use the sliced array; in normal mode use localCards.
  const renderCards = isDealMode
    ? cards.slice(0, visibleCardCount)
    : localCards;

  // ── Slide-in animation for newly dealt cards ───────────────────────────────
  // Tracks the index of the most recently revealed card so we can animate it.
  const [newCardIdx, setNewCardIdx] = useState<number | null>(null);
  const prevVisibleCountRef = useRef(0);
  // One animated value reused for each new card that arrives.
  const newCardSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isDealMode) {
      prevVisibleCountRef.current = 0;
      return;
    }
    const count = visibleCardCount ?? 0;
    if (count > prevVisibleCountRef.current) {
      const idx = count - 1;
      setNewCardIdx(idx);
      newCardSlideAnim.setValue(50);
      Animated.timing(newCardSlideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
        easing: Easing.out(Easing.quad),
      }).start(() => setNewCardIdx(null));
    }
    prevVisibleCountRef.current = count;
  }, [visibleCardCount, isDealMode]);

  // ── Drag visual state ─────────────────────────────────────────────────────
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const dragCardX = useRef(new Animated.Value(0)).current;
  const dragCardY = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;

  const shiftAnims = useRef<Animated.Value[]>([]);
  // Grow shift anims array to cover all currently-rendered cards
  while (shiftAnims.current.length < renderCards.length) {
    shiftAnims.current.push(new Animated.Value(0));
  }

  // ── Stable refs ────────────────────────────────────────────────────────────
  const localCardsRef = useRef(renderCards);
  localCardsRef.current = renderCards;
  const screenWidthRef = useRef(screenWidth);
  screenWidthRef.current = screenWidth;
  const isMyTurnRef = useRef(isMyTurn);
  isMyTurnRef.current = isMyTurn;
  const faceDownRef = useRef(faceDown);
  faceDownRef.current = faceDown;
  const onCardSelectRef = useRef(onCardSelect);
  onCardSelectRef.current = onCardSelect;
  const onClearSelectionRef = useRef(onClearSelection);
  onClearSelectionRef.current = onClearSelection;
  const selectedCardsRef = useRef(selectedCards);
  selectedCardsRef.current = selectedCards;
  const isDealModeRef = useRef(isDealMode);
  isDealModeRef.current = isDealMode;
  const containerPageXRef = useRef(0);
  const hoverIdxRef = useRef<number | null>(null);

  const dragStateRef = useRef<{
    cardIndex: number;
    pressTime: number;
    isDragging: boolean;
    origCardX: number;
    origCardY: number;
  } | null>(null);

  // ── Pan handler functions ──────────────────────────────────────────────────

  const panHandlersRef = useRef({
    onGrant: (_gs: PanResponderGestureState) => {},
    onMove: (_gs: PanResponderGestureState) => {},
    onRelease: (_gestureState: PanResponderGestureState) => {},
    onTerminate: () => {},
  });

  function doAnimateShifts(dragIdx: number, hoverI: number, spacing: number): void {
    const n = localCardsRef.current.length;
    for (let i = 0; i < n; i++) {
      if (i === dragIdx) continue;
      const anim = shiftAnims.current[i];
      if (!anim) continue;
      Animated.spring(anim, {
        toValue: targetShift(i, dragIdx, hoverI, spacing),
        useNativeDriver: false,
        speed: 25,
        bounciness: 0,
      }).start();
    }
  }

  function doResetShifts(): void {
    shiftAnims.current.forEach((anim) => {
      Animated.spring(anim, {
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
      if (isDealModeRef.current) return;
      const n = localCardsRef.current.length;
      if (n <= 1 || faceDownRef.current) return;

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
      if (isDealModeRef.current) return;
      const ds = dragStateRef.current;
      if (!ds) return;

      if (!ds.isDragging) {
        if (Date.now() - ds.pressTime < DRAG_DELAY_MS) return;

        ds.isDragging = true;

        if (selectedCardsRef.current.length > 0) {
          onClearSelectionRef.current?.();
        }

        dragCardX.setValue(ds.origCardX + gestureState.dx);
        dragCardY.setValue(ds.origCardY + gestureState.dy - DRAG_LIFT);
        Animated.spring(dragScale, {
          toValue: 1.1,
          useNativeDriver: false,
          speed: 30,
          bounciness: 2,
        }).start();

        setDraggingIdx(ds.cardIndex);

        const { spacing, startX } = computeLayout(
          localCardsRef.current.length,
          screenWidthRef.current
        );
        const localX = gestureState.moveX - containerPageXRef.current;
        const newHover = localXToHoverIdx(localX, localCardsRef.current.length, startX, spacing);
        hoverIdxRef.current = newHover;
        doAnimateShifts(ds.cardIndex, newHover, spacing);
        return;
      }

      dragCardX.setValue(ds.origCardX + gestureState.dx);
      dragCardY.setValue(ds.origCardY + gestureState.dy - DRAG_LIFT);

      if (gestureState.moveX !== 0) lastKnownX.current = gestureState.moveX;

      const { spacing, startX } = computeLayout(
        localCardsRef.current.length,
        screenWidthRef.current
      );
      const localX = (gestureState.moveX !== 0 ? gestureState.moveX : lastKnownX.current) - containerPageXRef.current;
      const newHover = localXToHoverIdx(localX, localCardsRef.current.length, startX, spacing);
      if (newHover !== hoverIdxRef.current) {
        hoverIdxRef.current = newHover;
        doAnimateShifts(ds.cardIndex, newHover, spacing);
      }
    },

    onRelease(gestureState) {
      if (isDealModeRef.current) return;
      const ds = dragStateRef.current;
      dragStateRef.current = null;
      if (!ds) return;

      if (!ds.isDragging) {
        const elapsed = Date.now() - ds.pressTime;
        if (
          elapsed < 500 &&
          !faceDownRef.current &&
          isMyTurnRef.current &&
          onCardSelectRef.current
        ) {
          const card = localCardsRef.current[ds.cardIndex];
          if (card) onCardSelectRef.current(card);
        }
        return;
      }

      // Recalculate drop index from release position using closest-card-centre distance
      const fromIdx = ds.cardIndex;
      const n = localCardsRef.current.length;
      const { spacing, startX } = computeLayout(n, screenWidthRef.current);
      const releaseX = gestureState.moveX !== 0 ? gestureState.moveX : lastKnownX.current;
      const releaseLocalX = releaseX - containerPageXRef.current;
      let toIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < n; i++) {
        const centre = startX + i * spacing + CARD_W / 2;
        const dist = Math.abs(releaseLocalX - centre);
        if (dist < minDist) { minDist = dist; toIdx = i; }
      }
      const next = [...localCardsRef.current];
      const [removed] = next.splice(fromIdx, 1);
      if (removed !== undefined) next.splice(toIdx, 0, removed);

      // Reset drag animation values immediately before re-rendering
      dragCardX.setValue(0);
      dragCardY.setValue(0);
      doResetShifts();
      Animated.spring(dragScale, { toValue: 1, useNativeDriver: false, speed: 30 }).start();
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gs) => panHandlersRef.current.onGrant(gs),
      onPanResponderMove: (_, gs) => panHandlersRef.current.onMove(gs),
      onPanResponderRelease: (_, gs) => panHandlersRef.current.onRelease(gs),
      onPanResponderTerminate: () => panHandlersRef.current.onTerminate(),
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const lastKnownX = useRef<number>(0);

  const containerRef = useRef<View>(null);

  // ── Render ─────────────────────────────────────────────────────────────────

  const n = renderCards.length;
  const { spacing, startX } = computeLayout(n, screenWidth);

  function inValidPlay(card: CardType): boolean {
    return validPlays.some((combo) =>
      combo.some((c) => c.rank === card.rank && c.suit === card.suit)
    );
  }

  function isSelected(card: CardType): boolean {
    return selectedCards.some((c) => c.rank === card.rank && c.suit === card.suit);
  }

  const draggingCard = draggingIdx !== null ? renderCards[draggingIdx] : null;

  return (
    <View
      ref={containerRef}
      style={[styles.container, { width: screenWidth, height: CONTAINER_HEIGHT }]}
      onLayout={() => {
        containerRef.current?.measure((_, __, ___, ____, pageX) => {
          containerPageXRef.current = pageX;
        });
      }}
      onTouchEnd={(e) => {
        const ds = dragStateRef.current;
        if (ds?.isDragging) {
          panHandlersRef.current.onRelease({
            moveX: e.nativeEvent.pageX,
            moveY: e.nativeEvent.pageY,
          } as PanResponderGestureState);
        }
      }}
      {...panResponder.panHandlers}
    >
      {renderCards.map((card, index) => {
        const isDragging = index === draggingIdx;
        const rot = getRotation(index, n);
        const yPos =
          getArcY(index, n) - (!isDragging && isSelected(card) ? SELECTED_LIFT : 0);
        const xPos = startX + index * spacing;
        const shiftAnim = shiftAnims.current[index] ?? new Animated.Value(0);

        // Apply slide-in translateX for the most recently dealt card
        const isNewCard = index === newCardIdx;

        if (isDragging) {
          return (
            <View
              key={`${card.rank}-${card.suit}-${index}`}
              style={[
                styles.wrapper,
                {
                  left: xPos,
                  top: yPos,
                  zIndex: index,
                  opacity: 0.25,
                  transform: [{ rotate: `${rot}deg` }],
                },
              ]}
            >
              <Card card={card} faceDown={faceDown} isDisabled />
            </View>
          );
        }

        return (
          <Animated.View
            key={`${card.rank}-${card.suit}-${index}`}
            style={[
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
            ]}
          >
            <Card
              card={card}
              faceDown={faceDown}
              isSelected={isSelected(card)}
              isValid={!faceDown && inValidPlay(card) && !isDealMode}
              isDisabled={!isMyTurn || isDealMode}
            />
          </Animated.View>
        );
      })}

      {/* Dragged card — floats above all other cards */}
      {draggingCard && (
        <Animated.View
          style={[
            styles.wrapper,
            styles.dragging,
            {
              left: dragCardX,
              top: dragCardY,
              zIndex: 999,
              transform: [{ scale: dragScale }],
            },
          ]}
        >
          <Card card={draggingCard} faceDown={faceDown} isDisabled={false} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
