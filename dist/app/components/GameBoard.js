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
exports.GameBoard = GameBoard;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const Card_1 = require("./Card");
const Hand_1 = require("./Hand");
const DiscardPile_1 = require("./DiscardPile");
const Avatar_1 = __importDefault(require("./Avatar"));
function OpponentSlot({ hand, name, isCurrentTurn, hasOnCardsDeclaration, strikes, isFlashing = false, visibleCardCount, colourHex, avatarId, }) {
    const liftAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const loopRef = (0, react_1.useRef)(null);
    // Timeout flash: red opacity pulse, 2 cycles, 400ms each
    const flashAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const flashLoopRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (isFlashing) {
            flashLoopRef.current?.stop();
            flashAnim.setValue(0);
            const flash = react_native_1.Animated.sequence([
                react_native_1.Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
                react_native_1.Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
                react_native_1.Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
                react_native_1.Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
            ]);
            flashLoopRef.current = flash;
            flash.start();
        }
        else {
            flashLoopRef.current?.stop();
            flashAnim.setValue(0);
        }
        return () => { flashLoopRef.current?.stop(); };
    }, [isFlashing]);
    const flashBorderColor = flashAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['transparent', '#ef5350'],
    });
    const flashBg = flashAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['transparent', 'rgba(239,83,80,0.18)'],
    });
    (0, react_1.useEffect)(() => {
        if (isCurrentTurn && hand.length > 0) {
            const loop = react_native_1.Animated.loop(react_native_1.Animated.sequence([
                react_native_1.Animated.delay(800),
                react_native_1.Animated.timing(liftAnim, { toValue: -8, duration: 350, useNativeDriver: false }),
                react_native_1.Animated.timing(liftAnim, { toValue: 0, duration: 350, useNativeDriver: false }),
                react_native_1.Animated.delay(1300),
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
    const displayCount = Math.min(effectiveCount, 5);
    const midIndex = Math.floor(displayCount / 2);
    return (<react_native_1.Animated.View style={[
            styles.opponentSlot,
            isCurrentTurn && styles.opponentSlotActive,
            { borderColor: isFlashing ? flashBorderColor : (isCurrentTurn ? '#ffc107' : 'transparent'), backgroundColor: isFlashing ? flashBg : undefined },
        ]}>
      <Avatar_1.default avatarId={avatarId ?? 'avatar_01'} size={44} colourHex={colourHex ?? '#378ADD'} showRing={isCurrentTurn}/>
      <react_native_1.View style={styles.opponentNameRow}>
        {strikes >= 1 && (<react_native_1.View style={styles.strikeIcon}>
            <react_native_1.Text style={styles.strikeIconText}>!</react_native_1.Text>
          </react_native_1.View>)}
        <react_native_1.Text style={[styles.opponentName, colourHex ? { color: colourHex } : undefined]} numberOfLines={1}>
          {name}
        </react_native_1.Text>
      </react_native_1.View>

      {hasOnCardsDeclaration && (<react_native_1.Text style={styles.onCardsLabel}>On cards!</react_native_1.Text>)}

      <react_native_1.View style={styles.opponentCardRow}>
        {hand.length === 0 ? (<react_native_1.Text style={styles.emptyHand}>Empty</react_native_1.Text>) : (Array.from({ length: displayCount }).map((_, i) => (<react_native_1.Animated.View key={i} style={[
                styles.faceDownSlot,
                i > 0 && { marginLeft: -22 },
                i === midIndex && isCurrentTurn && { transform: [{ translateY: liftAnim }] },
                { zIndex: i },
            ]}>
              <Card_1.Card card={hand[i] ?? { rank: 'A', suit: 'spades' }} faceDown/>
            </react_native_1.Animated.View>)))}
      </react_native_1.View>

      <react_native_1.View style={[styles.cardCountBadge, colourHex ? { backgroundColor: colourHex + '99' } : undefined]}>
        <react_native_1.Text style={styles.cardCountText}>{effectiveCount}</react_native_1.Text>
      </react_native_1.View>
    </react_native_1.Animated.View>);
}
// ─── DrawPileView ─────────────────────────────────────────────────────────────
function DrawPileView({ count }) {
    return (<react_native_1.View style={styles.pileOuter}>
      {count > 2 && (<react_native_1.View style={[styles.stackBehind, { bottom: -5, left: -5, transform: [{ rotate: '3deg' }] }]}/>)}
      {count > 1 && (<react_native_1.View style={[styles.stackBehind, { bottom: -2.5, left: -2.5, transform: [{ rotate: '1.5deg' }] }]}/>)}
      <Card_1.Card card={{ rank: 'A', suit: 'spades' }} faceDown/>
      <react_native_1.View style={styles.deckCountBadge}>
        <react_native_1.Text style={styles.deckCountText}>{count}</react_native_1.Text>
      </react_native_1.View>
    </react_native_1.View>);
}
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
    return (<react_native_1.View style={overlayStyles.backdrop}>
      <react_native_1.View style={overlayStyles.card}>
        <react_native_1.Text style={overlayStyles.title}>Connection lost</react_native_1.Text>
        <react_native_1.Text style={overlayStyles.subtitle}>Reconnecting{dots}</react_native_1.Text>
        <react_native_1.Text style={overlayStyles.countdown}>
          You will be removed in {seconds}s
        </react_native_1.Text>
      </react_native_1.View>
    </react_native_1.View>);
}
// ─── GameBoard ────────────────────────────────────────────────────────────────
function GameBoard({ gameState, myPlayerId, validPlays, selectedCards, onCardSelect, onClearSelection, isMyTurn, selectionDisabled, playerNames = {}, message, flashingPlayerId = null, isDealing = false, dealtCardCounts, deckCountOverride, drawPileRef, discardPileRef, humanHandRef, opponentRefs, isReconnecting = false, onReconnectTimeout, messageColourHex, }) {
    if (!gameState || !gameState.players) {
        return (<react_native_1.View style={styles.board}>
        <react_native_1.View style={styles.connectingContainer}>
          <react_native_1.Text style={styles.connectingText}>Connecting…</react_native_1.Text>
        </react_native_1.View>
      </react_native_1.View>);
    }
    const { players, discard, deck, currentPlayerIndex, activeSuit } = gameState;
    const displayDeckCount = deckCountOverride != null ? deckCountOverride : deck.length;
    const myPlayer = players.find((p) => p.id === myPlayerId);
    const opponents = players.filter((p) => p.id !== myPlayerId);
    const currentPlayer = players[currentPlayerIndex];
    const handleCardSelect = selectionDisabled ? undefined : onCardSelect;
    return (<react_native_1.View style={styles.board}>
      {/* ── Opponents ─────────────────────────────────────────────────── */}
      <react_native_1.View style={styles.opponentsRow}>
        {opponents.map((opp) => (<react_native_1.View key={opp.id} style={styles.opponentRefWrapper} ref={(r) => {
                if (opponentRefs)
                    opponentRefs.current[opp.id] = r;
            }}>
            <OpponentSlot playerId={opp.id} hand={opp.hand} name={playerNames[opp.id] ?? opp.id.slice(0, 8)} isCurrentTurn={opp.id === currentPlayer?.id} hasOnCardsDeclaration={gameState.onCardsDeclarations.includes(opp.id)} strikes={gameState.timeoutStrikes[opp.id] ?? 0} isFlashing={flashingPlayerId === opp.id} visibleCardCount={dealtCardCounts ? (dealtCardCounts[opp.id] ?? 0) : undefined} colourHex={opp.colourHex} avatarId={opp.avatarId}/>
          </react_native_1.View>))}
      </react_native_1.View>

      {/* ── Centre table ──────────────────────────────────────────────── */}
      <react_native_1.View style={styles.centre}>
        <react_native_1.View style={styles.pileGroup} ref={drawPileRef}>
          <DrawPileView count={displayDeckCount}/>
          <react_native_1.Text style={styles.pileLabel}>Draw</react_native_1.Text>
        </react_native_1.View>

        {/* Message column */}
        <react_native_1.View style={styles.centreInfo}>
          {message ? (<react_native_1.View style={styles.messageBox}>
              <react_native_1.Text style={[styles.messageText, messageColourHex ? { color: messageColourHex } : undefined]}>
                {message}
              </react_native_1.Text>
            </react_native_1.View>) : null}
        </react_native_1.View>

        {/* Discard pile — loose stack effect + active suit pill built in */}
        <react_native_1.View style={styles.pileGroup} ref={discardPileRef}>
          <react_native_1.View style={styles.pileOuter}>
            <DiscardPile_1.DiscardPile discard={discard} activeSuit={activeSuit}/>
          </react_native_1.View>
          <react_native_1.Text style={styles.pileLabel}>Discard</react_native_1.Text>
        </react_native_1.View>
      </react_native_1.View>

      {/* ── My area ───────────────────────────────────────────────────── */}
      <react_native_1.View style={styles.myArea}>
        {isMyTurn && (<react_native_1.View style={styles.yourTurnBanner}>
            <react_native_1.Text style={styles.yourTurnText}>Your turn</react_native_1.Text>
          </react_native_1.View>)}
        {myPlayer ? (<react_native_1.View ref={humanHandRef}>
            <Hand_1.Hand cards={myPlayer.hand} validPlays={validPlays} selectedCards={selectedCards} onCardSelect={handleCardSelect ? (c) => handleCardSelect(c) : undefined} onClearSelection={onClearSelection} isMyTurn={isMyTurn && !isDealing} visibleCardCount={dealtCardCounts ? (dealtCardCounts[myPlayerId] ?? 0) : undefined}/>
          </react_native_1.View>) : null}
      </react_native_1.View>

      {/* ── Reconnection overlay ──────────────────────────────────────── */}
      {isReconnecting && (<ReconnectionOverlay onTimeout={onReconnectTimeout}/>)}
    </react_native_1.View>);
}
// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = react_native_1.StyleSheet.create({
    board: {
        flex: 1,
        backgroundColor: '#35654d',
    },
    connectingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    connectingText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        fontWeight: '500',
    },
    // Opponents
    opponentsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        paddingTop: 10,
        paddingBottom: 6,
        minHeight: 130,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.2)',
    },
    opponentRefWrapper: {
        flex: 1,
        maxWidth: 180,
    },
    opponentSlot: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 6,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 4,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    opponentSlotActive: {
        borderColor: '#ffc107',
        backgroundColor: 'rgba(255,193,7,0.07)',
        shadowColor: '#ffc107',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    opponentNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    strikeIcon: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#ff6d00',
        alignItems: 'center',
        justifyContent: 'center',
    },
    strikeIconText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        lineHeight: 14,
    },
    opponentName: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        opacity: 0.9,
        maxWidth: 110,
    },
    onCardsLabel: {
        color: '#ffc107',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    opponentCardRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: 4,
    },
    faceDownSlot: {},
    emptyHand: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 12,
        fontStyle: 'italic',
    },
    cardCountBadge: {
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginTop: 4,
    },
    cardCountText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    // Centre
    centre: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        paddingVertical: 12,
    },
    pileGroup: {
        alignItems: 'center',
        gap: 8,
    },
    pileLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    centreInfo: {
        alignItems: 'center',
        minWidth: 80,
    },
    messageBox: {
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        maxWidth: 140,
    },
    messageText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    // Piles
    pileOuter: {
        position: 'relative',
    },
    stackBehind: {
        position: 'absolute',
        width: 70,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#e8e0d0',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    deckCountBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#1b5e20',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 1.5,
        borderColor: '#fff',
        minWidth: 22,
        alignItems: 'center',
    },
    deckCountText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    // My area
    myArea: {
        minHeight: 170,
        paddingBottom: 4,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.2)',
    },
    yourTurnBanner: {
        alignSelf: 'center',
        backgroundColor: 'rgba(76,175,80,0.18)',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 4,
        marginTop: 6,
        borderWidth: 1,
        borderColor: 'rgba(76,175,80,0.4)',
    },
    yourTurnText: {
        color: '#a5d6a7',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});
const overlayStyles = react_native_1.StyleSheet.create({
    backdrop: {
        ...react_native_1.StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 32,
        paddingVertical: 28,
        alignItems: 'center',
        gap: 10,
        minWidth: 240,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#212121',
    },
    subtitle: {
        fontSize: 15,
        color: '#616161',
        fontWeight: '500',
    },
    countdown: {
        fontSize: 13,
        color: '#ef5350',
        fontWeight: '600',
        marginTop: 4,
    },
});
//# sourceMappingURL=GameBoard.js.map