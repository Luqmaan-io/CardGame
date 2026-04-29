import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';
import { HowToPlayModal } from '../components/HowToPlayModal';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { useFriendRequests } from '../hooks/useFriendRequests';
import HomeActivity from '../components/HomeActivity';
import { THEME } from '../utils/theme';

function FriendsIcon({ colour = '#616161' }: { colour?: string }) {
  return (
    <View style={{ width: 36, height: 36 }}>
      {/* Back person head */}
      <View style={{ position: 'absolute', right: 5, top: 4, width: 12, height: 12, borderRadius: 6, backgroundColor: colour, opacity: 0.55 }} />
      {/* Back person body */}
      <View style={{ position: 'absolute', right: 1, bottom: 5, width: 16, height: 10, borderRadius: 5, backgroundColor: colour, opacity: 0.55 }} />
      {/* Front person head */}
      <View style={{ position: 'absolute', left: 5, top: 6, width: 13, height: 13, borderRadius: 6.5, backgroundColor: colour }} />
      {/* Front person body */}
      <View style={{ position: 'absolute', left: 1, bottom: 4, width: 17, height: 11, borderRadius: 6, backgroundColor: colour }} />
    </View>
  )
}

function CardsIcon({ colour = '#616161' }: { colour?: string }) {
  return (
    <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
      {/* Back card */}
      <View style={{ position: 'absolute', width: 18, height: 24, borderRadius: 3, backgroundColor: colour, opacity: 0.45, transform: [{ rotate: '-10deg' }, { translateX: -5 }] }} />
      {/* Front card */}
      <View style={{ width: 18, height: 24, borderRadius: 3, backgroundColor: colour, transform: [{ rotate: '5deg' }] }} />
    </View>
  )
}

function TrophyIcon({ colour = '#616161' }: { colour?: string }) {
  return (
    <View style={{ width: 36, height: 36, alignItems: 'center' }}>
      {/* Cup with handles */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 5 }}>
        <View style={{ width: 4, height: 10, backgroundColor: colour, borderTopLeftRadius: 2 }} />
        <View style={{ width: 16, height: 14, backgroundColor: colour, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }} />
        <View style={{ width: 4, height: 10, backgroundColor: colour, borderTopRightRadius: 2 }} />
      </View>
      {/* Stem */}
      <View style={{ width: 4, height: 5, backgroundColor: colour }} />
      {/* Base */}
      <View style={{ width: 16, height: 3, backgroundColor: colour, borderRadius: 1.5 }} />
    </View>
  )
}
// Subtle animated waiting indicator — three dots that cycle 1→2→3→1
function PulsingDots() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 3), 600);
    return () => clearInterval(id);
  }, []);
  const dots = ['●', '● ●', '● ● ●'][step];
  return <Text style={styles.pulsingDots}>{dots}</Text>;
}

const TIMER_OPTIONS = [
  { label: '15s',  value: 15,  description: 'Blitz'    },
  { label: '30s',  value: 30,  description: 'Standard' },
  { label: '60s',  value: 60,  description: 'Casual'   },
  { label: '2m',   value: 120, description: 'Relaxed'  },
  { label: 'None', value: 0,   description: 'No limit' },
];

type Mode = 'none' | 'quickplay' | 'private' | 'ai';

export default function HomeScreen() {
  const router = useRouter();
  const { createRoom, joinRoom, startGame } = useSocket();
  const { setPlayerName, roomId, roomInfo, myPlayerId, gameState, error, setError, socket } =
    useGameStore();
  const { profile, isGuest } = useAuth();
  const { friendRequestCount } = useFriendRequests(profile?.id);

  // Mode selector
  const [mode, setMode] = useState<Mode>('none');

  // Matchmaking state
  const [inQueue, setInQueue] = useState(false);
  const [playersInQueue, setPlayersInQueue] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [matchFound, setMatchFound] = useState(false);
  const [matchPlayers, setMatchPlayers] = useState<{ id: string; name: string; avatarId: string; colourHex: string; isAI: boolean }[]>([]);
  const [startCountdown, setStartCountdown] = useState(3);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Online flow state — pre-filled from profile
  const [createName, setCreateName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4);
  const [lastAction, setLastAction] = useState<'create' | 'join' | null>(null);
  const [copied, setCopied] = useState(false);

  // AI flow state — pre-filled from profile
  const [aiName, setAiName] = useState('');
  const [aiCount, setAiCount] = useState<1 | 2 | 3>(1);

  // Turn timer duration — shared across online + AI modes
  const [turnDuration, setTurnDuration] = useState(30);

  // Pre-fill name fields from profile whenever profile loads
  useEffect(() => {
    if (profile?.username) {
      setCreateName(profile.username);
      setJoinName(profile.username);
      setAiName(profile.username);
    }
  }, [profile?.username]);

  // Matchmaking socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('queue:joined', ({ waitTime }: { position: number; waitTime: number }) => {
      setInQueue(true);
      setTimeRemaining(waitTime);
    });

    socket.on('queue:update', ({ playersInQueue: count, estimatedWait }: { playersInQueue: number; position: number; estimatedWait: number }) => {
      setPlayersInQueue(count);
      setTimeRemaining(estimatedWait);
    });

    socket.on('queue:matched', ({ roomId: matchedRoomId, players }: { roomId: string; players: typeof matchPlayers }) => {
      setMatchFound(true);
      setMatchPlayers(players);
      setStartCountdown(3);
      useGameStore.getState().setRoom(matchedRoomId, profile?.id ?? '');
      let count = 3;
      countdownIntervalRef.current = setInterval(() => {
        count--;
        setStartCountdown(count);
        if (count === 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          router.replace({ pathname: '/game', params: { mode: 'online', roomId: matchedRoomId, isRanked: 'true' } });
        }
      }, 1000);
    });

    socket.on('queue:failed', ({ reason }: { reason: string }) => {
      setInQueue(false);
      setMode('none');
      setError(reason);
    });

    return () => {
      socket.off('queue:joined');
      socket.off('queue:update');
      socket.off('queue:matched');
      socket.off('queue:failed');
    };
  }, [socket, profile?.id]);

  function handleJoinQueue() {
    if (!socket) return;
    setInQueue(false);
    setMatchFound(false);
    setPlayersInQueue(0);
    socket.emit('queue:join', {
      playerId: profile?.id ?? `guest_${Date.now()}`,
      playerName: profile?.username ?? 'Player',
      avatarId: profile?.avatarId ?? 'avatar_01',
      colourHex: profile?.colourHex ?? '#378ADD',
    });
  }

  function handleLeaveQueue() {
    if (!socket) return;
    socket.emit('queue:leave');
    setInQueue(false);
    setMode('none');
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }

  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const { width } = useWindowDimensions();
  const wide = width >= 640;

  useEffect(() => {
    if (gameState) router.replace('/game');
  }, [gameState]);

  useEffect(() => {
    if (mode === 'quickplay' && socket && !inQueue && !matchFound) {
      handleJoinQueue();
    }
  }, [mode, socket]);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(id);
  }, [error]);

  function handleCreate() {
    if (!createName.trim()) return;
    setPlayerName(createName.trim());
    setLastAction('create');
    setError(null);
    createRoom(maxPlayers, profile?.id, profile?.colourHex, profile?.avatarId, turnDuration);
  }

  function handleJoin() {
    if (!joinName.trim() || !joinCode.trim()) return;
    setPlayerName(joinName.trim());
    setLastAction('join');
    setError(null);
    joinRoom(joinCode.trim().toUpperCase(), profile?.id, profile?.colourHex, profile?.avatarId);
  }

  async function handleCopy() {
    if (!roomId) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(roomId);
      }
    } catch (_) {
      // clipboard unavailable — still show the feedback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleStartAI() {
    if (!aiName.trim()) return;
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
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.waitingScroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>POWERSTACK</Text>

          <View style={styles.waitingCard}>
            {/* Room code section */}
            <View style={styles.roomCodeSection}>
              <Text style={styles.roomCodeLabel}>Room Code</Text>
              <Text style={styles.roomCodeBig}>{roomId}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                <Text style={styles.copyBtnText}>{copied ? '✓ Copied!' : 'Copy Code'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.waitingStatus}>
              <Text style={styles.waitingText}>Waiting for players</Text>
              <PulsingDots />
            </View>

            <Text style={styles.playersSectionTitle}>
              Players ({roomInfo?.players.length ?? 0} / {roomInfo?.maxPlayers ?? 4})
            </Text>

            <FlatList
              data={roomInfo?.players ?? []}
              keyExtractor={(item) => item.playerId}
              scrollEnabled={false}
              renderItem={({ item, index }) => (
                <View style={styles.playerRow}>
                  <Text style={styles.playerRowName}>{item.name}</Text>
                  <View style={styles.playerBadges}>
                    {index === 0 && <Text style={styles.hostBadge}>HOST</Text>}
                    {item.playerId === myPlayerId && (
                      <Text style={styles.youBadge}>YOU</Text>
                    )}
                  </View>
                </View>
              )}
              style={styles.playerList}
            />

            {canStart ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => startGame(roomId)}
              >
                <Text style={styles.primaryBtnText}>Start Game</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.waitingHint}>
                {isHost
                  ? 'Waiting for at least 2 players to join…'
                  : 'Waiting for the host to start the game…'}
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Lobby ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      {/* Subtle grid background — web only */}
      {Platform.OS === 'web' && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          opacity: 0.03,
          // @ts-ignore — web-only style
          backgroundImage: `linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />
      )}
      <ScrollView
        contentContainerStyle={styles.lobbyScroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Guest banner */}
        {isGuest && (
          <View style={{
            backgroundColor: 'rgba(201,168,76,0.08)',
            borderBottomWidth: 0.5,
            borderBottomColor: 'rgba(201,168,76,0.2)',
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginHorizontal: -20,
            marginTop: -48,
            marginBottom: 24,
          }}>
            <Text style={{ color: THEME.textMuted, fontSize: 12 }}>
              Playing as guest — stats not saved
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => router.push('/auth')}>
                <Text style={{ color: THEME.gold, fontSize: 12, fontWeight: '500' }}>
                  Sign in
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/auth')}>
                <Text style={{ color: THEME.gold, fontSize: 12, fontWeight: '500' }}>
                  Create account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Title row with profile icon */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>POWERSTACK</Text>
          <View style={styles.profileBtnGroup}>
            {/* Cards / Challenges button */}
            <TouchableOpacity style={styles.navIconBtn} onPress={() => router.push('/challenges')}>
              <CardsIcon colour={THEME.textMuted} />
              <Text style={styles.navIconLabel}>Cards</Text>
            </TouchableOpacity>

            {/* Leaderboard button */}
            <TouchableOpacity style={styles.navIconBtn} onPress={() => router.push('/leaderboard')}>
              <TrophyIcon />
              <Text style={styles.navIconLabel}>Ranks</Text>
            </TouchableOpacity>

            {/* Friends button with badge */}
            <TouchableOpacity style={styles.navIconBtn} onPress={() => router.push('/friends')}>
              <View>
                <FriendsIcon />
                {friendRequestCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{friendRequestCount > 9 ? '9+' : friendRequestCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.navIconLabel}>Friends</Text>
            </TouchableOpacity>

            {/* Avatar / Profile button */}
            <TouchableOpacity style={styles.navIconBtn} onPress={() => router.push('/profile')}>
              <View>
                <Avatar
                  avatarId={profile?.avatarId ?? 'avatar_01'}
                  size={36}
                  colourHex={profile?.colourHex ?? '#378ADD'}
                />
                {isGuest && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockOverlayText}>🔒</Text>
                  </View>
                )}
              </View>
              <Text style={styles.navIconLabel}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* ── Mode selector ── */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'quickplay' && styles.modeBtnActive]}
            onPress={() => setMode(mode === 'quickplay' ? 'none' : 'quickplay')}
          >
            <Text style={[styles.modeBtnTitle, mode === 'quickplay' && styles.modeBtnTitleActive]}>⚡ Quick Play</Text>
            <Text style={[styles.modeBtnSub, mode === 'quickplay' && styles.modeBtnSubActive]}>Ranked • Global matchmaking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'private' && styles.modeBtnActive]}
            onPress={() => setMode(mode === 'private' ? 'none' : 'private')}
          >
            <Text style={[styles.modeBtnTitle, mode === 'private' && styles.modeBtnTitleActive]}>🔒 Private Game</Text>
            <Text style={[styles.modeBtnSub, mode === 'private' && styles.modeBtnSubActive]}>Play with friends</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'ai' && styles.modeBtnActive]}
            onPress={() => setMode(mode === 'ai' ? 'none' : 'ai')}
          >
            <Text style={[styles.modeBtnTitle, mode === 'ai' && styles.modeBtnTitleActive]}>🤖 vs AI</Text>
            <Text style={[styles.modeBtnSub, mode === 'ai' && styles.modeBtnSubActive]}>Solo • Practice</Text>
          </TouchableOpacity>
        </View>

        {/* ── Quick Play matchmaking screen ── */}
        {mode === 'quickplay' && !matchFound && (
          <View style={styles.matchmakingScreen}>
            <Text style={styles.matchmakingTitle}>
              {inQueue ? 'Finding players...' : 'Connecting...'}
            </Text>
            <View style={styles.pulseContainer}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[styles.playerDot, { backgroundColor: playersInQueue > i ? THEME.gold : THEME.textMuted }]}
                />
              ))}
            </View>
            <Text style={styles.queueText}>{playersInQueue} / 4 players found</Text>
            {inQueue && (
              <Text style={styles.countdownText}>
                Starting in {Math.ceil(timeRemaining / 1000)}s
                {playersInQueue < 4 ? ' (AI will fill remaining slots)' : ''}
              </Text>
            )}
            <TouchableOpacity onPress={handleLeaveQueue} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Match found countdown ── */}
        {mode === 'quickplay' && matchFound && (
          <View style={styles.matchFoundScreen}>
            <Text style={styles.matchFoundTitle}>Match found!</Text>
            <View style={styles.playersRow}>
              {matchPlayers.map((p) => (
                <View key={p.id} style={styles.matchPlayerSlot}>
                  <Avatar avatarId={p.avatarId} size={48} colourHex={p.colourHex} />
                  <Text style={styles.matchPlayerName} numberOfLines={1}>{p.name}</Text>
                  {p.isAI && <Text style={styles.aiLabel}>AI</Text>}
                </View>
              ))}
            </View>
            <Text style={styles.startingText}>Starting in {startCountdown}...</Text>
          </View>
        )}

        {/* ── AI setup section ── */}
        {mode === 'ai' && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Play vs AI</Text>

            <Text style={styles.inputLabel}>Your name</Text>
            <TextInput
              style={styles.input}
              value={aiName}
              onChangeText={setAiName}
              placeholder="Enter your name"
              placeholderTextColor="#757575"
              maxLength={20}
              returnKeyType="done"
            />

            <Text style={styles.inputLabel}>Opponents</Text>
            <View style={styles.playerCountRow}>
              {([1, 2, 3] as const).map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.countBtn, aiCount === n && styles.countBtnActive]}
                  onPress={() => setAiCount(n)}
                >
                  <Text
                    style={[
                      styles.countBtnText,
                      aiCount === n && styles.countBtnTextActive,
                    ]}
                  >
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Turn timer</Text>
            <View style={styles.playerCountRow}>
              {TIMER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.countBtn, turnDuration === opt.value && styles.countBtnActive]}
                  onPress={() => setTurnDuration(opt.value)}
                >
                  <Text style={[styles.countBtnText, { fontSize: 13 }, turnDuration === opt.value && styles.countBtnTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, !canStartAI && styles.btnDisabled]}
              onPress={handleStartAI}
              disabled={!canStartAI}
            >
              <Text style={[styles.primaryBtnText, !canStartAI && styles.btnDisabledText]}>
                Start Game
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Private Game section ── */}
        {mode === 'private' && (
          <View style={[styles.cardsRow, wide && styles.cardsRowWide]}>

            {/* ── Create a room card ── */}
            <View style={[styles.card, wide && styles.cardHalf]}>
              <Text style={styles.cardHeading}>Create a room</Text>

              <Text style={styles.inputLabel}>Your name</Text>
              <TextInput
                style={styles.input}
                value={createName}
                onChangeText={setCreateName}
                placeholder="Enter your name"
                placeholderTextColor="#757575"
                maxLength={20}
                returnKeyType="done"
              />

              <Text style={styles.inputLabel}>Players</Text>
              <View style={styles.playerCountRow}>
                {([2, 3, 4] as const).map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.countBtn, maxPlayers === n && styles.countBtnActive]}
                    onPress={() => setMaxPlayers(n)}
                  >
                    <Text
                      style={[
                        styles.countBtnText,
                        maxPlayers === n && styles.countBtnTextActive,
                      ]}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Turn timer</Text>
              <View style={styles.playerCountRow}>
                {TIMER_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.countBtn, turnDuration === opt.value && styles.countBtnActive]}
                    onPress={() => setTurnDuration(opt.value)}
                  >
                    <Text style={[styles.countBtnText, { fontSize: 13 }, turnDuration === opt.value && styles.countBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, !canCreate && styles.btnDisabled]}
                onPress={handleCreate}
                disabled={!canCreate}
              >
                <Text
                  style={[styles.primaryBtnText, !canCreate && styles.btnDisabledText]}
                >
                  Create Room
                </Text>
              </TouchableOpacity>

              {createError ? (
                <Text style={styles.inlineError}>{createError}</Text>
              ) : null}
            </View>

            {/* ── Divider ── */}
            {wide ? (
              <View style={styles.verticalDivider} />
            ) : (
              <View style={styles.horizontalDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerOr}>or</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            {/* ── Join a room card ── */}
            <View style={[styles.card, wide && styles.cardHalf]}>
              <Text style={styles.cardHeading}>Join a room</Text>

              <Text style={styles.inputLabel}>Your name</Text>
              <TextInput
                style={styles.input}
                value={joinName}
                onChangeText={setJoinName}
                placeholder="Enter your name"
                placeholderTextColor="#757575"
                maxLength={20}
                returnKeyType="next"
              />

              <Text style={styles.inputLabel}>Room code</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={joinCode}
                onChangeText={(t) => setJoinCode(t.toUpperCase())}
                placeholder="Enter 6-digit code"
                placeholderTextColor="#757575"
                autoCapitalize="characters"
                maxLength={6}
                returnKeyType="go"
                onSubmitEditing={handleJoin}
              />

              <TouchableOpacity
                style={[styles.secondaryBtn, !canJoin && styles.btnDisabled]}
                onPress={handleJoin}
                disabled={!canJoin}
              >
                <Text
                  style={[styles.secondaryBtnText, !canJoin && styles.btnDisabledText]}
                >
                  Join Room
                </Text>
              </TouchableOpacity>

              {joinError ? (
                <Text style={styles.inlineError}>{joinError}</Text>
              ) : null}
            </View>

          </View>
        )}

        {/* ── How to play button — below both mode sections ── */}
        <TouchableOpacity style={styles.howToPlayBtn} onPress={() => setShowHowToPlay(true)}>
          <Text style={styles.howToPlayBtnText}>? How to play</Text>
        </TouchableOpacity>

        {/* ── Guest sign-in prompt ── */}
        {isGuest && (
          <View style={{
            marginHorizontal: 16,
            marginBottom: 16,
            padding: 16,
            borderWidth: 0.5,
            borderColor: THEME.gold,
            borderRadius: 8,
            backgroundColor: 'rgba(201,168,76,0.06)',
            alignItems: 'center',
            gap: 10,
          }}>
            <Text style={{ color: THEME.textPrimary, fontSize: 14 }}>
              Playing as guest — your stats aren't being saved
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.push('/auth')}
                style={{
                  backgroundColor: THEME.gold,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 4,
                }}
              >
                <Text style={{ color: THEME.appBackground, fontSize: 13, fontWeight: '500' }}>
                  Sign in
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/auth')}
                style={{
                  borderWidth: 0.5,
                  borderColor: THEME.gold,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 4,
                }}
              >
                <Text style={{ color: THEME.gold, fontSize: 13 }}>
                  Create account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Live section ── */}
        <HomeActivity userId={profile?.id ?? null} isGuest={isGuest} />

        {/* ── Landing page link ── */}
        {Platform.OS === 'web' && (
          <TouchableOpacity
            onPress={() => { if (typeof window !== 'undefined') window.open('/landing.html', '_blank'); }}
            style={{ marginTop: 8, marginBottom: 8, alignItems: 'center' }}
          >
            <Text style={{ color: THEME.textMuted, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
              What is Powerstack?
            </Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      <HowToPlayModal visible={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.appBackground,
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
    color: THEME.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  guestBannerLink: {
    color: THEME.gold,
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
    fontFamily: 'Cormorant_600SemiBold',
    fontSize: 42,
    color: THEME.gold,
    textAlign: 'center',
    letterSpacing: 2,
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
    color: THEME.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: THEME.danger,
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
    gap: 8,
    marginBottom: 24,
  },
  modeBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(201,168,76,0.25)',
    backgroundColor: 'rgba(17,34,64,0.6)',
    alignItems: 'center',
    gap: 4,
  },
  modeBtnActive: {
    backgroundColor: 'rgba(17,34,64,0.9)',
    borderColor: THEME.gold,
  },
  modeBtnTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: THEME.textMuted,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  modeBtnTitleActive: {
    color: THEME.gold,
  },
  modeBtnSub: {
    fontSize: 9,
    color: THEME.textMuted,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modeBtnSubActive: {
    color: THEME.textSecondary,
  },
  // keep old modeBtnText for any remaining usage
  modeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textMuted,
  },
  modeBtnTextActive: {
    color: THEME.gold,
  },

  // ── Matchmaking ───────────────────────────────────────────
  matchmakingScreen: {
    backgroundColor: THEME.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.18)',
    padding: 28,
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  matchmakingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  pulseContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  playerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  queueText: {
    color: THEME.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  countdownText: {
    color: THEME.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: THEME.danger,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 4,
  },
  cancelBtnText: {
    color: THEME.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  matchFoundScreen: {
    backgroundColor: THEME.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.gold,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  matchFoundTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.gold,
  },
  playersRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  matchPlayerSlot: {
    alignItems: 'center',
    gap: 4,
    width: 64,
  },
  matchPlayerName: {
    color: THEME.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  aiLabel: {
    color: THEME.textMuted,
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: THEME.surfaceBackground,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  startingText: {
    color: THEME.gold,
    fontSize: 16,
    fontWeight: '700',
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
    backgroundColor: THEME.cardBackground,
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
    color: THEME.textPrimary,
    marginBottom: 4,
  },

  // ── Inputs ────────────────────────────────────────────────
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: -4,
  },
  input: {
    backgroundColor: THEME.surfaceBackground,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: THEME.textPrimary,
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
    backgroundColor: THEME.surfaceBackground,
    borderColor: THEME.gold,
  },
  countBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.textMuted,
  },
  countBtnTextActive: {
    color: THEME.gold,
  },

  // ── Buttons ───────────────────────────────────────────────
  primaryBtn: {
    backgroundColor: THEME.gold,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: THEME.appBackground,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME.gold,
    marginTop: 4,
  },
  secondaryBtnText: {
    color: THEME.gold,
    fontSize: 16,
    fontWeight: '600',
  },
  btnDisabled: {
    backgroundColor: THEME.cardBackground,
    borderColor: 'rgba(201,168,76,0.15)',
    opacity: 1,
  },
  btnDisabledText: {
    color: THEME.textMuted,
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
    color: THEME.textMuted,
    fontSize: 13,
  },

  // ── Inline error ──────────────────────────────────────────
  inlineError: {
    color: THEME.danger,
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
    backgroundColor: THEME.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.18)',
    padding: 24,
    gap: 16,
  },
  roomCodeSection: {
    alignItems: 'center',
    backgroundColor: THEME.appBackground,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: THEME.gold,
    gap: 8,
  },
  roomCodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  roomCodeBig: {
    fontSize: 36,
    fontWeight: '800',
    color: THEME.gold,
    letterSpacing: 6,
  },
  copyBtn: {
    borderWidth: 1,
    borderColor: THEME.gold,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
  },
  copyBtnText: {
    color: THEME.gold,
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
    color: THEME.textSecondary,
    fontSize: 14,
  },
  pulsingDots: {
    color: THEME.gold,
    fontSize: 10,
    letterSpacing: 2,
    width: 28,
  },
  playersSectionTitle: {
    color: THEME.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  playerList: {
    flexGrow: 0,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surfaceBackground,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  playerRowName: {
    color: THEME.textPrimary,
    fontSize: 15,
    flex: 1,
  },
  playerBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  hostBadge: {
    color: THEME.gold,
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(201,168,76,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadge: {
    color: THEME.success,
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(93,202,165,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  waitingHint: {
    color: THEME.textMuted,
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
    color: THEME.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});
