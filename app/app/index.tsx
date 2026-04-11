import React, { useEffect, useState } from 'react';
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
import AvatarPickerModal from '../components/AvatarPickerModal';
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

type Mode = 'none' | 'online' | 'ai';

export default function HomeScreen() {
  const router = useRouter();
  const { createRoom, joinRoom, startGame } = useSocket();
  const { setPlayerName, roomId, roomInfo, myPlayerId, gameState, error, setError } =
    useGameStore();
  const { profile, isGuest, updateProfile } = useAuth();

  // Mode selector
  const [mode, setMode] = useState<Mode>('none');

  // Online flow state — pre-filled from profile
  const [createName, setCreateName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4);
  const [lastAction, setLastAction] = useState<'create' | 'join' | null>(null);
  const [copied, setCopied] = useState(false);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [guestAvatarAlert, setGuestAvatarAlert] = useState(false);

  // AI flow state — pre-filled from profile
  const [aiName, setAiName] = useState('');
  const [aiCount, setAiCount] = useState<1 | 2 | 3>(1);

  // Pre-fill name fields from profile whenever profile loads
  useEffect(() => {
    if (profile?.username) {
      setCreateName(profile.username);
      setJoinName(profile.username);
      setAiName(profile.username);
    }
  }, [profile?.username]);

  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const { width } = useWindowDimensions();
  const wide = width >= 640;

  useEffect(() => {
    if (gameState) router.replace('/game');
  }, [gameState]);

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
    createRoom(maxPlayers, profile?.id, profile?.colourHex, profile?.avatarId);
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
        userId: profile?.id ?? '',
        colourHex: profile?.colourHex ?? '#378ADD',
        avatarId: profile?.avatarId ?? 'avatar_01',
      },
    });
  }

  async function handleAvatarSelect(avatarId: string) {
    try {
      await updateProfile({ avatarId });
    } catch { /* ignore */ }
  }

  function handleAvatarPress() {
    if (isGuest) {
      setGuestAvatarAlert(true);
      setTimeout(() => setGuestAvatarAlert(false), 3000);
    } else {
      setAvatarPickerVisible(true);
    }
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
          <Text style={styles.title}>Card Game</Text>

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
      <ScrollView
        contentContainerStyle={styles.lobbyScroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Guest banner */}
        {isGuest && (
          <View style={styles.guestBanner}>
            <Text style={styles.guestBannerText}>
              Playing as guest — create an account to save your stats
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth')}>
              <Text style={styles.guestBannerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Title row with profile icon */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Card Game</Text>
          <View style={styles.profileBtnGroup}>
            <TouchableOpacity onPress={handleAvatarPress}>
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
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileTextBtn} onPress={() => router.push('/profile')}>
              <Text style={styles.profileTextBtnText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
        {guestAvatarAlert && (
          <View style={styles.guestAvatarAlert}>
            <Text style={styles.guestAvatarAlertText}>Create an account to choose your avatar</Text>
          </View>
        )}

        {/* ── Mode selector ── */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'online' && styles.modeBtnActive]}
            onPress={() => setMode(mode === 'online' ? 'none' : 'online')}
          >
            <Text style={[styles.modeBtnText, mode === 'online' && styles.modeBtnTextActive]}>
              Play Online
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'ai' && styles.modeBtnActive]}
            onPress={() => setMode(mode === 'ai' ? 'none' : 'ai')}
          >
            <Text style={[styles.modeBtnText, mode === 'ai' && styles.modeBtnTextActive]}>
              Play vs AI
            </Text>
          </TouchableOpacity>
        </View>

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

        {/* ── Online section ── */}
        {mode === 'online' && (
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

      </ScrollView>

      <HowToPlayModal visible={showHowToPlay} onClose={() => setShowHowToPlay(false)} />

      {!isGuest && profile && (
        <AvatarPickerModal
          visible={avatarPickerVisible}
          currentAvatarId={profile.avatarId}
          colourHex={profile.colourHex}
          onSelect={handleAvatarSelect}
          onClose={() => setAvatarPickerVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#121212',
  },

  // ── Guest banner ──────────────────────────────────────────
  guestBanner: {
    backgroundColor: '#1a2a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2e7d32',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  guestBannerText: {
    color: '#9e9e9e',
    fontSize: 12,
    flex: 1,
  },
  guestBannerLink: {
    color: '#4caf50',
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
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  profileBtnGroup: {
    position: 'absolute',
    right: 0,
    alignItems: 'center',
    gap: 4,
  },
  profileTextBtn: {
    paddingHorizontal: 4,
  },
  profileTextBtnText: {
    color: '#616161',
    fontSize: 10,
    fontWeight: '600',
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
  guestAvatarAlert: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  guestAvatarAlertText: {
    color: '#9e9e9e',
    fontSize: 13,
    textAlign: 'center',
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
    borderColor: '#2a2a2a',
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#1b3a1f',
    borderColor: '#2e7d32',
  },
  modeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#616161',
  },
  modeBtnTextActive: {
    color: '#4caf50',
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
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 24,
    gap: 12,
  },
  cardHalf: {
    flex: 1,
  },
  cardHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },

  // ── Inputs ────────────────────────────────────────────────
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9e9e9e',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: -4,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#3a3a3a',
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
    borderColor: '#3a3a3a',
    alignItems: 'center',
  },
  countBtnActive: {
    backgroundColor: '#1b5e20',
    borderColor: '#2e7d32',
  },
  countBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#757575',
  },
  countBtnTextActive: {
    color: '#ffffff',
  },

  // ── Buttons ───────────────────────────────────────────────
  primaryBtn: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2e7d32',
    marginTop: 4,
  },
  secondaryBtnText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: '600',
  },
  btnDisabled: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a3a3a',
    opacity: 1,
  },
  btnDisabledText: {
    color: '#505050',
  },

  // ── Dividers ──────────────────────────────────────────────
  verticalDivider: {
    width: 1,
    backgroundColor: '#2a2a2a',
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
    backgroundColor: '#2a2a2a',
  },
  dividerOr: {
    color: '#505050',
    fontSize: 13,
  },

  // ── Inline error ──────────────────────────────────────────
  inlineError: {
    color: '#ef5350',
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
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 24,
    gap: 16,
  },
  roomCodeSection: {
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2e7d32',
    gap: 8,
  },
  roomCodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9e9e9e',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  roomCodeBig: {
    fontSize: 36,
    fontWeight: '800',
    color: '#4caf50',
    letterSpacing: 6,
  },
  copyBtn: {
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
  },
  copyBtnText: {
    color: '#4caf50',
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
    color: '#9e9e9e',
    fontSize: 14,
  },
  pulsingDots: {
    color: '#4caf50',
    fontSize: 10,
    letterSpacing: 2,
    width: 28,
  },
  playersSectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  playerList: {
    flexGrow: 0,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  playerRowName: {
    color: '#ffffff',
    fontSize: 15,
    flex: 1,
  },
  playerBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  hostBadge: {
    color: '#ffd54f',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(255,213,79,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadge: {
    color: '#4caf50',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(76,175,80,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  waitingHint: {
    color: '#616161',
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
    borderColor: '#2a2a2a',
  },
  howToPlayBtnText: {
    color: '#616161',
    fontSize: 14,
    fontWeight: '500',
  },
});
