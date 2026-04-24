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
exports.default = HomeScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const useSocket_1 = require("../hooks/useSocket");
const gameStore_1 = require("../store/gameStore");
const HowToPlayModal_1 = require("../components/HowToPlayModal");
const AuthContext_1 = require("../context/AuthContext");
const Avatar_1 = __importDefault(require("../components/Avatar"));
const useFriendRequests_1 = require("../hooks/useFriendRequests");
const theme_1 = require("../utils/theme");
function FriendsIcon({ colour = '#616161' }) {
    return (<react_native_1.View style={{ width: 36, height: 36 }}>
      {/* Back person head */}
      <react_native_1.View style={{ position: 'absolute', right: 5, top: 4, width: 12, height: 12, borderRadius: 6, backgroundColor: colour, opacity: 0.55 }}/>
      {/* Back person body */}
      <react_native_1.View style={{ position: 'absolute', right: 1, bottom: 5, width: 16, height: 10, borderRadius: 5, backgroundColor: colour, opacity: 0.55 }}/>
      {/* Front person head */}
      <react_native_1.View style={{ position: 'absolute', left: 5, top: 6, width: 13, height: 13, borderRadius: 6.5, backgroundColor: colour }}/>
      {/* Front person body */}
      <react_native_1.View style={{ position: 'absolute', left: 1, bottom: 4, width: 17, height: 11, borderRadius: 6, backgroundColor: colour }}/>
    </react_native_1.View>);
}
function TrophyIcon({ colour = '#616161' }) {
    return (<react_native_1.View style={{ width: 36, height: 36, alignItems: 'center' }}>
      {/* Cup with handles */}
      <react_native_1.View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 5 }}>
        <react_native_1.View style={{ width: 4, height: 10, backgroundColor: colour, borderTopLeftRadius: 2 }}/>
        <react_native_1.View style={{ width: 16, height: 14, backgroundColor: colour, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}/>
        <react_native_1.View style={{ width: 4, height: 10, backgroundColor: colour, borderTopRightRadius: 2 }}/>
      </react_native_1.View>
      {/* Stem */}
      <react_native_1.View style={{ width: 4, height: 5, backgroundColor: colour }}/>
      {/* Base */}
      <react_native_1.View style={{ width: 16, height: 3, backgroundColor: colour, borderRadius: 1.5 }}/>
    </react_native_1.View>);
}
// Subtle animated waiting indicator — three dots that cycle 1→2→3→1
function PulsingDots() {
    const [step, setStep] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        const id = setInterval(() => setStep((s) => (s + 1) % 3), 600);
        return () => clearInterval(id);
    }, []);
    const dots = ['●', '● ●', '● ● ●'][step];
    return <react_native_1.Text style={styles.pulsingDots}>{dots}</react_native_1.Text>;
}
const TIMER_OPTIONS = [
    { label: '15s', value: 15, description: 'Blitz' },
    { label: '30s', value: 30, description: 'Standard' },
    { label: '60s', value: 60, description: 'Casual' },
    { label: '2m', value: 120, description: 'Relaxed' },
    { label: 'None', value: 0, description: 'No limit' },
];
function HomeScreen() {
    const router = (0, expo_router_1.useRouter)();
    const { createRoom, joinRoom, startGame } = (0, useSocket_1.useSocket)();
    const { setPlayerName, roomId, roomInfo, myPlayerId, gameState, error, setError } = (0, gameStore_1.useGameStore)();
    const { profile, isGuest } = (0, AuthContext_1.useAuth)();
    const { friendRequestCount } = (0, useFriendRequests_1.useFriendRequests)(profile?.id);
    // Mode selector
    const [mode, setMode] = (0, react_1.useState)('none');
    // Online flow state — pre-filled from profile
    const [createName, setCreateName] = (0, react_1.useState)('');
    const [joinName, setJoinName] = (0, react_1.useState)('');
    const [joinCode, setJoinCode] = (0, react_1.useState)('');
    const [maxPlayers, setMaxPlayers] = (0, react_1.useState)(4);
    const [lastAction, setLastAction] = (0, react_1.useState)(null);
    const [copied, setCopied] = (0, react_1.useState)(false);
    // AI flow state — pre-filled from profile
    const [aiName, setAiName] = (0, react_1.useState)('');
    const [aiCount, setAiCount] = (0, react_1.useState)(1);
    // Turn timer duration — shared across online + AI modes
    const [turnDuration, setTurnDuration] = (0, react_1.useState)(30);
    // Pre-fill name fields from profile whenever profile loads
    (0, react_1.useEffect)(() => {
        if (profile?.username) {
            setCreateName(profile.username);
            setJoinName(profile.username);
            setAiName(profile.username);
        }
    }, [profile?.username]);
    const [showHowToPlay, setShowHowToPlay] = (0, react_1.useState)(false);
    const { width } = (0, react_native_1.useWindowDimensions)();
    const wide = width >= 640;
    (0, react_1.useEffect)(() => {
        if (gameState)
            router.replace('/game');
    }, [gameState]);
    // Auto-clear error after 5 seconds
    (0, react_1.useEffect)(() => {
        if (!error)
            return;
        const id = setTimeout(() => setError(null), 5000);
        return () => clearTimeout(id);
    }, [error]);
    function handleCreate() {
        if (!createName.trim())
            return;
        setPlayerName(createName.trim());
        setLastAction('create');
        setError(null);
        createRoom(maxPlayers, profile?.id, profile?.colourHex, profile?.avatarId, turnDuration);
    }
    function handleJoin() {
        if (!joinName.trim() || !joinCode.trim())
            return;
        setPlayerName(joinName.trim());
        setLastAction('join');
        setError(null);
        joinRoom(joinCode.trim().toUpperCase(), profile?.id, profile?.colourHex, profile?.avatarId);
    }
    async function handleCopy() {
        if (!roomId)
            return;
        try {
            if (react_native_1.Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(roomId);
            }
        }
        catch (_) {
            // clipboard unavailable — still show the feedback
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    function handleStartAI() {
        if (!aiName.trim())
            return;
        router.replace({
            pathname: '/game',
            params: {
                mode: 'local',
                playerName: aiName.trim(),
                aiCount: String(aiCount),
                turnDuration: String(turnDuration),
                userId: profile?.id ?? '',
                colourHex: profile?.colourHex ?? '#378ADD',
                avatarId: profile?.avatarId ?? 'avatar_01',
            },
        });
    }
    const isHost = roomInfo?.players[0]?.playerId === myPlayerId;
    const canStart = isHost && (roomInfo?.players.length ?? 0) >= 2;
    const createError = lastAction === 'create' ? error : null;
    const joinError = lastAction === 'join' ? error : null;
    const canCreate = createName.trim().length > 0;
    const canJoin = joinName.trim().length > 0 && joinCode.trim().length > 0;
    const canStartAI = aiName.trim().length > 0;
    // ── Waiting room (after create or join) ────────────────────────────────
    if (roomId) {
        return (<react_native_1.SafeAreaView style={styles.safe}>
        <react_native_1.ScrollView contentContainerStyle={styles.waitingScroll} keyboardShouldPersistTaps="handled">
          <react_native_1.Text style={styles.title}>Card Game</react_native_1.Text>

          <react_native_1.View style={styles.waitingCard}>
            {/* Room code section */}
            <react_native_1.View style={styles.roomCodeSection}>
              <react_native_1.Text style={styles.roomCodeLabel}>Room Code</react_native_1.Text>
              <react_native_1.Text style={styles.roomCodeBig}>{roomId}</react_native_1.Text>
              <react_native_1.TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                <react_native_1.Text style={styles.copyBtnText}>{copied ? '✓ Copied!' : 'Copy Code'}</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>

            <react_native_1.View style={styles.waitingStatus}>
              <react_native_1.Text style={styles.waitingText}>Waiting for players</react_native_1.Text>
              <PulsingDots />
            </react_native_1.View>

            <react_native_1.Text style={styles.playersSectionTitle}>
              Players ({roomInfo?.players.length ?? 0} / {roomInfo?.maxPlayers ?? 4})
            </react_native_1.Text>

            <react_native_1.FlatList data={roomInfo?.players ?? []} keyExtractor={(item) => item.playerId} scrollEnabled={false} renderItem={({ item, index }) => (<react_native_1.View style={styles.playerRow}>
                  <react_native_1.Text style={styles.playerRowName}>{item.name}</react_native_1.Text>
                  <react_native_1.View style={styles.playerBadges}>
                    {index === 0 && <react_native_1.Text style={styles.hostBadge}>HOST</react_native_1.Text>}
                    {item.playerId === myPlayerId && (<react_native_1.Text style={styles.youBadge}>YOU</react_native_1.Text>)}
                  </react_native_1.View>
                </react_native_1.View>)} style={styles.playerList}/>

            {canStart ? (<react_native_1.TouchableOpacity style={styles.primaryBtn} onPress={() => startGame(roomId)}>
                <react_native_1.Text style={styles.primaryBtnText}>Start Game</react_native_1.Text>
              </react_native_1.TouchableOpacity>) : (<react_native_1.Text style={styles.waitingHint}>
                {isHost
                    ? 'Waiting for at least 2 players to join…'
                    : 'Waiting for the host to start the game…'}
              </react_native_1.Text>)}
          </react_native_1.View>
        </react_native_1.ScrollView>
      </react_native_1.SafeAreaView>);
    }
    // ── Lobby ─────────────────────────────────────────────────────────────
    return (<react_native_1.SafeAreaView style={styles.safe}>
      <react_native_1.ScrollView contentContainerStyle={styles.lobbyScroll} keyboardShouldPersistTaps="handled">
        {/* Guest banner */}
        {isGuest && (<react_native_1.View style={styles.guestBanner}>
            <react_native_1.Text style={styles.guestBannerText}>
              Playing as guest — create an account to save your stats
            </react_native_1.Text>
            <react_native_1.TouchableOpacity onPress={() => router.push('/auth')}>
              <react_native_1.Text style={styles.guestBannerLink}>Sign up</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>)}

        {/* Title row with profile icon */}
        <react_native_1.View style={styles.titleRow}>
          <react_native_1.Text style={styles.title}>Card Game</react_native_1.Text>
          <react_native_1.View style={styles.profileBtnGroup}>
            {/* Leaderboard button */}
            <react_native_1.TouchableOpacity style={styles.navIconBtn} onPress={() => router.push('/leaderboard')}>
              <TrophyIcon />
              <react_native_1.Text style={styles.navIconLabel}>Ranks</react_native_1.Text>
            </react_native_1.TouchableOpacity>

            {/* Friends button with badge */}
            <react_native_1.TouchableOpacity style={styles.navIconBtn} onPress={() => router.push('/friends')}>
              <react_native_1.View>
                <FriendsIcon />
                {friendRequestCount > 0 && (<react_native_1.View style={styles.badge}>
                    <react_native_1.Text style={styles.badgeText}>{friendRequestCount > 9 ? '9+' : friendRequestCount}</react_native_1.Text>
                  </react_native_1.View>)}
              </react_native_1.View>
              <react_native_1.Text style={styles.navIconLabel}>Friends</react_native_1.Text>
            </react_native_1.TouchableOpacity>

            {/* Avatar / Profile button */}
            <react_native_1.TouchableOpacity style={styles.navIconBtn} onPress={() => router.push('/profile')}>
              <react_native_1.View>
                <Avatar_1.default avatarId={profile?.avatarId ?? 'avatar_01'} size={36} colourHex={profile?.colourHex ?? '#378ADD'}/>
                {isGuest && (<react_native_1.View style={styles.lockOverlay}>
                    <react_native_1.Text style={styles.lockOverlayText}>🔒</react_native_1.Text>
                  </react_native_1.View>)}
              </react_native_1.View>
              <react_native_1.Text style={styles.navIconLabel}>Profile</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
        </react_native_1.View>
        {/* ── Mode selector ── */}
        <react_native_1.View style={styles.modeRow}>
          <react_native_1.TouchableOpacity style={[styles.modeBtn, mode === 'online' && styles.modeBtnActive]} onPress={() => setMode(mode === 'online' ? 'none' : 'online')}>
            <react_native_1.Text style={[styles.modeBtnText, mode === 'online' && styles.modeBtnTextActive]}>
              Play Online
            </react_native_1.Text>
          </react_native_1.TouchableOpacity>
          <react_native_1.TouchableOpacity style={[styles.modeBtn, mode === 'ai' && styles.modeBtnActive]} onPress={() => setMode(mode === 'ai' ? 'none' : 'ai')}>
            <react_native_1.Text style={[styles.modeBtnText, mode === 'ai' && styles.modeBtnTextActive]}>
              Play vs AI
            </react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        {/* ── AI setup section ── */}
        {mode === 'ai' && (<react_native_1.View style={styles.card}>
            <react_native_1.Text style={styles.cardHeading}>Play vs AI</react_native_1.Text>

            <react_native_1.Text style={styles.inputLabel}>Your name</react_native_1.Text>
            <react_native_1.TextInput style={styles.input} value={aiName} onChangeText={setAiName} placeholder="Enter your name" placeholderTextColor="#757575" maxLength={20} returnKeyType="done"/>

            <react_native_1.Text style={styles.inputLabel}>Opponents</react_native_1.Text>
            <react_native_1.View style={styles.playerCountRow}>
              {[1, 2, 3].map((n) => (<react_native_1.TouchableOpacity key={n} style={[styles.countBtn, aiCount === n && styles.countBtnActive]} onPress={() => setAiCount(n)}>
                  <react_native_1.Text style={[
                    styles.countBtnText,
                    aiCount === n && styles.countBtnTextActive,
                ]}>
                    {n}
                  </react_native_1.Text>
                </react_native_1.TouchableOpacity>))}
            </react_native_1.View>

            <react_native_1.Text style={styles.inputLabel}>Turn timer</react_native_1.Text>
            <react_native_1.View style={styles.playerCountRow}>
              {TIMER_OPTIONS.map((opt) => (<react_native_1.TouchableOpacity key={opt.value} style={[styles.countBtn, turnDuration === opt.value && styles.countBtnActive]} onPress={() => setTurnDuration(opt.value)}>
                  <react_native_1.Text style={[styles.countBtnText, { fontSize: 13 }, turnDuration === opt.value && styles.countBtnTextActive]}>
                    {opt.label}
                  </react_native_1.Text>
                </react_native_1.TouchableOpacity>))}
            </react_native_1.View>

            <react_native_1.TouchableOpacity style={[styles.primaryBtn, !canStartAI && styles.btnDisabled]} onPress={handleStartAI} disabled={!canStartAI}>
              <react_native_1.Text style={[styles.primaryBtnText, !canStartAI && styles.btnDisabledText]}>
                Start Game
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>)}

        {/* ── Online section ── */}
        {mode === 'online' && (<react_native_1.View style={[styles.cardsRow, wide && styles.cardsRowWide]}>

            {/* ── Create a room card ── */}
            <react_native_1.View style={[styles.card, wide && styles.cardHalf]}>
              <react_native_1.Text style={styles.cardHeading}>Create a room</react_native_1.Text>

              <react_native_1.Text style={styles.inputLabel}>Your name</react_native_1.Text>
              <react_native_1.TextInput style={styles.input} value={createName} onChangeText={setCreateName} placeholder="Enter your name" placeholderTextColor="#757575" maxLength={20} returnKeyType="done"/>

              <react_native_1.Text style={styles.inputLabel}>Players</react_native_1.Text>
              <react_native_1.View style={styles.playerCountRow}>
                {[2, 3, 4].map((n) => (<react_native_1.TouchableOpacity key={n} style={[styles.countBtn, maxPlayers === n && styles.countBtnActive]} onPress={() => setMaxPlayers(n)}>
                    <react_native_1.Text style={[
                    styles.countBtnText,
                    maxPlayers === n && styles.countBtnTextActive,
                ]}>
                      {n}
                    </react_native_1.Text>
                  </react_native_1.TouchableOpacity>))}
              </react_native_1.View>

              <react_native_1.Text style={styles.inputLabel}>Turn timer</react_native_1.Text>
              <react_native_1.View style={styles.playerCountRow}>
                {TIMER_OPTIONS.map((opt) => (<react_native_1.TouchableOpacity key={opt.value} style={[styles.countBtn, turnDuration === opt.value && styles.countBtnActive]} onPress={() => setTurnDuration(opt.value)}>
                    <react_native_1.Text style={[styles.countBtnText, { fontSize: 13 }, turnDuration === opt.value && styles.countBtnTextActive]}>
                      {opt.label}
                    </react_native_1.Text>
                  </react_native_1.TouchableOpacity>))}
              </react_native_1.View>

              <react_native_1.TouchableOpacity style={[styles.primaryBtn, !canCreate && styles.btnDisabled]} onPress={handleCreate} disabled={!canCreate}>
                <react_native_1.Text style={[styles.primaryBtnText, !canCreate && styles.btnDisabledText]}>
                  Create Room
                </react_native_1.Text>
              </react_native_1.TouchableOpacity>

              {createError ? (<react_native_1.Text style={styles.inlineError}>{createError}</react_native_1.Text>) : null}
            </react_native_1.View>

            {/* ── Divider ── */}
            {wide ? (<react_native_1.View style={styles.verticalDivider}/>) : (<react_native_1.View style={styles.horizontalDivider}>
                <react_native_1.View style={styles.dividerLine}/>
                <react_native_1.Text style={styles.dividerOr}>or</react_native_1.Text>
                <react_native_1.View style={styles.dividerLine}/>
              </react_native_1.View>)}

            {/* ── Join a room card ── */}
            <react_native_1.View style={[styles.card, wide && styles.cardHalf]}>
              <react_native_1.Text style={styles.cardHeading}>Join a room</react_native_1.Text>

              <react_native_1.Text style={styles.inputLabel}>Your name</react_native_1.Text>
              <react_native_1.TextInput style={styles.input} value={joinName} onChangeText={setJoinName} placeholder="Enter your name" placeholderTextColor="#757575" maxLength={20} returnKeyType="next"/>

              <react_native_1.Text style={styles.inputLabel}>Room code</react_native_1.Text>
              <react_native_1.TextInput style={[styles.input, styles.codeInput]} value={joinCode} onChangeText={(t) => setJoinCode(t.toUpperCase())} placeholder="Enter 6-digit code" placeholderTextColor="#757575" autoCapitalize="characters" maxLength={6} returnKeyType="go" onSubmitEditing={handleJoin}/>

              <react_native_1.TouchableOpacity style={[styles.secondaryBtn, !canJoin && styles.btnDisabled]} onPress={handleJoin} disabled={!canJoin}>
                <react_native_1.Text style={[styles.secondaryBtnText, !canJoin && styles.btnDisabledText]}>
                  Join Room
                </react_native_1.Text>
              </react_native_1.TouchableOpacity>

              {joinError ? (<react_native_1.Text style={styles.inlineError}>{joinError}</react_native_1.Text>) : null}
            </react_native_1.View>

          </react_native_1.View>)}

        {/* ── How to play button — below both mode sections ── */}
        <react_native_1.TouchableOpacity style={styles.howToPlayBtn} onPress={() => setShowHowToPlay(true)}>
          <react_native_1.Text style={styles.howToPlayBtnText}>? How to play</react_native_1.Text>
        </react_native_1.TouchableOpacity>

      </react_native_1.ScrollView>

      <HowToPlayModal_1.HowToPlayModal visible={showHowToPlay} onClose={() => setShowHowToPlay(false)}/>
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: theme_1.THEME.appBackground,
    },
    // ── Guest banner ──────────────────────────────────────────
    guestBanner: {
        backgroundColor: 'rgba(201,168,76,0.07)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.25)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 8,
    },
    guestBannerText: {
        color: theme_1.THEME.textSecondary,
        fontSize: 12,
        flex: 1,
    },
    guestBannerLink: {
        color: theme_1.THEME.gold,
        fontSize: 12,
        fontWeight: '700',
    },
    // ── Title row ─────────────────────────────────────────────
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        position: 'relative',
    },
    title: {
        fontSize: 38,
        fontWeight: '800',
        color: theme_1.THEME.gold,
        textAlign: 'center',
        letterSpacing: 1,
    },
    profileBtnGroup: {
        position: 'absolute',
        right: 0,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
    },
    navIconBtn: {
        alignItems: 'center',
        gap: 2,
    },
    navIconLabel: {
        color: theme_1.THEME.textMuted,
        fontSize: 9,
        fontWeight: '600',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -4,
        backgroundColor: theme_1.THEME.danger,
        borderRadius: 7,
        minWidth: 14,
        height: 14,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 9,
        fontWeight: '800',
    },
    lockOverlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 8,
        padding: 1,
    },
    lockOverlayText: {
        fontSize: 10,
    },
    // ── Mode selector ─────────────────────────────────────────
    modeRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    modeBtn: {
        flex: 1,
        paddingVertical: 18,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'rgba(201,168,76,0.18)',
        backgroundColor: theme_1.THEME.cardBackground,
        alignItems: 'center',
    },
    modeBtnActive: {
        backgroundColor: theme_1.THEME.surfaceBackground,
        borderColor: theme_1.THEME.gold,
    },
    modeBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme_1.THEME.textMuted,
    },
    modeBtnTextActive: {
        color: theme_1.THEME.gold,
    },
    // ── Lobby layout ──────────────────────────────────────────
    lobbyScroll: {
        paddingHorizontal: 20,
        paddingTop: 48,
        paddingBottom: 40,
        flexGrow: 1,
    },
    cardsRow: {
        flexDirection: 'column',
        gap: 0,
    },
    cardsRowWide: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 0,
    },
    card: {
        backgroundColor: theme_1.THEME.cardBackground,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.18)',
        padding: 24,
        gap: 12,
    },
    cardHalf: {
        flex: 1,
    },
    cardHeading: {
        fontSize: 20,
        fontWeight: '700',
        color: theme_1.THEME.textPrimary,
        marginBottom: 4,
    },
    // ── Inputs ────────────────────────────────────────────────
    inputLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: theme_1.THEME.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: -4,
    },
    input: {
        backgroundColor: theme_1.THEME.surfaceBackground,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: theme_1.THEME.textPrimary,
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.2)',
    },
    codeInput: {
        letterSpacing: 3,
        fontWeight: '700',
    },
    // ── Player count selector ─────────────────────────────────
    playerCountRow: {
        flexDirection: 'row',
        gap: 10,
    },
    countBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(201,168,76,0.2)',
        alignItems: 'center',
    },
    countBtnActive: {
        backgroundColor: theme_1.THEME.surfaceBackground,
        borderColor: theme_1.THEME.gold,
    },
    countBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: theme_1.THEME.textMuted,
    },
    countBtnTextActive: {
        color: theme_1.THEME.gold,
    },
    // ── Buttons ───────────────────────────────────────────────
    primaryBtn: {
        backgroundColor: theme_1.THEME.gold,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 4,
    },
    primaryBtnText: {
        color: theme_1.THEME.appBackground,
        fontSize: 16,
        fontWeight: '800',
    },
    secondaryBtn: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: theme_1.THEME.gold,
        marginTop: 4,
    },
    secondaryBtnText: {
        color: theme_1.THEME.gold,
        fontSize: 16,
        fontWeight: '600',
    },
    btnDisabled: {
        backgroundColor: theme_1.THEME.cardBackground,
        borderColor: 'rgba(201,168,76,0.15)',
        opacity: 1,
    },
    btnDisabledText: {
        color: theme_1.THEME.textMuted,
    },
    // ── Dividers ──────────────────────────────────────────────
    verticalDivider: {
        width: 1,
        backgroundColor: 'rgba(201,168,76,0.15)',
        marginHorizontal: 16,
        alignSelf: 'stretch',
    },
    horizontalDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(201,168,76,0.15)',
    },
    dividerOr: {
        color: theme_1.THEME.textMuted,
        fontSize: 13,
    },
    // ── Inline error ──────────────────────────────────────────
    inlineError: {
        color: theme_1.THEME.danger,
        fontSize: 13,
        fontWeight: '500',
        marginTop: -4,
    },
    // ── Waiting room ──────────────────────────────────────────
    waitingScroll: {
        paddingHorizontal: 20,
        paddingTop: 48,
        paddingBottom: 40,
        flexGrow: 1,
        maxWidth: 520,
        alignSelf: 'center',
        width: '100%',
    },
    waitingCard: {
        backgroundColor: theme_1.THEME.cardBackground,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.18)',
        padding: 24,
        gap: 16,
    },
    roomCodeSection: {
        alignItems: 'center',
        backgroundColor: theme_1.THEME.appBackground,
        borderRadius: 12,
        paddingVertical: 20,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: theme_1.THEME.gold,
        gap: 8,
    },
    roomCodeLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: theme_1.THEME.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    roomCodeBig: {
        fontSize: 36,
        fontWeight: '800',
        color: theme_1.THEME.gold,
        letterSpacing: 6,
    },
    copyBtn: {
        borderWidth: 1,
        borderColor: theme_1.THEME.gold,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 7,
        marginTop: 4,
    },
    copyBtnText: {
        color: theme_1.THEME.gold,
        fontSize: 13,
        fontWeight: '600',
    },
    waitingStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    waitingText: {
        color: theme_1.THEME.textSecondary,
        fontSize: 14,
    },
    pulsingDots: {
        color: theme_1.THEME.gold,
        fontSize: 10,
        letterSpacing: 2,
        width: 28,
    },
    playersSectionTitle: {
        color: theme_1.THEME.textPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
    playerList: {
        flexGrow: 0,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme_1.THEME.surfaceBackground,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        marginBottom: 8,
    },
    playerRowName: {
        color: theme_1.THEME.textPrimary,
        fontSize: 15,
        flex: 1,
    },
    playerBadges: {
        flexDirection: 'row',
        gap: 6,
    },
    hostBadge: {
        color: theme_1.THEME.gold,
        fontSize: 10,
        fontWeight: '700',
        backgroundColor: 'rgba(201,168,76,0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    youBadge: {
        color: theme_1.THEME.success,
        fontSize: 10,
        fontWeight: '700',
        backgroundColor: 'rgba(93,202,165,0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    waitingHint: {
        color: theme_1.THEME.textMuted,
        textAlign: 'center',
        fontSize: 14,
    },
    howToPlayBtn: {
        alignSelf: 'center',
        marginTop: 28,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.2)',
    },
    howToPlayBtnText: {
        color: theme_1.THEME.textMuted,
        fontSize: 14,
        fontWeight: '500',
    },
});
//# sourceMappingURL=index.js.map