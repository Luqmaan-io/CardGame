import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  PanResponderGestureState,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Card } from './Card';
import type { Card as CardType } from '../../engine/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_W = 70;
const CARD_H = 100;
const MAX_ROTATION = 20;
const ARC_HEIGHT = 16;
const SELECTED_LIFT = 20;
const DRAG_LIFT = 15;
const DRAG_DELAY_MS = 200;
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
// Returns pixel shift for card at `cardIdx` when card at `dragIdx`
// hovers over `hoverIdx`. Positive = right, negative = left.

function targetShift(
  cardIdx: number,
  dragIdx: number,
  hoverIdx: number,
  spacing: number
): number {
  // Position in "drag card removed" list
  const r = cardIdx > dragIdx ? cardIdx - 1 : cardIdx;
  // Position when gap opens at hoverIdx
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
  // Search right-to-left so the visually top card (higher zIndex = higher index) wins
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
}: HandProps) {
  const { width: screenWidth } = useWindowDimensions();

  // ── Local card order (user can reorder; persists cosmetically) ───────────────
  const [localCards, setLocalCards] = useState<CardType[]>(cards);

  useEffect(() => {
    // Preserve user ordering. Remove played cards. Append newly drawn cards.
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

  // ── Drag visual state ─────────────────────────────────────────────────────────
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  // Position of the floating dragged card in container-local coordinates
  const dragCardX = useRef(new Animated.Value(0)).current;
  const dragCardY = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;

  // Per-card horizontal shift animations (one per card slot)
  const shiftAnims = useRef<Animated.Value[]>([]);
  while (shiftAnims.current.length < localCards.length) {
    shiftAnims.current.push(new Animated.Value(0));
  }

  // ── Stable refs so PanResponder callbacks always read current values ──────────
  const localCardsRef = useRef(localCards);
  localCardsRef.current = localCards;
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
  const containerPageXRef = useRef(0);
  const hoverIdxRef = useRef<number | null>(null);

  // Internal drag session state
  const dragStateRef = useRef<{
    cardIndex: number;
    pressTime: number;
    isDragging: boolean;
    origCardX: number; // container-local x of the card when hold began
    origCardY: number;
  } | null>(null);

  // ── Pan handler functions (fresh closure assigned every render) ────────────────

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

  // Reassign fresh handlers every render — PanResponder delegates to this ref
  panHandlersRef.current = {
    onGrant(gestureState) {
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
      const ds = dragStateRef.current;
      if (!ds) return;

      if (!ds.isDragging) {
        if (Date.now() - ds.pressTime < DRAG_DELAY_MS) return;

        // Enter drag mode
        ds.isDragging = true;

        // Clear selection before drag starts
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

      // Update dragged card position (dx/dy are screen deltas, same unit as container coords)
      dragCardX.setValue(ds.origCardX + gestureState.dx);
      dragCardY.setValue(ds.origCardY + gestureState.dy - DRAG_LIFT);

      // Recompute hover index
      const { spacing, startX } = computeLayout(
        localCardsRef.current.length,
        screenWidthRef.current
      );
      const localX = gestureState.moveX - containerPageXRef.current;
      const newHover = localXToHoverIdx(localX, localCardsRef.current.length, startX, spacing);
      if (newHover !== hoverIdxRef.current) {
        hoverIdxRef.current = newHover;
        doAnimateShifts(ds.cardIndex, newHover, spacing);
      }
    },

    onRelease(_gestureState) {
      const ds = dragStateRef.current;
      dragStateRef.current = null;
      if (!ds) return;

      if (!ds.isDragging) {
        // Treat as tap (generous 500ms window for slow taps)
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

      // Drop: reorder local cards
      const fromIdx = ds.cardIndex;
      const toIdx = hoverIdxRef.current ?? fromIdx;
      const next = [...localCardsRef.current];
      const [removed] = next.splice(fromIdx, 1);
      if (removed !== undefined) next.splice(toIdx, 0, removed);

      doResetShifts();
      Animated.spring(dragScale, { toValue: 1, useNativeDriver: false, speed: 30 }).start();
      hoverIdxRef.current = null;
      setDraggingIdx(null);
      setLocalCards(next);
    },

    onTerminate() {
      dragStateRef.current = null;
      shiftAnims.current.forEach((a) => a.setValue(0));
      dragScale.setValue(1);
      hoverIdxRef.current = null;
      setDraggingIdx(null);
    },
  };

  // ── PanResponder (created once; delegates to panHandlersRef) ─────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gs) => panHandlersRef.current.onGrant(gs),
      onPanResponderMove: (_, gs) => panHandlersRef.current.onMove(gs),
      onPanResponderRelease: (_, gs) => panHandlersRef.current.onRelease(gs),
      onPanResponderTerminate: () => panHandlersRef.current.onTerminate(),
    })
  ).current;

  const containerRef = useRef<View>(null);

  // ── Render ────────────────────────────────────────────────────────────────────

  const n = localCards.length;
  const { spacing, startX } = computeLayout(n, screenWidth);

  function inValidPlay(card: CardType): boolean {
    return validPlays.some((combo) =>
      combo.some((c) => c.rank === card.rank && c.suit === card.suit)
    );
  }

  function isSelected(card: CardType): boolean {
    return selectedCards.some((c) => c.rank === card.rank && c.suit === card.suit);
  }

  const draggingCard = draggingIdx !== null ? localCards[draggingIdx] : null;

  return (
    <View
      ref={containerRef}
      style={[styles.container, { width: screenWidth, height: CONTAINER_HEIGHT }]}
      onLayout={() => {
        containerRef.current?.measure((_, __, ___, ____, pageX) => {
          containerPageXRef.current = pageX;
        });
      }}
      {...panResponder.panHandlers}
    >
      {localCards.map((card, index) => {
        const isDragging = index === draggingIdx;
        const rot = getRotation(index, n);
        const yPos =
          getArcY(index, n) - (!isDragging && isSelected(card) ? SELECTED_LIFT : 0);
        const xPos = startX + index * spacing;
        const shiftAnim = shiftAnims.current[index] ?? new Animated.Value(0);

        if (isDragging) {
          // Ghost placeholder at original position while card is being dragged
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
                  { translateX: shiftAnim },
                  { rotate: `${rot}deg` },
                ],
              },
            ]}
          >
            <Card
              card={card}
              faceDown={faceDown}
              isSelected={isSelected(card)}
              isValid={!faceDown && inValidPlay(card)}
              isDisabled={!isMyTurn}
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
