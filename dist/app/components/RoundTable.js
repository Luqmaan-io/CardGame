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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoundTable = RoundTable;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const Card_1 = require("./Card");
const Hand_1 = require("./Hand");
const DiscardPile_1 = require("./DiscardPile");
const TurnTimer_1 = require("./TurnTimer");
const Avatar_1 = __importDefault(require("./Avatar"));
const theme_1 = require("../utils/theme");
// ─── Table coordinate space ────────────────────────────────────────────────────
// All Layer 1 content is positioned in a fixed 600×600 unit space.
// The centre is always (300, 300). This is independent of screen size.
// Layer 2 (the perspective wrapper) scales and positions this onto the screen.
const TABLE_SIZE = 600;
const TABLE_CENTRE = 300;
const TABLE_RADIUS = 280; // felt radius within the 600×600 space
const REACTIONS = [
    { id: 'fire', emoji: '🔥', label: 'Fire' },
    { id: 'cold', emoji: '❄️', label: 'Cold' },
    { id: 'eyes', emoji: '👀', label: 'Eyes' },
    { id: 'clap', emoji: '👏', label: 'Clap' },
];
// ─── Geometry helpers ─────────────────────────────────────────────────────────
// Human is always at 90° (bottom of table in y-down screen coordinates).
// Angles are spaced evenly; myIndex rotates the ring so human lands at 90°.
function getPlayerAngles(playerCount, myIndex) {
    const baseAngles = {
        2: [90, 270],
        3: [90, 210, 330],
        4: [90, 180, 270, 0],
    };
    const base = baseAngles[playerCount] ?? Array.from({ length: playerCount }, (_, i) => ((90 + i * (360 / playerCount)) % 360));
    return Array.from({ length: playerCount }, (_, i) => base[((i - myIndex + playerCount) % playerCount)] ?? 90);
}
// Convert a polar angle to table coordinates (600×600 space).
function getTablePos(angleDeg, radius) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
        x: TABLE_CENTRE + radius * Math.cos(rad),
        y: TABLE_CENTRE + radius * Math.sin(rad),
    };
}
// Map viewAngle to the appropriate perspective transform array.
function getPerspectiveTransform(viewAngle) {
    switch (viewAngle) {
        case 'top': return [{ perspective: 900 }, { rotateX: '-28deg' }];
        case 'left': return [{ perspective: 900 }, { rotateY: '28deg' }];
        case 'right': return [{ perspective: 900 }, { rotateY: '-28deg' }];
        default: return [{ perspective: 900 }, { rotateX: '28deg' }];
    }
}
// Pile card dimensions — declared here so DrawPileView and the pile position
// constants (below) both reference the same values.
const CARD_W = 68;
const CARD_H = 99;
// ─── DrawPileView ─────────────────────────────────────────────────────────────
function DrawPileView({ count, onPress, }) {
    const inner = (<react_native_1.View style={drawStyles.outer}>
      {count > 2 && (<react_native_1.View style={[
                drawStyles.stackBehind,
                { bottom: -5, left: -4, transform: [{ rotate: '4deg' }] },
            ]}/>)}
      {count > 1 && (<react_native_1.View style={[
                drawStyles.stackBehind,
                { bottom: -2.5, left: -2, transform: [{ rotate: '2deg' }] },
            ]}/>)}
      <Card_1.CardBack width={CARD_W} height={CARD_H}/>
      <react_native_1.View style={drawStyles.countBadge}>
        <react_native_1.Text style={drawStyles.countText}>{count}</react_native_1.Text>
      </react_native_1.View>
    </react_native_1.View>);
    if (onPress) {
        return (<react_native_1.TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {inner}
      </react_native_1.TouchableOpacity>);
    }
    return inner;
}
const drawStyles = react_native_1.StyleSheet.create({
    outer: {
        position: 'relative',
    },
    stackBehind: {
        position: 'absolute',
        width: CARD_W,
        height: CARD_H,
        borderRadius: 4,
        backgroundColor: theme_1.THEME.cardBack,
        borderWidth: 1,
        borderColor: theme_1.THEME.goldDark,
    },
    countBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: theme_1.THEME.gold,
        borderRadius: 10,
        paddingHorizontal: 5,
        paddingVertical: 1,
        minWidth: 20,
        alignItems: 'center',
    },
    countText: {
        color: theme_1.THEME.appBackground,
        fontSize: 9,
        fontWeight: '800',
    },
});
function OpponentSlotView({ hand, name, isCurrentTurn, hasOnCardsDeclaration, colourHex, avatarId, visibleCardCount, isFlashing = false, }) {
    const liftAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const loopRef = (0, react_1.useRef)(null);
    const flashAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    (0, react_1.useEffect)(() => {
        if (isFlashing) {
            flashAnim.setValue(0);
            const seq = react_native_1.Animated.sequence([
                react_native_1.Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
                react_native_1.Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
                react_native_1.Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
                react_native_1.Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
            ]);
            seq.start();
            return () => seq.stop();
        }
        else {
            flashAnim.setValue(0);
        }
    }, [isFlashing]);
    (0, react_1.useEffect)(() => {
        if (isCurrentTurn && hand.length > 0) {
            const loop = react_native_1.Animated.loop(react_native_1.Animated.sequence([
                react_native_1.Animated.delay(900),
                react_native_1.Animated.timing(liftAnim, { toValue: -6, duration: 300, useNativeDriver: false }),
                react_native_1.Animated.timing(liftAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
                react_native_1.Animated.delay(1400),
            ]));
            loopRef.current = loop;
            loop.start();
        }
        else {
            loopRef.current?.stop();
            liftAnim.setValue(0);
        }
        return () => { loopRef.current?.stop(); };
    }, [isCurrentTurn, hand.length]);
    const effectiveCount = visibleCardCount !== undefined ? visibleCardCount : hand.length;
    const stackCount = Math.min(3, Math.max(1, effectiveCount));
    const flashBorderColor = flashAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['transparent', theme_1.THEME.danger],
    });
    return (<react_native_1.View style={oppStyles.slot}>
      {/* Active turn: gold ring */}
      {isCurrentTurn && (<react_native_1.View style={[oppStyles.turnRing, { borderColor: theme_1.THEME.gold }]}/>)}

      <Avatar_1.default avatarId={avatarId} size={40} colourHex={colourHex} showRing={isCurrentTurn}/>

      <react_native_1.Text style={[oppStyles.name, { color: colourHex }]} numberOfLines={1}>
        {name}
      </react_native_1.Text>

      {/* Face-down card stack */}
      <react_native_1.Animated.View style={[oppStyles.cardStack, isCurrentTurn && { transform: [{ translateY: liftAnim }] }]}>
        {Array.from({ length: stackCount }).map((_, i) => (<react_native_1.View key={i} style={[
                oppStyles.stackCard,
                i > 0 && { position: 'absolute', top: -(i * 2), left: i * 1.5 },
            ]}>
            <Card_1.CardBack width={26} height={38}/>
          </react_native_1.View>))}
      </react_native_1.Animated.View>

      {/* Gold alert ring when 3 or fewer cards remain */}
      {effectiveCount <= 3 && effectiveCount > 0 && (<react_native_1.View style={oppStyles.alertRing}/>)}

      {/* Card count badge */}
      <react_native_1.Animated.View style={[
            oppStyles.countBadge,
            { backgroundColor: colourHex },
            isFlashing && { borderColor: flashBorderColor, borderWidth: 1.5 },
        ]}>
        <react_native_1.Text style={oppStyles.countText}>{effectiveCount}</react_native_1.Text>
      </react_native_1.Animated.View>

      {hasOnCardsDeclaration && (<react_native_1.Text style={oppStyles.onCards}>On cards!</react_native_1.Text>)}
    </react_native_1.View>);
}
const oppStyles = react_native_1.StyleSheet.create({
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
        borderColor: theme_1.THEME.gold,
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
        color: theme_1.THEME.gold,
        fontSize: 9,
        fontWeight: '700',
    },
});
// ─── ReconnectionOverlay ──────────────────────────────────────────────────────
function ReconnectionOverlay({ onTimeout }) {
    const [seconds, setSeconds] = (0, react_1.useState)(30);
    const [dotStep, setDotStep] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        const id = setInterval(() => setDotStep((s) => (s + 1) % 3), 500);
        return () => clearInterval(id);
    }, []);
    (0, react_1.useEffect)(() => {
        if (seconds <= 0) {
            onTimeout?.();
            return;
        }
        const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
        return () => clearTimeout(id);
    }, [seconds]);
    const dots = ['.', '..', '...'][dotStep] ?? '.';
    return (<react_native_1.View style={reconStyles.backdrop}>
      <react_native_1.View style={reconStyles.card}>
        <react_native_1.Text style={reconStyles.title}>Connection lost</react_native_1.Text>
        <react_native_1.Text style={reconStyles.subtitle}>Reconnecting{dots}</react_native_1.Text>
        <react_native_1.Text style={reconStyles.countdown}>You will be removed in {seconds}s</react_native_1.Text>
      </react_native_1.View>
    </react_native_1.View>);
}
const reconStyles = react_native_1.StyleSheet.create({
    backdrop: {
        ...react_native_1.StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    card: {
        backgroundColor: theme_1.THEME.cardBackground,
        borderRadius: 16,
        paddingHorizontal: 32,
        paddingVertical: 28,
        alignItems: 'center',
        gap: 10,
        minWidth: 240,
        borderWidth: 1,
        borderColor: theme_1.THEME.gold,
    },
    title: { fontSize: 20, fontWeight: '800', color: theme_1.THEME.textPrimary },
    subtitle: { fontSize: 15, color: theme_1.THEME.textSecondary, fontWeight: '500' },
    countdown: { fontSize: 13, color: theme_1.THEME.danger, fontWeight: '600', marginTop: 4 },
});
// ─── FloatingReactionView ─────────────────────────────────────────────────────
function FloatingReactionView({ emoji, startX, startY }) {
    const translateY = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const opacity = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    (0, react_1.useEffect)(() => {
        react_native_1.Animated.parallel([
            react_native_1.Animated.timing(translateY, { toValue: -80, duration: 2000, useNativeDriver: true }),
            react_native_1.Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]).start();
    }, []);
    return (<react_native_1.Animated.View pointerEvents="none" style={{
            position: 'absolute',
            left: startX - 16,
            top: startY - 16,
            opacity,
            transform: [{ translateY }],
            zIndex: 30,
        }}>
      <react_native_1.Text style={{ fontSize: 28 }}>{emoji}</react_native_1.Text>
    </react_native_1.Animated.View>);
}
// ─── RoundTable ────────────────────────────────────────────────────────────────
const HAND_AREA_HEIGHT = 160;
const ACTION_ZONE_HEIGHT = 140;
const SUIT_SYMBOLS = {
    hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
};
// Pile dimensions in table coordinate space (fixed, screen-independent)
// CARD_W and CARD_H are declared above DrawPileView so drawStyles can reference them.
const PILE_GAP = 20;
const PILES_TOTAL_WIDTH = CARD_W * 2 + PILE_GAP;
const DISCARD_X = TABLE_CENTRE - PILES_TOTAL_WIDTH / 2;
const DISCARD_Y = TABLE_CENTRE - CARD_H / 2;
const DRAW_X = TABLE_CENTRE - PILES_TOTAL_WIDTH / 2 + CARD_W + PILE_GAP;
const DRAW_Y = TABLE_CENTRE - CARD_H / 2;
// Slot placement radius — keeps slots on the visible table rim
const SLOT_RADIUS = TABLE_RADIUS * 0.88; // ≈ 246
function RoundTable({ gameState, myPlayerId, onCardSelect, onPlay, onDraw, selectedCards, validPlays, isMyTurn, isDealing, dealtCardCounts, deckCountOverride, isAIThinking, onCardsActive: _onCardsActive, autoDrawCountdown, onCancelAutoDraw, timerStartedAt, currentPlayerColourHex, currentPlayerName, playerNames = {}, flashingPlayerId = null, isReconnecting = false, onReconnectTimeout, drawPileRef, discardPileRef, humanHandRef, opponentRefs, selectionDisabled = false, message, messageColourHex, hasPendingPickup, pendingPickupCount, turnDuration = 30, floatingReactions = [], onReact, viewAngle = 'bottom', }) {
    const { width: screenWidth, height: screenHeight } = (0, react_native_1.useWindowDimensions)();
    // ── Reaction picker ──────────────────────────────────────────────────────────
    const [showReactionPicker, setShowReactionPicker] = (0, react_1.useState)(false);
    if (!gameState || !gameState.players) {
        return (<react_native_1.View style={tableStyles.root}>
        <react_native_1.View style={tableStyles.connecting}>
          <react_native_1.Text style={tableStyles.connectingText}>Connecting…</react_native_1.Text>
        </react_native_1.View>
      </react_native_1.View>);
    }
    const { players, discard, activeSuit } = gameState;
    const displayDeckCount = deckCountOverride != null ? deckCountOverride : gameState.deck.length;
    const myPlayer = players.find((p) => p.id === myPlayerId);
    const myIndex = players.findIndex((p) => p.id === myPlayerId);
    // ── Screen geometry — where the table wrapper sits on screen ─────────────────
    const isSmallScreen = screenWidth < 768;
    // Table appears at 88% screen width on mobile, or 70% of viewport on desktop
    const tableScreenSize = isSmallScreen
        ? screenWidth * 0.88
        : Math.min(screenWidth * 0.7, screenHeight * 0.7);
    // Scale factor: maps 600-unit table space to screen pixels
    const tableScale = tableScreenSize / TABLE_SIZE;
    // Where the perspective wrapper is positioned on screen
    const tableScreenX = (screenWidth - tableScreenSize) / 2;
    const tableScreenY = isSmallScreen
        ? screenHeight * 0.12 // 12% from top on mobile — leaves room for hand
        : (screenHeight - tableScreenSize) / 2;
    // Layer 1 is 600×600, scaled by tableScale.
    // Transform is around center (300, 300), so to visually align top-left
    // of the scaled content with the wrapper's (0,0), we shift:
    //   left = top = 300 * (tableScale - 1)
    const layer1Offset = 300 * (tableScale - 1);
    // The perspective transform — varies by viewAngle prop
    const perspectiveTransform = getPerspectiveTransform(viewAngle);
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
    const showPreAction = isMyTurn && !hasActed && !isAIThinking && !isDealing &&
        gameState.phase !== 'declare-suit';
    // ── tableToScreen: approximate screen coords for Layer 3 overlays ────────────
    // Ignores perspective distortion (acceptable for floating effects).
    const tableToScreen = (tx, ty) => ({
        x: tableScreenX + tx * tableScale,
        y: tableScreenY + ty * tableScale,
    });
    return (<react_native_1.View style={tableStyles.root}>

      {/* ═══════════════════════════════════════════════════════════════════════
            Layer 2 — Perspective wrapper
            Positioned on screen at tableScreenX/tableScreenY.
            Applies the tilt. Contains Layer 1 only.
            ═══════════════════════════════════════════════════════════════════════ */}
      <react_native_1.View style={{
            position: 'absolute',
            left: tableScreenX,
            top: tableScreenY,
            width: tableScreenSize,
            height: tableScreenSize,
            transform: perspectiveTransform,
            // Web: ensure transform rotates around center
            ...(typeof window !== 'undefined' ? { transformOrigin: 'center center' } : {}),
            overflow: 'visible',
        }} pointerEvents="box-none">

        {/* ═══════════════════════════════════════════════════════════════════
            Layer 1 — Table content
            600×600 unit coordinate space. Scale applied here so all content
            uses fixed table coordinates regardless of screen size.
            ═══════════════════════════════════════════════════════════════════ */}
        <react_native_1.View style={{
            position: 'absolute',
            width: TABLE_SIZE,
            height: TABLE_SIZE,
            left: layer1Offset,
            top: layer1Offset,
            transform: [{ scale: tableScale }],
        }} pointerEvents="box-none">

          {/* ── Outer rim — navy with gold border ────────────────────────── */}
          <react_native_1.View style={{
            position: 'absolute',
            width: TABLE_RADIUS * 2 + 24,
            height: TABLE_RADIUS * 2 + 24,
            borderRadius: TABLE_RADIUS + 12,
            backgroundColor: theme_1.THEME.tableRim,
            borderWidth: 3,
            borderColor: theme_1.THEME.gold,
            left: TABLE_CENTRE - TABLE_RADIUS - 12,
            top: TABLE_CENTRE - TABLE_RADIUS - 12,
            shadowColor: theme_1.THEME.gold,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 8,
            zIndex: 1,
        }}/>

          {/* ── Felt surface — deep green ─────────────────────────────────── */}
          <react_native_1.View style={{
            position: 'absolute',
            width: TABLE_RADIUS * 2,
            height: TABLE_RADIUS * 2,
            borderRadius: TABLE_RADIUS,
            backgroundColor: theme_1.THEME.tableFelt,
            left: TABLE_CENTRE - TABLE_RADIUS,
            top: TABLE_CENTRE - TABLE_RADIUS,
            zIndex: 2,
        }}/>

          {/* ── Felt crosshatch texture at 6% opacity ────────────────────── */}
          <react_native_1.View style={{
            position: 'absolute',
            width: TABLE_RADIUS * 2,
            height: TABLE_RADIUS * 2,
            borderRadius: TABLE_RADIUS,
            overflow: 'hidden',
            left: TABLE_CENTRE - TABLE_RADIUS,
            top: TABLE_CENTRE - TABLE_RADIUS,
            opacity: 0.06,
            zIndex: 3,
        }} pointerEvents="none">
            {Array.from({ length: 40 }).map((_, i) => (<react_native_1.View key={`h${i}`} style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: i * (TABLE_RADIUS * 2 / 40),
                height: 0.5,
                backgroundColor: '#ffffff',
            }}/>))}
            {Array.from({ length: 40 }).map((_, i) => (<react_native_1.View key={`v${i}`} style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: i * (TABLE_RADIUS * 2 / 40),
                width: 0.5,
                backgroundColor: '#ffffff',
            }}/>))}
          </react_native_1.View>

          {/* ── Scene zones — disabled, Three.js version coming ────────── */}
          {/* players.map((player, idx) => {
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
        }) */}

          {/* ── Message — upper-left of felt, above piles ────────────────── */}
          {!!message && (<react_native_1.View style={{
                position: 'absolute',
                left: TABLE_CENTRE - TABLE_RADIUS * 0.75,
                top: TABLE_CENTRE - TABLE_RADIUS * 0.55,
                maxWidth: TABLE_RADIUS * 0.9,
                zIndex: 10,
            }} pointerEvents="none">
              <react_native_1.View style={tableStyles.messageBox}>
                <react_native_1.Text style={[
                tableStyles.messageText,
                messageColourHex ? { color: messageColourHex } : undefined,
            ]} numberOfLines={2}>
                  {message}
                </react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>)}

          {/* ── Discard pile — left of centre ────────────────────────────── */}
          <react_native_1.View ref={discardPileRef} style={{
            position: 'absolute',
            left: DISCARD_X,
            top: DISCARD_Y,
            zIndex: 5,
        }}>
            <DiscardPile_1.DiscardPile discard={discard} activeSuit={activeSuit}/>
          </react_native_1.View>

          {/* ── Draw pile — right of centre ──────────────────────────────── */}
          <react_native_1.View ref={drawPileRef} style={{
            position: 'absolute',
            left: DRAW_X,
            top: DRAW_Y,
            alignItems: 'center',
            zIndex: 5,
        }}>
            <DrawPileView count={displayDeckCount} onPress={showPreAction && !selectedCards.length ? onDraw : undefined}/>
          </react_native_1.View>

          {/* ── Active suit indicator — between the two piles ────────────── */}
          {activeSuit && activeSuitSymbol && (<react_native_1.View style={{
                position: 'absolute',
                left: TABLE_CENTRE - 15,
                top: TABLE_CENTRE - 55,
                zIndex: 8,
            }} pointerEvents="none">
              <react_native_1.View style={tableStyles.suitIndicator}>
                <react_native_1.Text style={[
                tableStyles.suitSymbol,
                { color: activeSuitIsRed ? theme_1.THEME.cardRed : theme_1.THEME.textPrimary },
            ]}>
                  {activeSuitSymbol}
                </react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>)}

          {/* ── Opponent slots around the rim ────────────────────────────── */}
          {opponentList.map(({ player, angle }) => {
            const pos = getTablePos(angle, SLOT_RADIUS);
            const isCurrentTurn = players[gameState.currentPlayerIndex]?.id === player.id;
            const vCount = dealtCardCounts ? (dealtCardCounts[player.id] ?? 0) : undefined;
            const name = playerNames[player.id] ?? player.id.slice(0, 8);
            return (<react_native_1.View key={player.id} ref={(r) => {
                    if (opponentRefs)
                        opponentRefs.current[player.id] = r;
                }} style={{
                    position: 'absolute',
                    left: pos.x - 38,
                    top: pos.y - 55,
                    zIndex: 6,
                }}>
                <OpponentSlotView playerId={player.id} hand={player.hand} name={name} isCurrentTurn={isCurrentTurn} hasOnCardsDeclaration={gameState.onCardsDeclarations.includes(player.id)} colourHex={player.colourHex ?? theme_1.THEME.info} avatarId={player.avatarId ?? 'avatar_01'} visibleCardCount={vCount} isFlashing={flashingPlayerId === player.id}/>
              </react_native_1.View>);
        })}

          {/* ── Human avatar — bottom rim of table ───────────────────────── */}
          {myPlayer && (<react_native_1.View style={{
                position: 'absolute',
                left: TABLE_CENTRE - 36,
                top: TABLE_CENTRE + SLOT_RADIUS - 28,
                width: 72,
                alignItems: 'center',
                zIndex: 6,
            }} pointerEvents="none">
              <Avatar_1.default avatarId={myPlayer.avatarId ?? 'avatar_01'} size={32} colourHex={myPlayer.colourHex ?? theme_1.THEME.info} showRing={isMyTurn}/>
              <react_native_1.Text style={[tableStyles.youLabel, { color: myPlayer.colourHex ?? theme_1.THEME.info }]}>
                You
              </react_native_1.Text>
            </react_native_1.View>)}

        </react_native_1.View>
        {/* End Layer 1 */}

      </react_native_1.View>
      {/* End Layer 2 */}

      {/* ═════════���═════════════════════════════════════════════════════════════
            Layer 3 — Flat UI overlay
            All elements here use screen coordinates. Never affected by tilt.
            ═══════════════════════════════════════════════════════════════════════ */}

      {/* ── Human hand fan — above the action zone ──────────────────────────── */}
      <react_native_1.View ref={humanHandRef} style={[
            tableStyles.handArea,
            {
                height: isSmallScreen ? 140 : HAND_AREA_HEIGHT,
                bottom: isSmallScreen ? 100 : ACTION_ZONE_HEIGHT,
            },
        ]}>
        {myPlayer && (<Hand_1.Hand cards={myPlayer.hand} validPlays={validPlays} selectedCards={selectedCards} onCardSelect={selectionDisabled ? undefined : onCardSelect} isMyTurn={isMyTurn && !isDealing} visibleCardCount={dealtCardCounts ? (dealtCardCounts[myPlayerId] ?? 0) : undefined}/>)}
      </react_native_1.View>

      {/* ── Bottom action zone (timer + buttons) ────────────────────────────── */}
      <react_native_1.View style={tableStyles.actionZone}>
        <TurnTimer_1.TurnTimer timerStartedAt={timerStartedAt} turnDuration={turnDuration} currentPlayerColourHex={currentPlayerColourHex} isMyTurn={isMyTurn && !isDealing && !isAIThinking} currentPlayerName={currentPlayerName}/>
        {showPreAction && (<react_native_1.View style={tableStyles.actionBtnRow}>
            {selectedCards.length > 0 && (<react_native_1.TouchableOpacity style={tableStyles.playBtn} onPress={onPlay}>
                <react_native_1.Text style={tableStyles.playBtnText}>
                  Play{selectedCards.length > 1 ? ` (${selectedCards.length})` : ''}
                </react_native_1.Text>
              </react_native_1.TouchableOpacity>)}
            <react_native_1.TouchableOpacity style={[tableStyles.drawBtn, selectedCards.length > 0 && tableStyles.drawBtnNarrow]} onPress={onDraw} disabled={!isMyTurn}>
              <react_native_1.Text style={tableStyles.drawBtnText}>
                {hasPendingPickup ? `Pick up ${pendingPickupCount}` : 'Pick up'}
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>)}
      </react_native_1.View>

      {/* ── Auto-draw countdown overlay ─────────────────────────────────────── */}
      {autoDrawCountdown !== null && gameState && (<react_native_1.View style={tableStyles.autoDrawOverlay}>
          <react_native_1.View style={tableStyles.autoDrawCard}>
            <react_native_1.Text style={tableStyles.autoDrawTitle}>No counter available</react_native_1.Text>
            <react_native_1.Text style={tableStyles.autoDrawSub}>
              Picking up {pendingPickupCount} card{pendingPickupCount !== 1 ? 's' : ''} in {autoDrawCountdown}…
            </react_native_1.Text>
            <react_native_1.TouchableOpacity style={tableStyles.autoDrawCancelBtn} onPress={onCancelAutoDraw}>
              <react_native_1.Text style={tableStyles.autoDrawCancelText}>Cancel — draw manually</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
        </react_native_1.View>)}

      {/* ── Reconnection overlay ─────────────────────────────────────────────── */}
      {isReconnecting && (<ReconnectionOverlay onTimeout={onReconnectTimeout}/>)}

      {/* ── Floating reactions — screen-space positions ──────────────────────── */}
      {floatingReactions.map((r) => {
            const playerIdx = players.findIndex((p) => p.id === r.playerId);
            const angle = playerAngles[playerIdx] ?? 90;
            const tablePos = getTablePos(angle, SLOT_RADIUS);
            const screenPos = tableToScreen(tablePos.x, tablePos.y);
            return (<FloatingReactionView key={r.id} emoji={r.emoji} startX={screenPos.x} startY={screenPos.y}/>);
        })}

      {/* ── Reaction button — near human player slot ─────────────────────────── */}
      {onReact && (() => {
            // Human is at angle=90° (bottom). Convert to screen coords.
            const humanTablePos = getTablePos(90, SLOT_RADIUS);
            const humanScreen = tableToScreen(humanTablePos.x, humanTablePos.y);
            return (<react_native_1.View style={{
                    position: 'absolute',
                    left: humanScreen.x + 44,
                    top: humanScreen.y - 18,
                    zIndex: 20,
                }}>
            {showReactionPicker ? (<react_native_1.View style={reactionStyles.picker}>
                {REACTIONS.map((rx) => (<react_native_1.TouchableOpacity key={rx.id} style={reactionStyles.reactionOption} onPress={() => {
                            onReact(rx.id);
                            setShowReactionPicker(false);
                        }}>
                    <react_native_1.Text style={reactionStyles.reactionEmoji}>{rx.emoji}</react_native_1.Text>
                  </react_native_1.TouchableOpacity>))}
                <react_native_1.TouchableOpacity style={reactionStyles.reactionOption} onPress={() => setShowReactionPicker(false)}>
                  <react_native_1.Text style={reactionStyles.reactionClose}>✕</react_native_1.Text>
                </react_native_1.TouchableOpacity>
              </react_native_1.View>) : (<react_native_1.TouchableOpacity style={reactionStyles.btn} onPress={() => setShowReactionPicker(true)}>
                <react_native_1.Text style={reactionStyles.btnText}>😊</react_native_1.Text>
              </react_native_1.TouchableOpacity>)}
          </react_native_1.View>);
        })()}

    </react_native_1.View>);
}
// ─── Styles ───────────────────────────────────────────────────────────────────
const tableStyles = react_native_1.StyleSheet.create({
    root: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: theme_1.THEME.appBackground,
    },
    connecting: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    connectingText: {
        color: theme_1.THEME.textSecondary,
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
        color: theme_1.THEME.textPrimary,
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
        borderColor: theme_1.THEME.gold,
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
        borderColor: theme_1.THEME.gold,
    },
    drawBtnNarrow: {
        flex: 0.6,
    },
    drawBtnText: {
        color: theme_1.THEME.gold,
        fontSize: 16,
        fontWeight: '500',
    },
    playBtn: {
        flex: 1,
        backgroundColor: theme_1.THEME.gold,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    playBtnText: {
        color: theme_1.THEME.appBackground,
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
        ...react_native_1.StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.65)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 55,
    },
    autoDrawCard: {
        backgroundColor: theme_1.THEME.cardBackground,
        borderRadius: 16,
        paddingHorizontal: 28,
        paddingVertical: 24,
        alignItems: 'center',
        gap: 10,
        minWidth: 240,
        borderWidth: 1,
        borderColor: theme_1.THEME.gold,
    },
    autoDrawTitle: {
        color: theme_1.THEME.textPrimary,
        fontSize: 16,
        fontWeight: '800',
    },
    autoDrawSub: {
        color: theme_1.THEME.textSecondary,
        fontSize: 14,
        textAlign: 'center',
    },
    autoDrawCancelBtn: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme_1.THEME.gold,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginTop: 4,
    },
    autoDrawCancelText: {
        color: theme_1.THEME.gold,
        fontSize: 13,
        fontWeight: '600',
    },
});
const reactionStyles = react_native_1.StyleSheet.create({
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
        color: theme_1.THEME.textMuted,
        fontWeight: '700',
    },
});
//# sourceMappingURL=RoundTable.js.map