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
exports.default = ResultsScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const useSocket_1 = require("../hooks/useSocket");
const gameStore_1 = require("../store/gameStore");
const Confetti_1 = require("../components/Confetti");
const useSounds_1 = require("../hooks/useSounds");
const useHaptics_1 = require("../hooks/useHaptics");
const Avatar_1 = __importDefault(require("../components/Avatar"));
const theme_1 = require("../utils/theme");
function ResultsScreen() {
    const router = (0, expo_router_1.useRouter)();
    const params = (0, expo_router_1.useLocalSearchParams)();
    const isLocalMode = params.mode === 'local';
    const { width, height } = (0, react_native_1.useWindowDimensions)();
    const { startGame } = (0, useSocket_1.useSocket)();
    const { gameState, myPlayerId, roomId, roomInfo, reset, setGameState } = (0, gameStore_1.useGameStore)();
    const { playSound } = (0, useSounds_1.useSounds)();
    const { trigger: haptic } = (0, useHaptics_1.useHaptics)();
    const winnerId = gameState?.winnerId ?? null;
    const isWinner = isLocalMode
        ? winnerId === 'player-human'
        : winnerId === myPlayerId;
    // ── Win pulse animation (gold border glow on winner row) ──────────────────
    const winPulse = (0, react_1.useRef)(new react_native_1.Animated.Value(0.4)).current;
    // ── Play win sound + haptic + start pulse animation ───────────────────────
    const didFireRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        if (didFireRef.current)
            return;
        didFireRef.current = true;
        // Play sound for winner
        if (isWinner) {
            playSound('win');
            haptic('success');
        }
        // Gold border pulse: opacity 0.4 → 1.0, 3 cycles, winner or not
        const pulse = react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(winPulse, {
                toValue: 1.0,
                duration: 600,
                useNativeDriver: false,
            }),
            react_native_1.Animated.timing(winPulse, {
                toValue: 0.4,
                duration: 600,
                useNativeDriver: false,
            }),
        ]), { iterations: 3 });
        pulse.start();
    }, []);
    if (!gameState) {
        return (<react_native_1.SafeAreaView style={styles.safe}>
        <react_native_1.View style={styles.centred}>
          <react_native_1.Text style={styles.title}>Game Over</react_native_1.Text>
          <react_native_1.TouchableOpacity style={styles.primaryBtn} onPress={() => { reset(); router.replace('/'); }}>
            <react_native_1.Text style={styles.primaryBtnText}>Back to Home</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
      </react_native_1.SafeAreaView>);
    }
    function resolvePlayerName(id) {
        if (isLocalMode) {
            if (id === 'player-human')
                return params.playerName ?? 'You';
            const num = id.replace('ai-', '');
            return `AI ${num}`;
        }
        return roomInfo?.players.find((p) => p.playerId === id)?.name ?? id.slice(0, 8);
    }
    const winnerName = winnerId ? resolvePlayerName(winnerId) : 'Unknown';
    // Build standings from placements (already ordered by place)
    const allPlayers = [
        ...(gameState.placements.map((pl) => {
            const player = gameState
                .allPlayers?.find((p) => p.id === pl.playerId);
            return {
                id: pl.playerId,
                name: resolvePlayerName(pl.playerId),
                place: pl.place,
                score: gameState.sessionScores[pl.playerId] ?? 0,
                isWinner: pl.playerId === winnerId,
                colourHex: player?.colourHex,
                avatarId: player?.avatarId,
            };
        })),
        // Fallback: any active players not yet in placements (shouldn't happen at game-over)
        ...gameState.players
            .filter((p) => !gameState.placements.find((pl) => pl.playerId === p.id))
            .map((p, idx) => ({
            id: p.id,
            name: resolvePlayerName(p.id),
            place: gameState.placements.length + idx + 1,
            score: gameState.sessionScores[p.id] ?? 0,
            isWinner: p.id === winnerId,
            colourHex: p.colourHex,
            avatarId: p.avatarId,
        })),
    ];
    const standings = allPlayers.sort((a, b) => a.place - b.place);
    function handlePlayAgain() {
        if (isLocalMode) {
            setGameState(null);
            router.replace({
                pathname: '/game',
                params: {
                    mode: 'local',
                    playerName: params.playerName ?? 'Player',
                    aiCount: params.aiCount ?? '1',
                },
            });
        }
        else if (roomId) {
            gameStore_1.useGameStore.getState().setGameState(null);
            startGame(roomId);
        }
        else {
            reset();
            router.replace('/');
        }
    }
    function handleHome() {
        reset();
        router.replace('/');
    }
    const showPlayAgain = isLocalMode || !!roomId;
    const winnerBorderColor = winPulse.interpolate({
        inputRange: [0.4, 1.0],
        outputRange: ['rgba(255,193,7,0.3)', 'rgba(255,193,7,1.0)'],
    });
    return (<react_native_1.SafeAreaView style={styles.safe}>
      {/* Confetti falls on top of everything */}
      <Confetti_1.Confetti width={width} height={height} active={isWinner}/>

      <react_native_1.View style={styles.container}>
        <react_native_1.Text style={styles.trophy}>
          {isWinner ? '🏆' : ''}
        </react_native_1.Text>
        <react_native_1.Text style={styles.title}>
          {isWinner ? 'You Win!' : `${winnerName} wins!`}
        </react_native_1.Text>

        <react_native_1.Text style={styles.subtitle}>Final standings</react_native_1.Text>

        <react_native_1.FlatList data={standings} keyExtractor={(item) => item.id} style={styles.list} renderItem={({ item }) => {
            const placeBadge = item.place === 1 ? '♛' : item.place === 2 ? '🥈' : item.place === 3 ? '🥉' : null;
            const placeColor = item.place === 1 ? theme_1.THEME.gold : item.place === 2 ? '#C0C0C0' : item.place === 3 ? '#CD7F32' : theme_1.THEME.textMuted;
            return item.isWinner ? (<react_native_1.Animated.View style={[
                    styles.row,
                    styles.winnerRow,
                    { borderColor: winnerBorderColor },
                ]}>
                <react_native_1.Text style={[styles.position, { color: placeColor }]}>#{item.place}</react_native_1.Text>
                <Avatar_1.default avatarId={item.avatarId ?? 'avatar_01'} size={48} colourHex="#EF9F27" showRing/>
                <react_native_1.Text style={[styles.playerName, item.colourHex ? { color: item.colourHex } : undefined]}>{item.name}</react_native_1.Text>
                <react_native_1.View style={styles.rightSide}>
                  <react_native_1.View style={styles.scoreBadge}>
                    <react_native_1.Text style={styles.scoreText}>{item.score} pt{item.score !== 1 ? 's' : ''}</react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.View>
                {placeBadge && <react_native_1.Text style={[styles.crown, { color: placeColor }]}>{placeBadge}</react_native_1.Text>}
              </react_native_1.Animated.View>) : (<react_native_1.View style={[styles.row]}>
                <react_native_1.Text style={[styles.position, { color: placeColor }]}>#{item.place}</react_native_1.Text>
                <Avatar_1.default avatarId={item.avatarId ?? 'avatar_01'} size={48} colourHex={item.colourHex ?? '#378ADD'} showRing/>
                <react_native_1.Text style={[styles.playerName, item.colourHex ? { color: item.colourHex } : undefined]}>{item.name}</react_native_1.Text>
                <react_native_1.View style={styles.rightSide}>
                  <react_native_1.View style={styles.scoreBadge}>
                    <react_native_1.Text style={styles.scoreText}>{item.score} pt{item.score !== 1 ? 's' : ''}</react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.View>
                {placeBadge && <react_native_1.Text style={[styles.crown, { color: placeColor }]}>{placeBadge}</react_native_1.Text>}
              </react_native_1.View>);
        }}/>

        {showPlayAgain && (<react_native_1.TouchableOpacity style={styles.primaryBtn} onPress={handlePlayAgain}>
            <react_native_1.Text style={styles.primaryBtnText}>Play Again</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}

        <react_native_1.TouchableOpacity style={styles.secondaryBtn} onPress={handleHome}>
          <react_native_1.Text style={styles.secondaryBtnText}>Main Menu</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: theme_1.THEME.appBackground,
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        gap: 16,
    },
    centred: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        paddingHorizontal: 24,
    },
    trophy: {
        fontSize: 48,
        textAlign: 'center',
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: theme_1.THEME.gold,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: theme_1.THEME.textMuted,
        textAlign: 'center',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    list: {
        flexGrow: 0,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme_1.THEME.cardBackground,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        gap: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    winnerRow: {
        backgroundColor: theme_1.THEME.surfaceBackground,
        borderWidth: 1.5,
    },
    position: {
        color: theme_1.THEME.textMuted,
        fontSize: 15,
        width: 32,
        fontWeight: '600',
    },
    playerName: {
        color: theme_1.THEME.textPrimary,
        fontSize: 16,
        flex: 1,
        fontWeight: '500',
    },
    rightSide: {
        alignItems: 'flex-end',
        gap: 4,
    },
    scoreBadge: {
        backgroundColor: 'rgba(201,168,76,0.15)',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    scoreText: {
        color: theme_1.THEME.gold,
        fontSize: 11,
        fontWeight: '700',
    },
    crown: {
        fontSize: 18,
        color: theme_1.THEME.gold,
    },
    primaryBtn: {
        backgroundColor: theme_1.THEME.gold,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    primaryBtnText: {
        color: theme_1.THEME.appBackground,
        fontSize: 16,
        fontWeight: '800',
    },
    secondaryBtn: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.2)',
    },
    secondaryBtnText: {
        color: theme_1.THEME.textMuted,
        fontSize: 15,
    },
});
//# sourceMappingURL=results.js.map