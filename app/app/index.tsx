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

export default function HomeScreen() {
  const router = useRouter();
  const { createRoom, joinRoom, startGame } = useSocket();
  const { setPlayerName, roomId, roomInfo, myPlayerId, gameState, error, setError } =
    useGameStore();

  // Each card manages its own name field so the two flows are independent
  const [createName, setCreateName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4);
  // Track which card last triggered an action so errors appear in the right place
  const [lastAction, setLastAction] = useState<'create' | 'join' | null>(null);
  const [copied, setCopied] = useState(false);

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
    createRoom(maxPlayers);
  }

  function handleJoin() {
    if (!joinName.trim() || !joinCode.trim()) return;
    setPlayerName(joinName.trim());
    setLastAction('join');
    setError(null);
    joinRoom(joinCode.trim().toUpperCase());
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

  const isHost = roomInfo?.players[0]?.playerId === myPlayerId;
  const canStart = isHost && (roomInfo?.players.length ?? 0) >= 2;
  const createError = lastAction === 'create' ? error : null;
  const joinError = lastAction === 'join' ? error : null;
  const canCreate = createName.trim().length > 0;
  const canJoin = joinName.trim().length > 0 && joinCode.trim().length > 0;

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

  // ── Lobby (two-card layout) ────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.lobbyScroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Card Game</Text>

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#121212',
  },

  // ── Title ──────────────────────────────────────────────────
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 32,
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
    opacity: 1, // keep full opacity so it's clearly grey, not just faded
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
});
