import React, { MutableRefObject, RefObject, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import { CardBack } from './Card';
import { Hand } from './Hand';
import { DiscardPile } from './DiscardPile';
import { TurnTimer } from './TurnTimer';
import Avatar from './Avatar';
import { SceneRenderer } from './scenes/SceneRenderer';
import { THEME } from '../utils/theme';
import type { GameState, Card as CardType } from '../../engine/types';

// ─── Table coordinate space ────────────────────────────────────────────────────
// All Layer 1 content is positioned in a fixed 600×600 unit space.
// The centre is always (300, 300). This is independent of screen size.
// Layer 2 (the perspective wrapper) scales and positions this onto the screen.

const TABLE_SIZE = 600
const TABLE_CENTRE = 300
const TABLE_RADIUS = 280   // felt radius within the 600×600 space

// ─── Types ────────────────────────────────────────────────────────────────────

export type ViewAngle = 'bottom' | 'top' | 'left' | 'right'

export interface FloatingReaction {
  id: string;
  playerId: string;
  reactionId: string;
  emoji: string;
  startTime: number;
}

const REACTIONS = [
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'cold', emoji: '❄️', label: 'Cold' },
  { id: 'eyes', emoji: '👀', label: 'Eyes' },
  { id: 'clap', emoji: '👏', label: 'Clap' },
];

interface RoundTableProps {
  gameState: GameState;
  myPlayerId: string;
  onCardSelect: (card: CardType) => void;
  onPlay: () => void;
  onDraw: () => void;
  selectedCards: CardType[];
  validPlays: CardType[][];
  isMyTurn: boolean;
  isDealing: boolean;
  dealtCardCounts?: Record<string, number>;
  deckCountOverride?: number | null;
  connectionState: string;
  isAIThinking: boolean;
  // On-cards state (managed by parent)
  onCardsActive: boolean;
  // Auto-draw countdown (managed by parent)
  autoDrawCountdown: number | null;
  onCancelAutoDraw: () => void;
  // Timer
  timerStartedAt: number | null;
  currentPlayerColourHex?: string;
  currentPlayerName?: string;
  // Player names (local AI mode)
  playerNames?: Record<string, string>;
  // Flashing (timeout animation)
  flashingPlayerId?: string | null;
  // Reconnection
  isReconnecting?: boolean;
  onReconnectTimeout?: () => void;
  // Refs for pixel-accurate animations
  drawPileRef?: RefObject<View>;
  discardPileRef?: RefObject<View>;
  humanHandRef?: RefObject<View>;
  opponentRefs?: MutableRefObject<Record<string, View | null>>;
  // Selection
  selectionDisabled?: boolean;
  // Message (derived by parent)
  message: string;
  messageColourHex?: string;
  // Pending pickup for button label
  hasPendingPickup: boolean;
  pendingPickupCount: number;
  // Timer duration (seconds; 0 = no limit)
  turnDuration?: number;
  // Reactions
  floatingReactions?: FloatingReaction[];
  onReact?: (reactionId: string) => void;
  // Multi-perspective foundation — defaults to 'bottom'
  viewAngle?: ViewAngle;
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────

// Human is always at 90° (bottom of table in y-down screen coordinates).
// Angles are spaced evenly; myIndex rotates the ring so human lands at 90°.
function getPlayerAngles(playerCount: number, myIndex: number): number[] {
  const baseAngles: Record<number, number[]> = {
    2: [90, 270],
    3: [90, 210, 330],
    4: [90, 180, 270, 0],
  }
  const base = baseAngles[playerCount] ?? Array.from(
    { length: playerCount },
    (_, i) => ((90 + i * (360 / playerCount)) % 360)
  )
  return Array.from({ length: playerCount }, (_, i) =>
    base[((i - myIndex + playerCount) % playerCount)] ?? 90
  )
}

// Convert a polar angle to table coordinates (600×600 space).
function getTablePos(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: TABLE_CENTRE + radius * Math.cos(rad),
    y: TABLE_CENTRE + radius * Math.sin(rad),
  }
}

// Map viewAngle to the appropriate perspective transform array.
function getPerspectiveTransform(viewAngle: ViewAngle): ViewStyle['transform'] {
  switch (viewAngle) {
    case 'top':   return [{ perspective: 900 }, { rotateX: '-28deg' }]
    case 'left':  return [{ perspective: 900 }, { rotateY: '28deg' }]
    case 'right': return [{ perspective: 900 }, { rotateY: '-28deg' }]
    default:      return [{ perspective: 900 }, { rotateX: '28deg' }]
  }
}

// ─── DrawPileView ─────────────────────────────────────────────────────────────

function DrawPileView({
  count,
  onPress,
}: {
  count: number;
  onPress?: () => void;
}) {
  const inner = (
    <View style={drawStyles.outer}>
      {count > 2 && (
        <View
          style={[
            drawStyles.stackBehind,
            { bottom: -5, left: -4, transform: [{ rotate: '4deg' }] },
          ]}
        />
      )}
      {count > 1 && (
        <View
          style={[
            drawStyles.stackBehind,
            { bottom: -2.5, left: -2, transform: [{ rotate: '2deg' }] },
          ]}
        />
      )}
      <CardBack width={52} height={76} />
      <View style={drawStyles.countBadge}>
        <Text style={drawStyles.countText}>{count}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

const drawStyles = StyleSheet.create({
  outer: {
    position: 'relative',
  },
  stackBehind: {
    position: 'absolute',
    width: 52,
    height: 76,
    borderRadius: 4,
    backgroundColor: THEME.cardBack,
    borderWidth: 1,
    borderColor: THEME.goldDark,
  },
  countBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: THEME.gold,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    color: THEME.appBackground,
    fontSize: 9,
    fontWeight: '800',
  },
});

// ─── OpponentSlot ─────────────────────────────────────────────────────────────

interface OpponentSlotViewProps {
  playerId: string;
  hand: CardType[];
  name: string;
  isCurrentTurn: boolean;
  hasOnCardsDeclaration: boolean;
  colourHex: string;
  avatarId: string;
  visibleCardCount?: number;
  isFlashing?: boolean;
}

function OpponentSlotView({
  hand,
  name,
  isCurrentTurn,
  hasOnCardsDeclaration,
  colourHex,
  avatarId,
  visibleCardCount,
  isFlashing = false,
}: OpponentSlotViewProps) {
  const liftAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFlashing) {
      flashAnim.setValue(0);
      const seq = Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]);
      seq.start();
      return () => seq.stop();
    } else {
      flashAnim.setValue(0);
    }
  }, [isFlashing]);

  useEffect(() => {
    if (isCurrentTurn && hand.length > 0) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(900),
          Animated.timing(liftAnim, { toValue: -6, duration: 300, useNativeDriver: false }),
          Animated.timing(liftAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
          Animated.delay(1400),
        ])
      );
      loopRef.current = loop;
      loop.start();
    } else {
      loopRef.current?.stop();
      liftAnim.setValue(0);
    }
    return () => { loopRef.current?.stop(); };
  }, [isCurrentTurn, hand.length]);

  const effectiveCount = visibleCardCount !== undefined ? visibleCardCount : hand.length;
  const stackCount = Math.min(3, Math.max(1, effectiveCount));

  const flashBorderColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', THEME.danger],
  });

  return (
    <View style={oppStyles.slot}>
      {/* Active turn: gold ring */}
      {isCurrentTurn && (
        <View style={[oppStyles.turnRing, { borderColor: THEME.gold }]} />
      )}

      <Avatar
        avatarId={avatarId}
        size={40}
        colourHex={colourHex}
        showRing={isCurrentTurn}
      />

      <Text
        style={[oppStyles.name, { color: colourHex }]}
        numberOfLines={1}
      >
        {name}
      </Text>

      {/* Face-down card stack */}
      <Animated.View style={[oppStyles.cardStack, isCurrentTurn && { transform: [{ translateY: liftAnim }] }]}>
        {Array.from({ length: stackCount }).map((_, i) => (
          <View
            key={i}
            style={[
              oppStyles.stackCard,
              i > 0 && { position: 'absolute', top: -(i * 2), left: i * 1.5 },
            ]}
          >
            <CardBack width={26} height={38} />
          </View>
        ))}
      </Animated.View>

      {/* Gold alert ring when 3 or fewer cards remain */}
      {effectiveCount <= 3 && effectiveCount > 0 && (
        <View style={oppStyles.alertRing} />
      )}

      {/* Card count badge */}
      <Animated.View
        style={[
          oppStyles.countBadge,
          { backgroundColor: colourHex },
          isFlashing && { borderColor: flashBorderColor, borderWidth: 1.5 },
        ]}
      >
        <Text style={oppStyles.countText}>{effectiveCount}</Text>
      </Animated.View>

      {hasOnCardsDeclaration && (
        <Text style={oppStyles.onCards}>On cards!</Text>
      )}
    </View>
  );
}

const oppStyles = StyleSheet.create({
  slot: {
    width: 76,
    alignItems: 'center',
    gap: 2,
  },
  turnRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 50,
    borderWidth: 2,
  },
  name: {
    fontSize: 10,
    fontWeight: '600',
    maxWidth: 72,
    textAlign: 'center',
  },
  cardStack: {
    position: 'relative',
    width: 26,
    height: 38,
    marginTop: 2,
  },
  stackCard: {},
  alertRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: THEME.gold,
    opacity: 0.7,
  },
  countBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 1,
    marginTop: 4,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
  },
  onCards: {
    color: THEME.gold,
    fontSize: 9,
    fontWeight: '700',
  },
});

// ─── ReconnectionOverlay ──────────────────────────────────────────────────────

function ReconnectionOverlay({ onTimeout }: { onTimeout?: () => void }) {
  const [seconds, setSeconds] = useState(30);
  const [dotStep, setDotStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setDotStep((s) => (s + 1) % 3), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (seconds <= 0) { onTimeout?.(); return; }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const dots = ['.', '..', '...'][dotStep] ?? '.';

  return (
    <View style={reconStyles.backdrop}>
      <View style={reconStyles.card}>
        <Text style={reconStyles.title}>Connection lost</Text>
        <Text style={reconStyles.subtitle}>Reconnecting{dots}</Text>
        <Text style={reconStyles.countdown}>You will be removed in {seconds}s</Text>
      </View>
    </View>
  );
}

const reconStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: THEME.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
    minWidth: 240,
    borderWidth: 1,
    borderColor: THEME.gold,
  },
  title: { fontSize: 20, fontWeight: '800', color: THEME.textPrimary },
  subtitle: { fontSize: 15, color: THEME.textSecondary, fontWeight: '500' },
  countdown: { fontSize: 13, color: THEME.danger, fontWeight: '600', marginTop: 4 },
});

// ─── FloatingReactionView ─────────────────────────────────────────────────────

function FloatingReactionView({ emoji, startX, startY }: { emoji: string; startX: number; startY: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -80, duration: 2000, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: startX - 16,
        top: startY - 16,
        opacity,
        transform: [{ translateY }],
        zIndex: 30,
      }}
    >
      <Text style={{ fontSize: 28 }}>{emoji}</Text>
    </Animated.View>
  );
}

// ─── RoundTable ────────────────────────────────────────────────────────────────

const HAND_AREA_HEIGHT = 160;
const ACTION_ZONE_HEIGHT = 140;

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
};

// Pile dimensions in table coordinate space (fixed, screen-independent)
const CARD_W = 52
const CARD_H = 76
const PILE_GAP = 20
const PILES_TOTAL_WIDTH = CARD_W * 2 + PILE_GAP
const DISCARD_X = TABLE_CENTRE - PILES_TOTAL_WIDTH / 2          // 238
const DISCARD_Y = TABLE_CENTRE - CARD_H / 2                     // 262
const DRAW_X = TABLE_CENTRE - PILES_TOTAL_WIDTH / 2 + CARD_W + PILE_GAP  // 310
const DRAW_Y = TABLE_CENTRE - CARD_H / 2                        // 262

// Slot placement radius — keeps slots on the visible table rim
const SLOT_RADIUS = TABLE_RADIUS * 0.88   // ≈ 246

export function RoundTable({
  gameState,
  myPlayerId,
  onCardSelect,
  onPlay,
  onDraw,
  selectedCards,
  validPlays,
  isMyTurn,
  isDealing,
  dealtCardCounts,
  deckCountOverride,
  isAIThinking,
  onCardsActive: _onCardsActive,
  autoDrawCountdown,
  onCancelAutoDraw,
  timerStartedAt,
  currentPlayerColourHex,
  currentPlayerName,
  playerNames = {},
  flashingPlayerId = null,
  isReconnecting = false,
  onReconnectTimeout,
  drawPileRef,
  discardPileRef,
  humanHandRef,
  opponentRefs,
  selectionDisabled = false,
  message,
  messageColourHex,
  hasPendingPickup,
  pendingPickupCount,
  turnDuration = 30,
  floatingReactions = [],
  onReact,
  viewAngle = 'bottom',
}: RoundTableProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // ── timerPercent for scene renderer ─────────────────────────────────────────
  const [timerPercent, setTimerPercent] = useState(100);
  useEffect(() => {
    if (!timerStartedAt || turnDuration === 0) {
      setTimerPercent(100);
      return;
    }
    const update = () => {
      const elapsed = Date.now() - timerStartedAt;
      setTimerPercent(Math.max(0, Math.min(100, 100 - (elapsed / (turnDuration * 1000)) * 100)));
    };
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [timerStartedAt, turnDuration]);

  // ── Reaction picker ──────────────────────────────────────────────────────────
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  if (!gameState || !gameState.players) {
    return (
      <View style={tableStyles.root}>
        <View style={tableStyles.connecting}>
          <Text style={tableStyles.connectingText}>Connecting…</Text>
        </View>
      </View>
    );
  }

  const { players, discard, activeSuit } = gameState;
  const displayDeckCount = deckCountOverride != null ? deckCountOverride : gameState.deck.length;

  const myPlayer = players.find((p) => p.id === myPlayerId);
  const myIndex = players.findIndex((p) => p.id === myPlayerId);

  // ── Screen geometry — where the table wrapper sits on screen ─────────────────
  const isSmallScreen = screenWidth < 768

  // Table appears at 88% screen width on mobile, or 70% of viewport on desktop
  const tableScreenSize = isSmallScreen
    ? screenWidth * 0.88
    : Math.min(screenWidth * 0.7, screenHeight * 0.7)

  // Scale factor: maps 600-unit table space to screen pixels
  const tableScale = tableScreenSize / TABLE_SIZE

  // Where the perspective wrapper is positioned on screen
  const tableScreenX = (screenWidth - tableScreenSize) / 2
  const tableScreenY = isSmallScreen
    ? screenHeight * 0.12   // 12% from top on mobile — leaves room for hand
    : (screenHeight - tableScreenSize) / 2

  // Layer 1 is 600×600, scaled by tableScale.
  // Transform is around center (300, 300), so to visually align top-left
  // of the scaled content with the wrapper's (0,0), we shift:
  //   left = top = 300 * (tableScale - 1)
  const layer1Offset = 300 * (tableScale - 1)

  // The perspective transform — varies by viewAngle prop
  const perspectiveTransform = getPerspectiveTransform(viewAngle)

  // ── Player angles ────────────────────────────────────────────────────────────
  const playerAngles = getPlayerAngles(players.length, myIndex);
  const opponentList = players
    .map((p, i) => ({ player: p, angle: playerAngles[i] ?? 0, index: i }))
    .filter((item) => item.player.id !== myPlayerId);

  // ── Active suit symbol ────────────────────────────────────────────────────────
  const activeSuitSymbol = activeSuit ? SUIT_SYMBOLS[activeSuit] : null;
  const activeSuitIsRed = activeSuit ? ['hearts', 'diamonds'].includes(activeSuit) : false;

  // ── Pre-action visibility ─────────────────────────────────────────────────────
  const hasActed = gameState.currentPlayerHasActed;
  const showPreAction =
    isMyTurn && !hasActed && !isAIThinking && !isDealing &&
    gameState.phase !== 'declare-suit';

  // ── tableToScreen: approximate screen coords for Layer 3 overlays ────────────
  // Ignores perspective distortion (acceptable for floating effects).
  const tableToScreen = (tx: number, ty: number) => ({
    x: tableScreenX + tx * tableScale,
    y: tableScreenY + ty * tableScale,
  })

  return (
    <View style={tableStyles.root}>

      {/* ═══════════════════════════════════════════════════════════════════════
          Layer 2 — Perspective wrapper
          Positioned on screen at tableScreenX/tableScreenY.
          Applies the tilt. Contains Layer 1 only.
          ═══════════════════════════════════════════════════════════════════════ */}
      <View
        style={{
          position: 'absolute',
          left: tableScreenX,
          top: tableScreenY,
          width: tableScreenSize,
          height: tableScreenSize,
          transform: perspectiveTransform,
          // Web: ensure transform rotates around center
          ...(typeof window !== 'undefined' ? { transformOrigin: 'center center' } : {}),
          overflow: 'visible',
        }}
        pointerEvents="box-none"
      >

        {/* ═══════════════════════════════════════════════════════════════════
            Layer 1 — Table content
            600×600 unit coordinate space. Scale applied here so all content
            uses fixed table coordinates regardless of screen size.
            ═══════════════════════════════════════════════════════════════════ */}
        <View
          style={{
            position: 'absolute',
            width: TABLE_SIZE,
            height: TABLE_SIZE,
            left: layer1Offset,
            top: layer1Offset,
            transform: [{ scale: tableScale }],
          }}
          pointerEvents="box-none"
        >

          {/* ── Outer rim — navy with gold border ────────────────────────── */}
          <View
            style={{
              position: 'absolute',
              width: TABLE_RADIUS * 2 + 24,
              height: TABLE_RADIUS * 2 + 24,
              borderRadius: TABLE_RADIUS + 12,
              backgroundColor: THEME.tableRim,
              borderWidth: 3,
              borderColor: THEME.gold,
              left: TABLE_CENTRE - TABLE_RADIUS - 12,
              top: TABLE_CENTRE - TABLE_RADIUS - 12,
              shadowColor: THEME.gold,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
              zIndex: 1,
            }}
          />

          {/* ── Felt surface — deep green ─────────────────────────────────── */}
          <View
            style={{
              position: 'absolute',
              width: TABLE_RADIUS * 2,
              height: TABLE_RADIUS * 2,
              borderRadius: TABLE_RADIUS,
              backgroundColor: THEME.tableFelt,
              left: TABLE_CENTRE - TABLE_RADIUS,
              top: TABLE_CENTRE - TABLE_RADIUS,
              zIndex: 2,
            }}
          />

          {/* ── Felt crosshatch texture at 6% opacity ────────────────────── */}
          <View
            style={{
              position: 'absolute',
              width: TABLE_RADIUS * 2,
              height: TABLE_RADIUS * 2,
              borderRadius: TABLE_RADIUS,
              overflow: 'hidden',
              left: TABLE_CENTRE - TABLE_RADIUS,
              top: TABLE_CENTRE - TABLE_RADIUS,
              opacity: 0.06,
              zIndex: 3,
            }}
            pointerEvents="none"
          >
            {Array.from({ length: 40 }).map((_, i) => (
              <View key={`h${i}`} style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: i * (TABLE_RADIUS * 2 / 40),
                height: 0.5,
                backgroundColor: '#ffffff',
              }} />
            ))}
            {Array.from({ length: 40 }).map((_, i) => (
              <View key={`v${i}`} style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: i * (TABLE_RADIUS * 2 / 40),
                width: 0.5,
                backgroundColor: '#ffffff',
              }} />
            ))}
          </View>

          {/* ── Scene zones — one per player, rotated to face them ───────── */}
          {players.map((player, idx) => {
            const angle = playerAngles[idx] ?? 0;
            const pos = getTablePos(angle, TABLE_RADIUS * 0.55);
            const sceneId = (player as { sceneId?: string }).sceneId ?? 'midnight_rain';
            const isCurrentTurnPlayer = players[gameState.currentPlayerIndex]?.id === player.id;
            return (
              <View
                key={`scene-${player.id}`}
                style={{
                  position: 'absolute',
                  left: pos.x - 60,
                  top: pos.y - 90,
                  width: 120,
                  height: 180,
                  transform: [{ rotate: `${angle + 90}deg` }],
                  overflow: 'hidden',
                  borderRadius: 8,
                  opacity: 0.85,
                  zIndex: 4,
                }}
                pointerEvents="none"
              >
                <SceneRenderer
                  sceneId={sceneId}
                  playerAngle={angle}
                  sliceWidth={120}
                  sliceHeight={180}
                  isCurrentPlayer={isCurrentTurnPlayer}
                  timerPercent={timerPercent}
                />
              </View>
            );
          })}

          {/* ── Message — upper-left of felt, above piles ────────────────── */}
          {!!message && (
            <View
              style={{
                position: 'absolute',
                left: TABLE_CENTRE - TABLE_RADIUS * 0.75,
                top: TABLE_CENTRE - TABLE_RADIUS * 0.55,
                maxWidth: TABLE_RADIUS * 0.9,
                zIndex: 10,
              }}
              pointerEvents="none"
            >
              <View style={tableStyles.messageBox}>
                <Text
                  style={[
                    tableStyles.messageText,
                    messageColourHex ? { color: messageColourHex } : undefined,
                  ]}
                  numberOfLines={2}
                >
                  {message}
                </Text>
              </View>
            </View>
          )}

          {/* ── Discard pile — left of centre ────────────────────────────── */}
          <View
            ref={discardPileRef}
            style={{
              position: 'absolute',
              left: DISCARD_X,
              top: DISCARD_Y,
              zIndex: 5,
            }}
          >
            <DiscardPile discard={discard} activeSuit={activeSuit} />
          </View>

          {/* ── Draw pile — right of centre ──────────────────────────────── */}
          <View
            ref={drawPileRef}
            style={{
              position: 'absolute',
              left: DRAW_X,
              top: DRAW_Y,
              alignItems: 'center',
              zIndex: 5,
            }}
          >
            <DrawPileView
              count={displayDeckCount}
              onPress={showPreAction && !selectedCards.length ? onDraw : undefined}
            />
          </View>

          {/* ── Active suit indicator — between the two piles ────────────── */}
          {activeSuit && activeSuitSymbol && (
            <View
              style={{
                position: 'absolute',
                left: TABLE_CENTRE - 15,
                top: TABLE_CENTRE - 55,
                zIndex: 8,
              }}
              pointerEvents="none"
            >
              <View style={tableStyles.suitIndicator}>
                <Text
                  style={[
                    tableStyles.suitSymbol,
                    { color: activeSuitIsRed ? THEME.cardRed : THEME.textPrimary },
                  ]}
                >
                  {activeSuitSymbol}
                </Text>
              </View>
            </View>
          )}

          {/* ── Opponent slots around the rim ────────────────────────────── */}
          {opponentList.map(({ player, angle }) => {
            const pos = getTablePos(angle, SLOT_RADIUS);
            const isCurrentTurn = players[gameState.currentPlayerIndex]?.id === player.id;
            const vCount = dealtCardCounts ? (dealtCardCounts[player.id] ?? 0) : undefined;
            const name = playerNames[player.id] ?? player.id.slice(0, 8);

            return (
              <View
                key={player.id}
                ref={(r) => {
                  if (opponentRefs) opponentRefs.current[player.id] = r;
                }}
                style={{
                  position: 'absolute',
                  left: pos.x - 38,
                  top: pos.y - 55,
                  zIndex: 6,
                }}
              >
                <OpponentSlotView
                  playerId={player.id}
                  hand={player.hand}
                  name={name}
                  isCurrentTurn={isCurrentTurn}
                  hasOnCardsDeclaration={gameState.onCardsDeclarations.includes(player.id)}
                  colourHex={player.colourHex ?? THEME.info}
                  avatarId={(player as { avatarId?: string }).avatarId ?? 'avatar_01'}
                  visibleCardCount={vCount}
                  isFlashing={flashingPlayerId === player.id}
                />
              </View>
            );
          })}

          {/* ── Human avatar — bottom rim of table ───────────────────────── */}
          {myPlayer && (
            <View
              style={{
                position: 'absolute',
                left: TABLE_CENTRE - 36,
                top: TABLE_CENTRE + SLOT_RADIUS - 28,
                width: 72,
                alignItems: 'center',
                zIndex: 6,
              }}
              pointerEvents="none"
            >
              <Avatar
                avatarId={(myPlayer as { avatarId?: string }).avatarId ?? 'avatar_01'}
                size={32}
                colourHex={myPlayer.colourHex ?? THEME.info}
                showRing={isMyTurn}
              />
              <Text style={[tableStyles.youLabel, { color: myPlayer.colourHex ?? THEME.info }]}>
                You
              </Text>
            </View>
          )}

        </View>
        {/* End Layer 1 */}

      </View>
      {/* End Layer 2 */}

      {/* ═════════���═════════════════════════════════════════════════════════════
          Layer 3 — Flat UI overlay
          All elements here use screen coordinates. Never affected by tilt.
          ═══════════════════════════════════════════════════════════════════════ */}

      {/* ── Human hand fan — above the action zone ──────────────────────────── */}
      <View
        ref={humanHandRef}
        style={[
          tableStyles.handArea,
          {
            height: isSmallScreen ? 140 : HAND_AREA_HEIGHT,
            bottom: isSmallScreen ? 100 : ACTION_ZONE_HEIGHT,
          },
        ]}
      >
        {myPlayer && (
          <Hand
            cards={myPlayer.hand}
            validPlays={validPlays}
            selectedCards={selectedCards}
            onCardSelect={selectionDisabled ? undefined : onCardSelect}
            isMyTurn={isMyTurn && !isDealing}
            visibleCardCount={dealtCardCounts ? (dealtCardCounts[myPlayerId] ?? 0) : undefined}
          />
        )}
      </View>

      {/* ── Bottom action zone (timer + buttons) ────────────────────────────── */}
      <View style={tableStyles.actionZone}>
        <TurnTimer
          timerStartedAt={timerStartedAt}
          turnDuration={turnDuration}
          currentPlayerColourHex={currentPlayerColourHex}
          isMyTurn={isMyTurn && !isDealing && !isAIThinking}
          currentPlayerName={currentPlayerName}
        />
        {showPreAction && (
          <View style={tableStyles.actionBtnRow}>
            {selectedCards.length > 0 && (
              <TouchableOpacity style={tableStyles.playBtn} onPress={onPlay}>
                <Text style={tableStyles.playBtnText}>
                  Play{selectedCards.length > 1 ? ` (${selectedCards.length})` : ''}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[tableStyles.drawBtn, selectedCards.length > 0 && tableStyles.drawBtnNarrow]}
              onPress={onDraw}
              disabled={!isMyTurn}
            >
              <Text style={tableStyles.drawBtnText}>
                {hasPendingPickup ? `Pick up ${pendingPickupCount}` : 'Pick up'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Auto-draw countdown overlay ─────────────────────────────────────── */}
      {autoDrawCountdown !== null && gameState && (
        <View style={tableStyles.autoDrawOverlay}>
          <View style={tableStyles.autoDrawCard}>
            <Text style={tableStyles.autoDrawTitle}>No counter available</Text>
            <Text style={tableStyles.autoDrawSub}>
              Picking up {pendingPickupCount} card{pendingPickupCount !== 1 ? 's' : ''} in {autoDrawCountdown}…
            </Text>
            <TouchableOpacity style={tableStyles.autoDrawCancelBtn} onPress={onCancelAutoDraw}>
              <Text style={tableStyles.autoDrawCancelText}>Cancel — draw manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Reconnection overlay ─────────────────────────────────────────────── */}
      {isReconnecting && (
        <ReconnectionOverlay onTimeout={onReconnectTimeout} />
      )}

      {/* ── Floating reactions — screen-space positions ──────────────────────── */}
      {floatingReactions.map((r) => {
        const playerIdx = players.findIndex((p) => p.id === r.playerId);
        const angle = playerAngles[playerIdx] ?? 90;
        const tablePos = getTablePos(angle, SLOT_RADIUS);
        const screenPos = tableToScreen(tablePos.x, tablePos.y);
        return (
          <FloatingReactionView
            key={r.id}
            emoji={r.emoji}
            startX={screenPos.x}
            startY={screenPos.y}
          />
        );
      })}

      {/* ── Reaction button — near human player slot ─────────────────────────── */}
      {onReact && (() => {
        // Human is at angle=90° (bottom). Convert to screen coords.
        const humanTablePos = getTablePos(90, SLOT_RADIUS);
        const humanScreen = tableToScreen(humanTablePos.x, humanTablePos.y);
        return (
          <View
            style={{
              position: 'absolute',
              left: humanScreen.x + 44,
              top: humanScreen.y - 18,
              zIndex: 20,
            }}
          >
            {showReactionPicker ? (
              <View style={reactionStyles.picker}>
                {REACTIONS.map((rx) => (
                  <TouchableOpacity
                    key={rx.id}
                    style={reactionStyles.reactionOption}
                    onPress={() => {
                      onReact(rx.id);
                      setShowReactionPicker(false);
                    }}
                  >
                    <Text style={reactionStyles.reactionEmoji}>{rx.emoji}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={reactionStyles.reactionOption}
                  onPress={() => setShowReactionPicker(false)}
                >
                  <Text style={reactionStyles.reactionClose}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={reactionStyles.btn}
                onPress={() => setShowReactionPicker(true)}
              >
                <Text style={reactionStyles.btnText}>😊</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })()}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const tableStyles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: THEME.appBackground,
  },
  connecting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectingText: {
    color: THEME.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  youLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  messageBox: {
    backgroundColor: 'rgba(13,27,42,0.82)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  messageText: {
    color: THEME.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  suitIndicator: {
    backgroundColor: 'rgba(201,168,76,0.2)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: THEME.gold,
  },
  suitSymbol: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Action zone overlay — transparent, sits at bottom
  actionZone: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 24,
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: 'transparent',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  drawBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.gold,
  },
  drawBtnNarrow: {
    flex: 0.6,
  },
  drawBtnText: {
    color: THEME.gold,
    fontSize: 16,
    fontWeight: '500',
  },
  playBtn: {
    flex: 1,
    backgroundColor: THEME.gold,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  playBtnText: {
    color: THEME.appBackground,
    fontSize: 16,
    fontWeight: '500',
  },

  // Hand area — sits above action zone
  handArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },

  // Auto-draw overlay
  autoDrawOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 55,
  },
  autoDrawCard: {
    backgroundColor: THEME.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 10,
    minWidth: 240,
    borderWidth: 1,
    borderColor: THEME.gold,
  },
  autoDrawTitle: {
    color: THEME.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  autoDrawSub: {
    color: THEME.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  autoDrawCancelBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.gold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  autoDrawCancelText: {
    color: THEME.gold,
    fontSize: 13,
    fontWeight: '600',
  },
});

const reactionStyles = StyleSheet.create({
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(13,27,42,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 16,
  },
  picker: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13,27,42,0.92)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
    alignItems: 'center',
  },
  reactionOption: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionEmoji: {
    fontSize: 20,
  },
  reactionClose: {
    fontSize: 12,
    color: THEME.textMuted,
    fontWeight: '700',
  },
});
