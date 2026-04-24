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
exports.default = GameScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const expo_router_1 = require("expo-router");
const useSocket_1 = require("../hooks/useSocket");
const useLocalGame_1 = require("../hooks/useLocalGame");
const gameStore_1 = require("../store/gameStore");
const RoundTable_1 = require("../components/RoundTable");
const SuitPicker_1 = require("../components/SuitPicker");
const Toast_1 = require("../components/Toast");
const AnimationOverlay_1 = require("../components/AnimationOverlay");
const useSounds_1 = require("../hooks/useSounds");
const useHaptics_1 = require("../hooks/useHaptics");
const HowToPlayModal_1 = require("../components/HowToPlayModal");
const LastMoveBanner_1 = require("../components/LastMoveBanner");
const theme_1 = require("../utils/theme");
const animations_1 = require("../utils/animations");
const measurePosition_1 = require("../utils/measurePosition");
const ai_1 = require("../../engine/ai");
const validation_1 = require("../../engine/validation");
const AuthContext_1 = require("../context/AuthContext");
const recordGameStats_1 = require("../lib/recordGameStats");
// ─── Reaction emoji lookup ────────────────────────────────────────────────────
const REACTION_MAP = {
    fire: '🔥',
    cold: '❄️',
    eyes: '👀',
    clap: '👏',
};
// ─── Power card ranks ─────────────────────────────────────────────────────────
const POWER_RANKS = new Set(['A', '2', '8', 'J', 'Q', 'K']);
function isPowerCard(card) {
    return POWER_RANKS.has(card.rank);
}
// ─── Deal timing by player count ─────────────────────────────────────────────
function dealIntervalMs(playerCount) {
    if (playerCount <= 2)
        return 350;
    if (playerCount === 3)
        return 280;
    return 220; // 4 players
}
// ─── GameScreen ───────────────────────────────────────────────────────────────
function GameScreen() {
    const router = (0, expo_router_1.useRouter)();
    const params = (0, expo_router_1.useLocalSearchParams)();
    const isLocalMode = params.mode === 'local';
    const { width: screenWidth, height: screenHeight } = (0, react_native_1.useWindowDimensions)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    // ── Audio / haptics ───────────────────────────────────────────────────────
    const { playSound, isMuted, toggleMute } = (0, useSounds_1.useSounds)();
    const { trigger: haptic } = (0, useHaptics_1.useHaptics)();
    // ── Online hook (always mounted) ──────────────────────────────────────────
    const { playCards: socketPlayCards, drawCard: socketDrawCard, declareSuit: socketDeclareSuit, declareOnCards: socketDeclareOnCards, endTurn: socketEndTurn, connectionState, } = (0, useSocket_1.useSocket)();
    const { gameState: onlineGameState, myPlayerId: onlineMyPlayerId, selectedCards, selectCard, deselectCard, clearSelection, pendingTimeoutNotification, pendingReaction, roomInfo, } = (0, gameStore_1.useGameStore)();
    // ── Local AI hook (always mounted) ────────────────────────────────────────
    const { gameState: localGameState, myPlayerId: localMyPlayerId, isAIThinking, playerNames: localPlayerNames, turnStartedAt: localTurnStartedAt, turnDurationRef: localTurnDurationRef, startLocalGame, humanPlay, humanDraw, humanEndTurn, humanDeclareOnCards, humanApplyTimeout, adjustTurnStartedAt, lastAIPlayCardsRef, localGameStateRef, } = (0, useLocalGame_1.useLocalGame)();
    // Pick active game data based on mode
    const gameState = isLocalMode ? localGameState : onlineGameState;
    const myPlayerId = isLocalMode ? localMyPlayerId : onlineMyPlayerId;
    const [showSuitPicker, setShowSuitPicker] = (0, react_1.useState)(false);
    const [toasts, setToasts] = (0, react_1.useState)([]);
    const toastIdRef = (0, react_1.useRef)(0);
    // ── Deal animation state ──────────────────────────────────────────────────
    const [isDealing, setIsDealing] = (0, react_1.useState)(false);
    const [dealtCardCounts, setDealtCardCounts] = (0, react_1.useState)(null);
    // Tracks the visual deck count shrinking as cards are dealt
    const [deckCountOverride, setDeckCountOverride] = (0, react_1.useState)(null);
    // Cancel token: incremented on skip to abort the async deal loop
    const dealGenRef = (0, react_1.useRef)(0);
    const dealStartedRef = (0, react_1.useRef)(false);
    // ── Animation overlay ref ─────────────────────────────────────────────────
    const overlayRef = (0, react_1.useRef)(null);
    // ── Pixel-accurate layout refs ────────────────────────────────────────────
    const drawPileRef = (0, react_1.useRef)(null);
    const discardPileRef = (0, react_1.useRef)(null);
    const humanHandRef = (0, react_1.useRef)(null);
    const opponentRefs = (0, react_1.useRef)({});
    // ── Latest game state ref — always current, never a stale closure ────────
    // Used by declaration handlers so they never read pre-play React state.
    const gameStateRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        gameStateRef.current = gameState;
    }, [gameState]);
    // ── Flashing player (timeout animation) ──────────────────────────────────
    const [flashingPlayerId, setFlashingPlayerId] = (0, react_1.useState)(null);
    // ── How to play modal ─────────────────────────────────────────────────────
    const [showHowToPlay, setShowHowToPlay] = (0, react_1.useState)(false);
    const modalOpenedAtRef = (0, react_1.useRef)(null);
    // ── Menu sheet ────────────────────────────────────────────────────────────
    const [showMenu, setShowMenu] = (0, react_1.useState)(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = (0, react_1.useState)(false);
    // ── Last move (most recent completed move) ────────────────────────────────
    const [lastMove, setLastMove] = (0, react_1.useState)(null);
    // Human play cards captured in submission order before clearSelection()
    const lastHumanPlayCardsRef = (0, react_1.useRef)([]);
    // ── Floating reactions ────────────────────────────────────────────────────
    const [floatingReactions, setFloatingReactions] = (0, react_1.useState)([]);
    // ── Auth context (for stats recording) ────────────────────────────────────
    const { profile, isGuest } = (0, AuthContext_1.useAuth)();
    // ── Game stats tracking ────────────────────────────────────────────────────
    const gameStatsRef = (0, react_1.useRef)({
        turnsPlayed: 0,
        maxCardsHeld: 0,
        cardsDrawn: 0,
        biggestPickup: 0,
        blackJacksReceived: 0,
        blackJacksCountered: 0,
        twosStacked: 0,
        twosReceived: 0,
        falseOnCardsCount: 0,
        correctOnCardsCount: 0,
        timedOutCount: 0,
        wasKicked: false,
        lastSuitWonWith: undefined,
    });
    // ── On-cards declaration window ────────────────────────────────────────────
    const [showOnCardsWindow, setShowOnCardsWindow] = (0, react_1.useState)(false);
    const [onCardsCountdown, setOnCardsCountdown] = (0, react_1.useState)(3);
    const onCardsTimerRef = (0, react_1.useRef)(null);
    const onCardsIntervalRef = (0, react_1.useRef)(null);
    // Ref always points to the latest render's startOnCardsWindow so setTimeout
    // callbacks don't capture a stale closure.
    const startOnCardsWindowRef = (0, react_1.useRef)(() => { });
    // ── Auto-draw countdown (Fix 3) ───────────────────────────────────────────
    const [autoDrawCountdown, setAutoDrawCountdown] = (0, react_1.useState)(null);
    const autoDrawTimerRef = (0, react_1.useRef)(null);
    // Set true when we initiate auto-draw for the current turn; prevents re-trigger
    const autoDrawInitiatedRef = (0, react_1.useRef)(false);
    // Set true if the player explicitly cancels; prevents re-trigger after cancel
    const autoDrawCancelledRef = (0, react_1.useRef)(false);
    // Set true after a draw action to trigger auto-advance in online mode
    const pendingAutoAdvanceAfterDrawRef = (0, react_1.useRef)(false);
    // ── Track previous game state for detecting mid-game changes ─────────────
    // Not updated during the deal sequence — only armed after deal completes.
    const prevGameStateRef = (0, react_1.useRef)(null);
    const prevMyHandLengthRef = (0, react_1.useRef)(0);
    const prevDiscardTopRef = (0, react_1.useRef)(null);
    const prevPendingPickupRef = (0, react_1.useRef)(0);
    // Armed once deal finishes so mid-game detections don't fire during deal
    const gameEventsArmedRef = (0, react_1.useRef)(false);
    function addToast(text) {
        const id = ++toastIdRef.current;
        setToasts((prev) => [...prev, { id, text }]);
    }
    // ── On-cards window helpers ───────────────────────────────────────────────
    function advanceTurnFn() {
        if (isLocalMode) {
            humanEndTurn();
        }
        else {
            socketEndTurn();
        }
    }
    function closeOnCardsWindow() {
        setShowOnCardsWindow(false);
        if (onCardsTimerRef.current) {
            clearTimeout(onCardsTimerRef.current);
            onCardsTimerRef.current = null;
        }
        if (onCardsIntervalRef.current) {
            clearInterval(onCardsIntervalRef.current);
            onCardsIntervalRef.current = null;
        }
    }
    function startOnCardsWindow() {
        // Always read from refs — never from the React state closure, which may be
        // stale if React hasn't re-rendered yet when this fires (e.g. 420ms setTimeout).
        const state = isLocalMode ? localGameStateRef.current : gameStateRef.current;
        if (!state)
            return;
        const current = state.players[state.currentPlayerIndex];
        const isMine = current?.id === (isLocalMode ? localMyPlayerId : onlineMyPlayerId);
        if (!isMine || !state.currentPlayerHasActed)
            return;
        if (state.phase === 'declare-suit')
            return;
        setShowOnCardsWindow(true);
        setOnCardsCountdown(3);
        onCardsIntervalRef.current = setInterval(() => {
            setOnCardsCountdown((prev) => Math.max(0, prev - 1));
        }, 1000);
        onCardsTimerRef.current = setTimeout(() => {
            closeOnCardsWindow();
            advanceTurnFn();
        }, 3100); // 3.1s gives the interval a final tick at 0
    }
    // Always point to the latest render so setTimeout callbacks don't go stale.
    startOnCardsWindowRef.current = startOnCardsWindow;
    // ── Auto-draw helpers ─────────────────────────────────────────────────────
    function cancelAutoDraw() {
        autoDrawCancelledRef.current = true;
        setAutoDrawCountdown(null);
        if (autoDrawTimerRef.current) {
            clearInterval(autoDrawTimerRef.current);
            autoDrawTimerRef.current = null;
        }
    }
    // ── runDealSequence ───────────────────────────────────────────────────────
    // Reveals cards one at a time, rotating through players.
    // Mutates dealtCardCounts and deckCountOverride on each step.
    const runDealSequence = (0, react_1.useCallback)(async (state) => {
        const gen = ++dealGenRef.current; // generation for cancel-on-skip
        const playerCount = state.players.length;
        const totalCards = 7;
        const interval = dealIntervalMs(playerCount);
        // Starting visual deck count = actual deck + all cards about to be dealt
        const totalToBeDealt = playerCount * totalCards;
        let visualDeckCount = state.deck.length + totalToBeDealt;
        setDeckCountOverride(visualDeckCount);
        // Initialise all counts at 0
        const initial = {};
        for (const p of state.players)
            initial[p.id] = 0;
        setDealtCardCounts({ ...initial });
        setIsDealing(true);
        // Measure pixel-accurate positions (with fallback to screen-fraction estimates)
        const fallback = (0, animations_1.getGamePositions)(screenWidth, screenHeight);
        const deckPos = await (0, measurePosition_1.measurePosition)(drawPileRef).catch(() => null);
        const handPos = await (0, measurePosition_1.measurePosition)(humanHandRef).catch(() => null);
        const deckOrigin = deckPos ? (0, measurePosition_1.centreOf)(deckPos) : fallback.deck;
        const handTarget = handPos ? (0, measurePosition_1.centreOf)(handPos) : fallback.myHand;
        // Pre-measure opponent positions
        const oppTargets = {};
        const opponents = state.players.filter((p) => p.id !== myPlayerId);
        for (let i = 0; i < opponents.length; i++) {
            const opp = opponents[i];
            const oppRef = opponentRefs.current[opp.id];
            if (oppRef) {
                const pos = await (0, measurePosition_1.measurePosition)({ current: oppRef }).catch(() => null);
                oppTargets[opp.id] = pos ? (0, measurePosition_1.centreOf)(pos) : fallback.opponent(i, opponents.length);
            }
            else {
                oppTargets[opp.id] = fallback.opponent(i, opponents.length);
            }
        }
        for (let cardNum = 1; cardNum <= totalCards; cardNum++) {
            for (let playerIdx = 0; playerIdx < playerCount; playerIdx++) {
                // Check if skipped
                if (dealGenRef.current !== gen)
                    return;
                const player = state.players[playerIdx];
                const playerId = player.id;
                const isHuman = playerId === myPlayerId;
                const toPos = isHuman
                    ? handTarget
                    : (oppTargets[playerId] ?? fallback.opponent(0, opponents.length));
                // Add flying card to overlay
                overlayRef.current?.addCards([
                    {
                        id: (0, AnimationOverlay_1.animId)(),
                        card: isHuman ? (player.hand[cardNum - 1] ?? null) : null,
                        fromX: deckOrigin.x,
                        fromY: deckOrigin.y,
                        toX: toPos.x,
                        toY: toPos.y,
                        delay: 0,
                        duration: Math.min(interval - 20, 300),
                        onComplete: undefined,
                    },
                ]);
                // Decrement visual deck
                visualDeckCount -= 1;
                setDeckCountOverride(visualDeckCount);
                // Sound + haptic when card lands in human hand
                playSound('card_deal');
                if (isHuman)
                    haptic('light');
                // Wait the interval, then reveal the card
                await new Promise((resolve) => setTimeout(resolve, interval));
                if (dealGenRef.current !== gen)
                    return;
                // Reveal this card in the player's hand
                setDealtCardCounts((prev) => {
                    if (!prev)
                        return prev;
                    return { ...prev, [playerId]: cardNum };
                });
            }
        }
        if (dealGenRef.current !== gen)
            return;
        // Deal complete — arm game-event detections and hand back control
        setIsDealing(false);
        setDealtCardCounts(null); // null = show all cards normally
        setDeckCountOverride(null); // null = show real deck count
        // Arm mid-game change detection, seeded with current state
        prevGameStateRef.current = state;
        const myPlayer = state.players.find((p) => p.id === myPlayerId);
        prevMyHandLengthRef.current = myPlayer?.hand.length ?? 0;
        const discardTop = state.discard[state.discard.length - 1];
        prevDiscardTopRef.current = discardTop ? `${discardTop.rank}-${discardTop.suit}` : null;
        prevPendingPickupRef.current = state.pendingPickup;
        gameEventsArmedRef.current = true;
    }, [myPlayerId, screenWidth, screenHeight, drawPileRef, humanHandRef, opponentRefs]);
    // ── handleSkipDeal ────────────────────────────────────────────────────────
    function handleSkipDeal() {
        if (!gameState)
            return;
        // Increment gen to abort the async loop on its next await
        dealGenRef.current++;
        overlayRef.current?.clearAll();
        // Reveal all cards immediately
        const full = {};
        for (const p of gameState.players)
            full[p.id] = p.hand.length;
        setDealtCardCounts(null);
        setDeckCountOverride(null);
        setIsDealing(false);
        // Arm mid-game events
        const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
        prevGameStateRef.current = gameState;
        prevMyHandLengthRef.current = myPlayer?.hand.length ?? 0;
        const discardTop = gameState.discard[gameState.discard.length - 1];
        prevDiscardTopRef.current = discardTop ? `${discardTop.rank}-${discardTop.suit}` : null;
        prevPendingPickupRef.current = gameState.pendingPickup;
        gameEventsArmedRef.current = true;
    }
    // ── Start local game on mount ─────────────────────────────────────────────
    const localGameStartedRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        if (isLocalMode && !localGameStartedRef.current) {
            localGameStartedRef.current = true;
            const name = params.playerName ?? 'Player';
            const count = parseInt(params.aiCount ?? '1', 10);
            const td = parseInt(params.turnDuration ?? '30', 10);
            startLocalGame(name, count, params.avatarId, td);
        }
    }, []);
    // ── Trigger deal sequence once when game state first arrives ──────────────
    (0, react_1.useEffect)(() => {
        if (!gameState)
            return;
        if (dealStartedRef.current)
            return;
        // Only start deal once we have a player with cards
        const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
        if (!myPlayer || myPlayer.hand.length === 0)
            return;
        dealStartedRef.current = true;
        runDealSequence(gameState);
    }, [gameState, myPlayerId, runDealSequence]);
    // ── Online: navigate to results on game-over ──────────────────────────────
    (0, react_1.useEffect)(() => {
        if (!isLocalMode && onlineGameState?.phase === 'game-over') {
            router.replace('/results');
        }
    }, [onlineGameState?.phase, isLocalMode]);
    // ── Online: toast notifications ───────────────────────────────────────────
    (0, react_1.useEffect)(() => {
        if (!pendingTimeoutNotification)
            return;
        addToast(pendingTimeoutNotification);
        gameStore_1.useGameStore.getState().setPendingTimeoutNotification(null);
    }, [pendingTimeoutNotification]);
    // ── Reactions: show floating emoji from store pending reaction ────────────
    (0, react_1.useEffect)(() => {
        if (!pendingReaction)
            return;
        const emoji = REACTION_MAP[pendingReaction.reactionId] ?? '🔥';
        const id = Date.now().toString();
        setFloatingReactions((prev) => [
            ...prev,
            { id, playerId: pendingReaction.playerId, reactionId: pendingReaction.reactionId, emoji, startTime: Date.now() },
        ]);
        gameStore_1.useGameStore.getState().setPendingReaction(null);
        setTimeout(() => setFloatingReactions((prev) => prev.filter((r) => r.id !== id)), 2500);
    }, [pendingReaction]);
    // ── Online: suit picker on declare-suit ───────────────────────────────────
    (0, react_1.useEffect)(() => {
        if (!isLocalMode &&
            gameState?.phase === 'declare-suit' &&
            gameState?.players[gameState.currentPlayerIndex]?.id === myPlayerId) {
            setShowSuitPicker(true);
        }
    }, [gameState?.phase, myPlayerId, isLocalMode]);
    // ── Mid-game change detection (opponent plays, draws, penalties, timeouts) ─
    // Only fires after deal is complete (gameEventsArmedRef.current === true).
    (0, react_1.useEffect)(() => {
        if (!gameState)
            return;
        if (!gameEventsArmedRef.current)
            return;
        const fallback = (0, animations_1.getGamePositions)(screenWidth, screenHeight);
        const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
        const opponents = gameState.players.filter((p) => p.id !== myPlayerId);
        const discardTop = gameState.discard[gameState.discard.length - 1];
        const discardKey = discardTop ? `${discardTop.rank}-${discardTop.suit}` : null;
        const myHandLength = myPlayer?.hand.length ?? 0;
        const prevHandLength = prevMyHandLengthRef.current;
        const prevPending = prevPendingPickupRef.current;
        const currPending = gameState.pendingPickup;
        // ── Opponent plays a card ───────────────────────────────────────────────
        if (prevGameStateRef.current &&
            discardKey !== prevDiscardTopRef.current &&
            discardKey !== null) {
            const justPlayedBy = gameState.players.find((p) => {
                const prev = prevGameStateRef.current?.players.find((pp) => pp.id === p.id);
                return prev && prev.hand.length > p.hand.length;
            });
            if (justPlayedBy && justPlayedBy.id !== myPlayerId) {
                const oppIdx = opponents.findIndex((o) => o.id === justPlayedBy.id);
                // Try measured position, fall back to screen fraction
                const oppRef = opponentRefs.current[justPlayedBy.id];
                const getOppPos = async () => {
                    if (oppRef) {
                        const pos = await (0, measurePosition_1.measurePosition)({ current: oppRef }).catch(() => null);
                        if (pos)
                            return (0, measurePosition_1.centreOf)(pos);
                    }
                    return fallback.opponent(oppIdx, opponents.length);
                };
                const getDiscardPos = async () => {
                    const pos = await (0, measurePosition_1.measurePosition)(discardPileRef).catch(() => null);
                    return pos ? (0, measurePosition_1.centreOf)(pos) : fallback.discard;
                };
                Promise.all([getOppPos(), getDiscardPos()]).then(([fromPos, toPos]) => {
                    overlayRef.current?.addCards([
                        {
                            id: (0, AnimationOverlay_1.animId)(),
                            card: null,
                            fromX: fromPos.x,
                            fromY: fromPos.y,
                            toX: toPos.x,
                            toY: toPos.y,
                            delay: 0,
                            duration: 400,
                            onComplete: undefined,
                        },
                    ]);
                });
                playSound('card_slide');
                setTimeout(() => {
                    if (discardTop && isPowerCard(discardTop)) {
                        playSound('power_card');
                    }
                    else {
                        playSound('card_flip');
                    }
                }, 420);
            }
        }
        // ── Human draws a single card ───────────────────────────────────────────
        if (prevGameStateRef.current &&
            myHandLength > prevHandLength &&
            myHandLength - prevHandLength === 1 &&
            prevPending === 0) {
            const getDeckPos = async () => {
                const pos = await (0, measurePosition_1.measurePosition)(drawPileRef).catch(() => null);
                return pos ? (0, measurePosition_1.centreOf)(pos) : fallback.deck;
            };
            const getHandPos = async () => {
                const pos = await (0, measurePosition_1.measurePosition)(humanHandRef).catch(() => null);
                return pos ? (0, measurePosition_1.centreOf)(pos) : fallback.myHand;
            };
            Promise.all([getDeckPos(), getHandPos()]).then(([fromPos, toPos]) => {
                overlayRef.current?.addCards([
                    {
                        id: (0, AnimationOverlay_1.animId)(),
                        card: myPlayer?.hand[myPlayer.hand.length - 1] ?? null,
                        fromX: fromPos.x,
                        fromY: fromPos.y,
                        toX: toPos.x,
                        toY: toPos.y,
                        delay: 0,
                        duration: 300,
                        onComplete: undefined,
                    },
                ]);
            });
            playSound('card_draw');
        }
        // ── Penalty draw ────────────────────────────────────────────────────────
        if (prevGameStateRef.current &&
            prevPending > 0 &&
            currPending === 0 &&
            myHandLength > prevHandLength) {
            const count = myHandLength - prevHandLength;
            playSound('penalty');
            haptic('warning');
            const getDeckPos = async () => {
                const pos = await (0, measurePosition_1.measurePosition)(drawPileRef).catch(() => null);
                return pos ? (0, measurePosition_1.centreOf)(pos) : fallback.deck;
            };
            const getHandPos = async () => {
                const pos = await (0, measurePosition_1.measurePosition)(humanHandRef).catch(() => null);
                return pos ? (0, measurePosition_1.centreOf)(pos) : fallback.myHand;
            };
            Promise.all([getDeckPos(), getHandPos()]).then(([fromPos, toPos]) => {
                for (let i = 0; i < count; i++) {
                    overlayRef.current?.addCards([
                        {
                            id: (0, AnimationOverlay_1.animId)(),
                            card: myPlayer?.hand[myPlayer.hand.length - count + i] ?? null,
                            fromX: fromPos.x,
                            fromY: fromPos.y,
                            toX: toPos.x + (i - Math.floor(count / 2)) * 12,
                            toY: toPos.y,
                            delay: i * 150,
                            duration: 300,
                            onComplete: undefined,
                        },
                    ]);
                    if (i > 0) {
                        setTimeout(() => playSound('card_draw'), i * 150);
                    }
                }
            });
        }
        // ── Timeout strikes ─────────────────────────────────────────────────────
        if (prevGameStateRef.current) {
            for (const player of gameState.players) {
                const prevStrikes = prevGameStateRef.current.timeoutStrikes[player.id] ?? 0;
                const currStrikes = gameState.timeoutStrikes[player.id] ?? 0;
                if (currStrikes > prevStrikes) {
                    if (player.id !== myPlayerId) {
                        setFlashingPlayerId(player.id);
                        setTimeout(() => setFlashingPlayerId(null), 1600);
                    }
                    playSound('timeout');
                    if (player.id === myPlayerId)
                        haptic('error');
                }
            }
        }
        // ── Reshuffle ───────────────────────────────────────────────────────────
        if (prevGameStateRef.current &&
            gameState.deck.length > prevGameStateRef.current.deck.length + 5) {
            playSound('shuffle');
            addToast('Reshuffling deck…');
        }
        // ── History tracking ──────────────────────────────────────────────────
        if (prevGameStateRef.current) {
            // Detect a play: discard top changed
            if (discardKey !== prevDiscardTopRef.current && discardKey !== null && discardTop) {
                const justPlayedBy = gameState.players.find((p) => {
                    const prev = prevGameStateRef.current?.players.find((pp) => pp.id === p.id);
                    return prev && prev.hand.length > p.hand.length;
                });
                if (justPlayedBy) {
                    // Use submission-order refs so the banner shows cards in play order.
                    // Human: captured in lastHumanPlayCardsRef before clearSelection().
                    // AI (local): captured in lastAIPlayCardsRef by useLocalGame.
                    // Online opponents: fall back to hand diff (no ref available).
                    let cardsPlayed;
                    if (justPlayedBy.id === myPlayerId) {
                        cardsPlayed = lastHumanPlayCardsRef.current.length > 0
                            ? lastHumanPlayCardsRef.current
                            : [discardTop];
                    }
                    else if (isLocalMode) {
                        cardsPlayed = lastAIPlayCardsRef.current.length > 0
                            ? lastAIPlayCardsRef.current
                            : [discardTop];
                    }
                    else {
                        const prevPlayer = prevGameStateRef.current?.players.find((pp) => pp.id === justPlayedBy.id);
                        cardsPlayed = prevPlayer
                            ? prevPlayer.hand.filter((c) => !justPlayedBy.hand.some((nc) => nc.rank === c.rank && nc.suit === c.suit))
                            : [discardTop];
                    }
                    const entry = {
                        playerId: justPlayedBy.id,
                        playerName: isLocalMode
                            ? (localPlayerNames[justPlayedBy.id] ?? justPlayedBy.id.slice(0, 8))
                            : justPlayedBy.id.slice(0, 8),
                        playerColour: justPlayedBy.colourHex ?? theme_1.THEME.info,
                        playerAvatarId: justPlayedBy.avatarId ?? 'avatar_01',
                        cards: cardsPlayed,
                        timestamp: Date.now(),
                        action: 'play',
                    };
                    setLastMove(entry);
                }
            }
            // Detect a draw: hand length increased and no new discard
            if (discardKey === prevDiscardTopRef.current &&
                myHandLength > prevHandLength) {
                const drawCount = myHandLength - prevHandLength;
                const entry = {
                    playerId: myPlayerId,
                    playerName: isLocalMode
                        ? (localPlayerNames[myPlayerId] ?? 'You')
                        : 'You',
                    playerColour: myPlayer?.colourHex ?? theme_1.THEME.info,
                    playerAvatarId: myPlayer?.avatarId ?? 'avatar_01',
                    cards: myPlayer?.hand.slice(-drawCount) ?? [],
                    timestamp: Date.now(),
                    action: prevPending > 0 ? 'penalty' : 'draw',
                };
                setLastMove(entry);
            }
        }
        prevGameStateRef.current = gameState;
        prevMyHandLengthRef.current = myHandLength;
        prevDiscardTopRef.current = discardKey;
        prevPendingPickupRef.current = currPending;
    }, [gameState]);
    // ── Win detection ─────────────────────────────────────────────────────────
    (0, react_1.useEffect)(() => {
        if (gameState?.phase === 'game-over' && gameState.winnerId === myPlayerId) {
            playSound('win');
            haptic('success');
        }
    }, [gameState?.phase, gameState?.winnerId]);
    // ── Stats: track turnsPlayed and maxCardsHeld ─────────────────────────────
    const prevTurnPlayerRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!gameState || !gameEventsArmedRef.current)
            return;
        const current = gameState.players[gameState.currentPlayerIndex];
        // When the current player changes away from me — that turn is done
        if (prevTurnPlayerRef.current === myPlayerId && current?.id !== myPlayerId) {
            gameStatsRef.current.turnsPlayed++;
        }
        prevTurnPlayerRef.current = current?.id ?? null;
        // Track max cards held
        const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
        if (myPlayer) {
            gameStatsRef.current.maxCardsHeld = Math.max(gameStatsRef.current.maxCardsHeld, myPlayer.hand.length);
        }
    }, [gameState?.currentPlayerIndex, gameState]);
    // ── Stats: track timeout strikes and kicks on my player ───────────────────
    const prevMyStrikesRef = (0, react_1.useRef)(0);
    (0, react_1.useEffect)(() => {
        if (!gameState || !gameEventsArmedRef.current)
            return;
        const myStrikes = gameState.timeoutStrikes[myPlayerId] ?? 0;
        if (myStrikes > prevMyStrikesRef.current) {
            gameStatsRef.current.timedOutCount++;
            if (myStrikes >= 3)
                gameStatsRef.current.wasKicked = true;
        }
        prevMyStrikesRef.current = myStrikes;
    }, [gameState?.timeoutStrikes]);
    // ── Stats: record when game ends ──────────────────────────────────────────
    const statsRecordedRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        if (gameState?.phase !== 'game-over')
            return;
        if (statsRecordedRef.current)
            return;
        if (!profile || isGuest)
            return;
        statsRecordedRef.current = true;
        const myPlacement = gameState.placements.find((pl) => pl.playerId === myPlayerId)?.place
            ?? gameState.placements.length + 1;
        const won = myPlacement === 1;
        // Best-effort: find winning suit from last discard if we won
        const winCard = won ? gameState.discard[gameState.discard.length - 1] : undefined;
        if (winCard)
            gameStatsRef.current.lastSuitWonWith = winCard.suit;
        // Find opponent (first non-me player in placements)
        const opponentPlacement = gameState.placements.find((pl) => pl.playerId !== myPlayerId);
        const opponentUsername = isLocalMode && opponentPlacement
            ? localPlayerNames[opponentPlacement.playerId] ?? 'AI'
            : undefined; // online: skip nemesis in v1
        (0, recordGameStats_1.recordGameStats)({
            userId: profile.id,
            isGuest: false,
            placement: myPlacement,
            turnsPlayed: gameStatsRef.current.turnsPlayed,
            maxCardsHeld: gameStatsRef.current.maxCardsHeld,
            cardsDrawn: gameStatsRef.current.cardsDrawn,
            biggestPickup: gameStatsRef.current.biggestPickup,
            blackJacksReceived: gameStatsRef.current.blackJacksReceived,
            blackJacksCountered: gameStatsRef.current.blackJacksCountered,
            twosStacked: gameStatsRef.current.twosStacked,
            twosReceived: gameStatsRef.current.twosReceived,
            falseOnCardsCount: gameStatsRef.current.falseOnCardsCount,
            correctOnCardsCount: gameStatsRef.current.correctOnCardsCount,
            timedOutCount: gameStatsRef.current.timedOutCount,
            wasKicked: gameStatsRef.current.wasKicked,
            opponentUsername,
            suitWonWith: gameStatsRef.current.lastSuitWonWith,
        }).catch(() => { });
    }, [gameState?.phase]);
    // ── Close on-cards window + reset auto-draw when turn is no longer mine ──
    (0, react_1.useEffect)(() => {
        if (!gameState)
            return;
        const current = gameState.players[gameState.currentPlayerIndex];
        const isMine = current?.id === myPlayerId;
        if (!isMine || gameState.phase === 'game-over') {
            closeOnCardsWindow();
            cancelAutoDraw();
            autoDrawInitiatedRef.current = false;
            autoDrawCancelledRef.current = false;
            pendingAutoAdvanceAfterDrawRef.current = false;
        }
    }, [gameState?.currentPlayerIndex, gameState?.phase]);
    // ── Online mode: auto-advance turn after draw card ────────────────────────
    (0, react_1.useEffect)(() => {
        if (isLocalMode)
            return;
        if (!gameState)
            return;
        if (!pendingAutoAdvanceAfterDrawRef.current)
            return;
        const current = gameState.players[gameState.currentPlayerIndex];
        if (current?.id !== myPlayerId)
            return;
        if (!gameState.currentPlayerHasActed)
            return;
        pendingAutoAdvanceAfterDrawRef.current = false;
        // Small delay so the draw animation completes before advancing
        const id = setTimeout(() => socketEndTurn(), 400);
        return () => clearTimeout(id);
    }, [gameState?.currentPlayerHasActed, gameState?.currentPlayerIndex, isLocalMode]);
    // ── Auto-draw detection: my turn + penalty + no counter ──────────────────
    (0, react_1.useEffect)(() => {
        if (!gameState || !gameEventsArmedRef.current || isDealing)
            return;
        const current = gameState.players[gameState.currentPlayerIndex];
        const isMine = current?.id === myPlayerId;
        if (!isMine || gameState.pendingPickup === 0) {
            autoDrawInitiatedRef.current = false;
            autoDrawCancelledRef.current = false;
            return;
        }
        if (gameState.currentPlayerHasActed)
            return; // already acted this turn
        if (autoDrawInitiatedRef.current)
            return;
        if (autoDrawCancelledRef.current)
            return;
        const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
        const hasCounter = myPlayer?.hand.some((card) => (0, validation_1.isValidPlay)(card, gameState)) ?? false;
        if (!hasCounter) {
            autoDrawInitiatedRef.current = true;
            setAutoDrawCountdown(3);
            let count = 3;
            const interval = setInterval(() => {
                count--;
                setAutoDrawCountdown(count);
                if (count <= 0) {
                    clearInterval(interval);
                    autoDrawTimerRef.current = null;
                    setAutoDrawCountdown(null);
                    handleDrawFn();
                }
            }, 1000);
            autoDrawTimerRef.current = interval;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState?.currentPlayerIndex, gameState?.pendingPickup, isDealing]);
    // ── Local mode: fire humanApplyTimeout when 30s expires ──────────────────
    // NOTE: gameState?.currentPlayerHasActed and showHowToPlay are in deps so the
    // effect re-runs (and its cleanup cancels the pending timeout) the moment the
    // human acts OR the modal opens.
    (0, react_1.useEffect)(() => {
        if (!isLocalMode)
            return;
        if (!gameState || gameState.phase === 'game-over')
            return;
        if (!gameEventsArmedRef.current || isDealing)
            return;
        const current = gameState.players[gameState.currentPlayerIndex];
        if (!current || current.id !== myPlayerId)
            return;
        if (!localTurnStartedAt)
            return;
        // Already acted — cancel any pending timeout and don't schedule a new one
        if (gameState.currentPlayerHasActed)
            return;
        // Modal open — pause the turn timer; no timeout while rules are being read
        if (showHowToPlay)
            return;
        const td = localTurnDurationRef.current;
        if (td === 0)
            return; // no limit
        const elapsed = Date.now() - localTurnStartedAt;
        const remaining = Math.max(0, td * 1000 - elapsed);
        const id = setTimeout(() => humanApplyTimeout(), remaining);
        return () => clearTimeout(id);
    }, [isLocalMode, isDealing, localTurnStartedAt, gameState?.phase, gameState?.currentPlayerHasActed, showHowToPlay]);
    // ── Early return: no game state yet ──────────────────────────────────────
    if (!gameState) {
        return (<react_native_1.View style={styles.loading}>
        <react_native_1.Text style={styles.loadingText}>
          {isLocalMode ? 'Setting up game…' : 'Waiting for game…'}
        </react_native_1.Text>
      </react_native_1.View>);
    }
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const isMyTurn = currentPlayer?.id === myPlayerId;
    const hasPendingPickup = gameState.pendingPickup > 0;
    const hasActed = gameState.currentPlayerHasActed;
    // Block all player interaction during deal
    const localActionDisabled = isDealing || (isLocalMode && (!isMyTurn || isAIThinking));
    const validPlays = isMyTurn && !isAIThinking && !hasActed && !isDealing
        ? (0, ai_1.getValidPlays)(gameState)
        : [];
    const playerNamesMap = isLocalMode ? localPlayerNames : {};
    function getMessage() {
        if (isDealing)
            return 'Dealing…';
        if (isLocalMode && isAIThinking) {
            const aiName = localPlayerNames[currentPlayer?.id ?? ''] ?? 'AI';
            return `${aiName} is thinking…`;
        }
        if (gameState.phase === 'declare-suit')
            return 'Choose a suit';
        if (isMyTurn && hasActed)
            return '';
        if (!isMyTurn) {
            if (isLocalMode) {
                return `${localPlayerNames[currentPlayer?.id ?? ''] ?? 'AI'}'s turn`;
            }
            return `${currentPlayer?.id.slice(0, 8) ?? '?'}'s turn`;
        }
        if (hasPendingPickup) {
            const type = gameState.pendingPickupType === 'jack' ? 'J' : '2';
            return `Pick up ${gameState.pendingPickup} (${type}) or counter`;
        }
        if (gameState.phase === 'cover')
            return 'Cover the Queen';
        if (gameState.phase === 'pickup')
            return `Pick up ${gameState.pendingPickup} cards`;
        return '';
    }
    function handleCardSelect(card) {
        const already = selectedCards.some((c) => c.rank === card.rank && c.suit === card.suit);
        if (already) {
            deselectCard(card);
        }
        else {
            selectCard(card);
            haptic('light');
            playSound('card_slide');
        }
    }
    async function handlePlay() {
        if (selectedCards.length === 0)
            return;
        const lastCard = selectedCards[selectedCards.length - 1];
        if (lastCard?.rank === 'A') {
            setShowSuitPicker(true);
            return;
        }
        const hasPower = selectedCards.some(isPowerCard);
        if (hasPower) {
            playSound('power_card');
        }
        else {
            playSound('card_flip');
        }
        haptic('medium');
        // Measure hand + discard positions for pixel-accurate fly animation
        const fallback = (0, animations_1.getGamePositions)(screenWidth, screenHeight);
        const handPos = await (0, measurePosition_1.measurePosition)(humanHandRef).catch(() => null);
        const discardPos = await (0, measurePosition_1.measurePosition)(discardPileRef).catch(() => null);
        const from = handPos ? (0, measurePosition_1.centreOf)(handPos) : fallback.myHand;
        const to = discardPos ? (0, measurePosition_1.centreOf)(discardPos) : fallback.discard;
        const cards = selectedCards.slice(); // capture before clearSelection
        lastHumanPlayCardsRef.current = cards; // preserve submission order for history banner
        cards.forEach((card, i) => {
            overlayRef.current?.addCards([
                {
                    id: (0, AnimationOverlay_1.animId)(),
                    card,
                    fromX: from.x + (i - Math.floor(cards.length / 2)) * 40,
                    fromY: from.y,
                    toX: to.x,
                    toY: to.y,
                    delay: i * 100,
                    duration: 350,
                    onComplete: undefined,
                },
            ]);
        });
        // Track power card counters (lastCard is already declared above)
        if (lastCard && gameState.pendingPickupType === '2' && lastCard.rank === '2')
            gameStatsRef.current.twosStacked++;
        if (lastCard && gameState.pendingPickupType === 'jack' && lastCard.rank === 'J' && (lastCard.suit === 'hearts' || lastCard.suit === 'diamonds'))
            gameStatsRef.current.blackJacksCountered++;
        if (isLocalMode) {
            try {
                humanPlay(cards);
            }
            catch { /* invalid */ }
        }
        else {
            socketPlayCards(cards);
        }
        clearSelection();
        // Open on-cards window after card animation (~350ms).
        // Use ref so the callback reads fresh state, not the stale closure.
        setTimeout(() => startOnCardsWindowRef.current(), 420);
    }
    async function handleSuitSelected(suit) {
        setShowSuitPicker(false);
        playSound('power_card');
        haptic('medium');
        const fallback = (0, animations_1.getGamePositions)(screenWidth, screenHeight);
        const handPos = await (0, measurePosition_1.measurePosition)(humanHandRef).catch(() => null);
        const discardPos = await (0, measurePosition_1.measurePosition)(discardPileRef).catch(() => null);
        const from = handPos ? (0, measurePosition_1.centreOf)(handPos) : fallback.myHand;
        const to = discardPos ? (0, measurePosition_1.centreOf)(discardPos) : fallback.discard;
        const cards = selectedCards.slice(); // capture before clearSelection
        lastHumanPlayCardsRef.current = cards; // preserve submission order for history banner
        cards.forEach((card, i) => {
            overlayRef.current?.addCards([
                {
                    id: (0, AnimationOverlay_1.animId)(),
                    card,
                    fromX: from.x + (i - Math.floor(cards.length / 2)) * 40,
                    fromY: from.y,
                    toX: to.x,
                    toY: to.y,
                    delay: i * 100,
                    duration: 350,
                    onComplete: undefined,
                },
            ]);
        });
        // Track power card counters (Ace plays with declared suit)
        const lastCard2 = cards[cards.length - 1];
        if (lastCard2) {
            if (gameState.pendingPickupType === '2' && lastCard2.rank === '2')
                gameStatsRef.current.twosStacked++;
            if (gameState.pendingPickupType === 'jack' && lastCard2.rank === 'J' && (lastCard2.suit === 'hearts' || lastCard2.suit === 'diamonds'))
                gameStatsRef.current.blackJacksCountered++;
        }
        if (isLocalMode) {
            try {
                humanPlay(cards, suit);
            }
            catch { /* invalid */ }
        }
        else {
            socketPlayCards(cards, suit);
        }
        clearSelection();
        // Open on-cards window after card animation (~350ms).
        // Use ref so the callback reads fresh state, not the stale closure.
        setTimeout(() => startOnCardsWindowRef.current(), 420);
    }
    // handleDrawFn is the underlying draw — also used by auto-draw countdown
    function handleDrawFn() {
        haptic('light');
        // Track draw stats before the state changes
        const drawCount = gameState.pendingPickup > 0 ? gameState.pendingPickup : 1;
        gameStatsRef.current.cardsDrawn += drawCount;
        if (drawCount > 1) {
            gameStatsRef.current.biggestPickup = Math.max(gameStatsRef.current.biggestPickup, drawCount);
            if (gameState.pendingPickupType === 'jack')
                gameStatsRef.current.blackJacksReceived++;
            else if (gameState.pendingPickupType === '2')
                gameStatsRef.current.twosReceived++;
        }
        if (isLocalMode) {
            humanDraw();
            // Auto-advance turn after draw animation
            setTimeout(() => humanEndTurn(), 450);
        }
        else {
            socketDrawCard();
            pendingAutoAdvanceAfterDrawRef.current = true;
        }
        clearSelection();
    }
    function handleDraw() {
        handleDrawFn();
    }
    function handleDeclareSuit(suit) {
        setShowSuitPicker(false);
        if (isLocalMode) {
            handleSuitSelected(suit);
        }
        else {
            if (gameState.phase === 'declare-suit') {
                socketDeclareSuit(suit);
            }
            else {
                handleSuitSelected(suit);
            }
        }
    }
    function handleDeclareOnCards() {
        // Read the CURRENT state at moment of tap — never a stale closure.
        // Local: stateRef inside the hook is updated synchronously in humanPlay.
        // Online: server uses room.state directly; ref used here only for guard checks.
        const currentState = isLocalMode ? localGameStateRef.current : gameStateRef.current;
        if (!currentState)
            return;
        closeOnCardsWindow();
        playSound('on_cards');
        haptic('success');
        if (isLocalMode) {
            const isValid = humanDeclareOnCards(); // reads localGameStateRef.current internally
            if (isValid) {
                gameStatsRef.current.correctOnCardsCount++;
                const humanName = localPlayerNames[localMyPlayerId] ?? 'You';
                addToast(`${humanName} is on cards!`);
            }
            else {
                gameStatsRef.current.falseOnCardsCount++;
                addToast("You're not on cards — 2 cards added to your hand");
                haptic('error');
            }
        }
        else {
            socketDeclareOnCards(); // server declares + advances turn
        }
    }
    const onCardsActive = gameState.onCardsDeclarations.includes(myPlayerId);
    // Turn duration — local from params, online from roomInfo
    const turnDuration = isLocalMode
        ? localTurnDurationRef.current
        : (roomInfo?.turnDuration ?? 30);
    function handleLeaveGame() {
        console.log('=== LEAVE GAME TRIGGERED ===');
        try {
            console.log('Step 1 — cleaning up timers');
            closeOnCardsWindow();
            cancelAutoDraw();
            console.log('Step 2 — emitting room leave', { isLocalMode, roomId, myPlayerId });
            if (!isLocalMode) {
                const { socket: s, roomId: rId, myPlayerId: pid } = gameStore_1.useGameStore.getState();
                s?.emit('room:leave', { roomId: rId, playerId: pid });
            }
            console.log('Step 3 — resetting store');
            gameStore_1.useGameStore.getState().reset();
            console.log('Step 4 — navigating home', { routerAvailable: !!router });
            router.push('/');
            console.log('Step 5 — navigation called');
        }
        catch (err) {
            console.error('=== LEAVE GAME ERROR ===', err);
            // Web fallback
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
            else {
                router.push('/');
            }
        }
    }
    function handleReact(reactionId) {
        const emoji = REACTION_MAP[reactionId] ?? '🔥';
        const id = Date.now().toString();
        if (isLocalMode) {
            // Local: just show the human's own reaction (AI never reacts)
            setFloatingReactions((prev) => [
                ...prev,
                { id, playerId: myPlayerId, reactionId, emoji, startTime: Date.now() },
            ]);
            setTimeout(() => setFloatingReactions((prev) => prev.filter((r) => r.id !== id)), 2500);
        }
        else {
            const { socket: s, roomId: rId } = gameStore_1.useGameStore.getState();
            s?.emit('game:reaction', { roomId: rId, playerId: myPlayerId, reactionId });
        }
    }
    const showPreAction = isMyTurn && !hasActed && !isAIThinking && !isDealing && gameState.phase !== 'declare-suit';
    // timerStartedAt: cleared the moment the player acts so TurnTimer freezes/stops.
    // Local mode uses hook-tracked time; online uses server-stamped time.
    // Also frozen (display-only) while the HowToPlay modal is open in local mode.
    const rawTimerStartedAt = hasActed
        ? null
        : (isLocalMode ? localTurnStartedAt : gameState.timerStartedAt);
    const timerStartedAt = (isLocalMode && showHowToPlay && rawTimerStartedAt !== null && modalOpenedAtRef.current !== null)
        ? Date.now() - (modalOpenedAtRef.current - rawTimerStartedAt) // freeze elapsed at modal-open time
        : rawTimerStartedAt;
    // Current player's colour for timer bar and turn message
    const currentPlayerColourHex = currentPlayer?.colourHex;
    // Message colour: applied when the message is a player-turn message (not system messages)
    const messageIsPlayerTurn = !isDealing && !isMyTurn && gameState.phase !== 'declare-suit';
    const messageColourHex = messageIsPlayerTurn ? currentPlayerColourHex : undefined;
    const currentPlayerName = isLocalMode
        ? (localPlayerNames[currentPlayer?.id ?? ''] ?? currentPlayer?.id?.slice(0, 8) ?? '')
        : (currentPlayer?.id?.slice(0, 8) ?? '');
    return (<react_native_1.SafeAreaView style={[styles.safe, { paddingBottom: insets.bottom }]}>
      <Toast_1.Toast messages={toasts} onExpire={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}/>

      {/* Last move banner — top of screen */}
      <LastMoveBanner_1.LastMoveBanner entry={lastMove}/>

      {/* ── Menu button — hamburger top-left ─────────────────────────────── */}
      <react_native_1.TouchableOpacity style={styles.menuBtn} onPress={() => setShowMenu(true)}>
        <react_native_1.View style={styles.menuLine}/>
        <react_native_1.View style={styles.menuLine}/>
        <react_native_1.View style={styles.menuLine}/>
      </react_native_1.TouchableOpacity>

      {/* Skip deal button — only visible while dealing */}
      {isDealing && (<react_native_1.TouchableOpacity style={styles.skipBtn} onPress={handleSkipDeal}>
          <react_native_1.Text style={styles.skipBtnText}>Skip</react_native_1.Text>
        </react_native_1.TouchableOpacity>)}

      <RoundTable_1.RoundTable gameState={gameState} myPlayerId={myPlayerId} onCardSelect={(!isMyTurn || localActionDisabled || hasActed) ? () => { } : handleCardSelect} onPlay={handlePlay} onDraw={handleDraw} selectedCards={selectedCards} validPlays={validPlays} isMyTurn={isMyTurn && !isAIThinking && !hasActed && !isDealing} isDealing={isDealing} dealtCardCounts={dealtCardCounts ?? undefined} deckCountOverride={deckCountOverride} connectionState={connectionState} isAIThinking={isAIThinking} onCardsActive={onCardsActive} autoDrawCountdown={autoDrawCountdown} onCancelAutoDraw={cancelAutoDraw} timerStartedAt={isDealing ? null : timerStartedAt} currentPlayerColourHex={currentPlayerColourHex} currentPlayerName={currentPlayerName} playerNames={playerNamesMap} flashingPlayerId={flashingPlayerId} isReconnecting={!isLocalMode && (connectionState === 'disconnected' || connectionState === 'reconnecting')} onReconnectTimeout={() => {
            gameStore_1.useGameStore.getState().setError('You were removed from the game');
            router.replace('/');
        }} drawPileRef={drawPileRef} discardPileRef={discardPileRef} humanHandRef={humanHandRef} opponentRefs={opponentRefs} selectionDisabled={localActionDisabled || hasActed} message={getMessage()} messageColourHex={messageColourHex} hasPendingPickup={hasPendingPickup} pendingPickupCount={gameState.pendingPickup} turnDuration={turnDuration} floatingReactions={floatingReactions} onReact={handleReact}/>

      <AnimationOverlay_1.AnimationOverlay ref={overlayRef}/>

      <HowToPlayModal_1.HowToPlayModal visible={showHowToPlay} onClose={() => {
            if (isLocalMode && modalOpenedAtRef.current !== null) {
                adjustTurnStartedAt(Date.now() - modalOpenedAtRef.current);
                modalOpenedAtRef.current = null;
            }
            setShowHowToPlay(false);
        }}/>

      <SuitPicker_1.SuitPicker visible={showSuitPicker} onSelect={handleDeclareSuit}/>

      {/* ── On-cards declaration pill — compact, sizes to content ── */}
      {showOnCardsWindow && (<react_native_1.View style={{
                position: 'absolute',
                bottom: 220,
                alignSelf: 'center',
                backgroundColor: 'rgba(13, 27, 42, 0.92)',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme_1.THEME.gold,
                paddingHorizontal: 16,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                zIndex: 50,
            }}>
          {/* Countdown number */}
          <react_native_1.Text style={{
                color: theme_1.THEME.gold,
                fontSize: 13,
                fontWeight: '500',
                minWidth: 16,
                textAlign: 'center',
            }}>
            {onCardsCountdown}s
          </react_native_1.Text>

          {/* Divider */}
          <react_native_1.View style={{
                width: 0.5,
                height: 20,
                backgroundColor: theme_1.THEME.gold,
                opacity: 0.4,
            }}/>

          {/* Button or confirmed state */}
          {!onCardsActive ? (<react_native_1.TouchableOpacity onPress={handleDeclareOnCards}>
              <react_native_1.Text style={{
                    color: theme_1.THEME.gold,
                    fontSize: 13,
                    fontWeight: '500',
                }}>
                I'm on cards!
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>) : (<react_native_1.Text style={{
                    color: theme_1.THEME.success,
                    fontSize: 13,
                    fontWeight: '500',
                }}>
              Declared!
            </react_native_1.Text>)}
        </react_native_1.View>)}

      {/* ── Game menu bottom sheet ─────────────────────────────────────── */}
      {showMenu && (<react_native_1.View style={styles.menuOverlay}>
          <react_native_1.TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setShowMenu(false)}/>
          <react_native_1.View style={styles.menuSheet}>
            <react_native_1.View style={styles.menuHandle}/>

            <react_native_1.TouchableOpacity style={styles.menuItem} onPress={() => {
                setShowMenu(false);
                modalOpenedAtRef.current = Date.now();
                setShowHowToPlay(true);
            }}>
              <react_native_1.Text style={styles.menuItemText}>How to play</react_native_1.Text>
            </react_native_1.TouchableOpacity>

            <react_native_1.View style={styles.menuDivider}/>

            <react_native_1.TouchableOpacity style={styles.menuItem} onPress={() => { toggleMute(); setShowMenu(false); }}>
              <react_native_1.Text style={styles.menuItemText}>
                {isMuted ? 'Unmute sounds' : 'Mute sounds'}
              </react_native_1.Text>
              <react_native_1.Text style={styles.menuItemMeta}>{isMuted ? '🔇' : '🔊'}</react_native_1.Text>
            </react_native_1.TouchableOpacity>

            <react_native_1.View style={styles.menuDivider}/>

            <react_native_1.TouchableOpacity style={[styles.menuItem]} onPress={() => {
                setShowMenu(false);
                setShowLeaveConfirm(true);
            }}>
              <react_native_1.Text style={[styles.menuItemText, { color: theme_1.THEME.danger }]}>Leave game</react_native_1.Text>
            </react_native_1.TouchableOpacity>

            <react_native_1.TouchableOpacity style={[styles.menuItem, styles.menuCloseBtn]} onPress={() => setShowMenu(false)}>
              <react_native_1.Text style={styles.menuCloseText}>Cancel</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
        </react_native_1.View>)}

      {/* ── Leave game confirmation overlay ─────────────────────────────── */}
      {showLeaveConfirm && (<react_native_1.View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 200,
            }}>
          <react_native_1.View style={{
                backgroundColor: theme_1.THEME.cardBackground,
                borderRadius: 16,
                padding: 24,
                width: 280,
                gap: 16,
                borderWidth: 1,
                borderColor: theme_1.THEME.gold,
            }}>
            <react_native_1.Text style={{
                color: theme_1.THEME.textPrimary,
                fontSize: 18,
                fontWeight: '500',
                textAlign: 'center',
            }}>
              Leave game?
            </react_native_1.Text>
            <react_native_1.Text style={{
                color: theme_1.THEME.textSecondary,
                fontSize: 14,
                textAlign: 'center',
            }}>
              {isLocalMode ? 'Your game progress will be lost.' : 'You will forfeit this game.'}
            </react_native_1.Text>
            <react_native_1.View style={{ flexDirection: 'row', gap: 12 }}>
              <react_native_1.TouchableOpacity style={{
                flex: 1,
                borderWidth: 1,
                borderColor: theme_1.THEME.gold,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
            }} onPress={() => setShowLeaveConfirm(false)}>
                <react_native_1.Text style={{ color: theme_1.THEME.gold, fontSize: 15 }}>Stay</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity style={{
                flex: 1,
                backgroundColor: theme_1.THEME.danger,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
            }} onPress={() => {
                setShowLeaveConfirm(false);
                handleLeaveGame();
            }}>
                <react_native_1.Text style={{ color: '#fff', fontSize: 15, fontWeight: '500' }}>Leave</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.View>)}
    </react_native_1.SafeAreaView>);
}
// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = react_native_1.StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: theme_1.THEME.appBackground,
    },
    loading: {
        flex: 1,
        backgroundColor: theme_1.THEME.appBackground,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: theme_1.THEME.textSecondary,
        fontSize: 16,
    },
    // ── Menu hamburger button ─────────────────────────────────────────────────
    menuBtn: {
        position: 'absolute',
        top: 52,
        left: 14,
        zIndex: 50,
        gap: 4,
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(13,27,42,0.7)',
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.3)',
    },
    menuLine: {
        width: 20,
        height: 2,
        backgroundColor: theme_1.THEME.gold,
        borderRadius: 1,
    },
    // ── Skip deal button ──────────────────────────────────────────────────────
    skipBtn: {
        position: 'absolute',
        top: 52,
        right: 14,
        zIndex: 50,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 12,
        backgroundColor: 'rgba(13,27,42,0.7)',
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.4)',
    },
    skipBtnText: {
        color: theme_1.THEME.gold,
        fontSize: 13,
        fontWeight: '700',
    },
    // ── Menu bottom sheet ─────────────────────────────────────────────────────
    menuOverlay: {
        ...react_native_1.StyleSheet.absoluteFillObject,
        zIndex: 200,
        justifyContent: 'flex-end',
    },
    menuBackdrop: {
        ...react_native_1.StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    menuSheet: {
        backgroundColor: theme_1.THEME.cardBackground,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 36,
        paddingTop: 12,
        borderTopWidth: 1,
        borderColor: theme_1.THEME.gold,
    },
    menuHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme_1.THEME.textMuted,
        alignSelf: 'center',
        marginBottom: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 18,
        justifyContent: 'space-between',
    },
    menuItemText: {
        color: theme_1.THEME.textPrimary,
        fontSize: 17,
        fontWeight: '600',
    },
    menuItemMeta: {
        fontSize: 18,
    },
    menuDivider: {
        height: 1,
        backgroundColor: 'rgba(201,168,76,0.12)',
        marginHorizontal: 24,
    },
    menuCloseBtn: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(201,168,76,0.12)',
        justifyContent: 'center',
    },
    menuCloseText: {
        color: theme_1.THEME.textMuted,
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
});
//# sourceMappingURL=game.js.map