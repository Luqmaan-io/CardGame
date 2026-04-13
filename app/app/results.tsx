import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';
import { Confetti } from '../components/Confetti';
import { useSounds } from '../hooks/useSounds';
import { useHaptics } from '../hooks/useHaptics';
import Avatar from '../components/Avatar'
import { THEME } from '../utils/theme';

interface Standing {
  id: string;
  name: string;
  cardCount: number;
  score: number;
  isWinner: boolean;
  colourHex?: string;
  avatarId?: string;
}

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; playerName?: string; aiCount?: string }>();
  const isLocalMode = params.mode === 'local';
  const { width, height } = useWindowDimensions();

  const { startGame } = useSocket();
  const { gameState, myPlayerId, roomId, roomInfo, reset, setGameState } = useGameStore();
  const { playSound } = useSounds();
  const { trigger: haptic } = useHaptics();

  const winnerId = gameState?.winnerId ?? null;
  const isWinner = isLocalMode
    ? winnerId === 'player-human'
    : winnerId === myPlayerId;

  // ── Win pulse animation (gold border glow on winner row) ──────────────────
  const winPulse = useRef(new Animated.Value(0.4)).current;

  // ── Play win sound + haptic + start pulse animation ───────────────────────
  const didFireRef = useRef(false);
  useEffect(() => {
    if (didFireRef.current) return;
    didFireRef.current = true;

    // Play sound for winner
    if (isWinner) {
      playSound('win');
      haptic('success');
    }

    // Gold border pulse: opacity 0.4 → 1.0, 3 cycles, winner or not
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(winPulse, {
          toValue: 1.0,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(winPulse, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: false,
        }),
      ]),
      { iterations: 3 }
    );
    pulse.start();
  }, []);

  if (!gameState) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centred}>
          <Text style={styles.title}>Game Over</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => { reset(); router.replace('/'); }}
          >
            <Text style={styles.primaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  function resolvePlayerName(id: string): string {
    if (isLocalMode) {
      if (id === 'player-human') return params.playerName ?? 'You';
      const num = id.replace('ai-', '');
      return `AI ${num}`;
    }
    return roomInfo?.players.find((p) => p.playerId === id)?.name ?? id.slice(0, 8);
  }

  const winnerName = winnerId ? resolvePlayerName(winnerId) : 'Unknown';

  const standings: Standing[] = gameState.players
    .map((p) => ({
      id: p.id,
      name: resolvePlayerName(p.id),
      cardCount: p.hand.length,
      score: gameState.sessionScores[p.id] ?? 0,
      isWinner: p.id === winnerId,
      colourHex: p.colourHex,
      avatarId: (p as { avatarId?: string }).avatarId,
    }))
    .sort((a, b) => a.cardCount - b.cardCount);

  function handlePlayAgain() {
    if (isLocalMode) {
      setGameState(null as never);
      router.replace({
        pathname: '/game',
        params: {
          mode: 'local',
          playerName: params.playerName ?? 'Player',
          aiCount: params.aiCount ?? '1',
        },
      });
    } else if (roomId) {
      useGameStore.getState().setGameState(null as never);
      startGame(roomId);
    } else {
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

  return (
    <SafeAreaView style={styles.safe}>
      {/* Confetti falls on top of everything */}
      <Confetti width={width} height={height} active={isWinner} />

      <View style={styles.container}>
        <Text style={styles.trophy}>
          {isWinner ? '🏆' : ''}
        </Text>
        <Text style={styles.title}>
          {isWinner ? 'You Win!' : `${winnerName} wins!`}
        </Text>

        <Text style={styles.subtitle}>Final standings</Text>

        <FlatList
          data={standings}
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item, index }) => (
            item.isWinner ? (
              <Animated.View
                style={[
                  styles.row,
                  styles.winnerRow,
                  { borderColor: winnerBorderColor },
                ]}
              >
                <Text style={styles.position}>#{index + 1}</Text>
                <Avatar
                  avatarId={item.avatarId ?? 'avatar_01'}
                  size={48}
                  colourHex="#EF9F27"
                  showRing
                />
                <Text style={[styles.playerName, item.colourHex ? { color: item.colourHex } : undefined]}>{item.name}</Text>
                <View style={styles.rightSide}>
                  <Text style={styles.cardCount}>
                    {item.cardCount === 0 ? 'out!' : `${item.cardCount} cards`}
                  </Text>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{item.score} pt{item.score !== 1 ? 's' : ''}</Text>
                  </View>
                </View>
                <Text style={styles.crown}>♛</Text>
              </Animated.View>
            ) : (
              <View style={[styles.row]}>
                <Text style={styles.position}>#{index + 1}</Text>
                <Avatar
                  avatarId={item.avatarId ?? 'avatar_01'}
                  size={48}
                  colourHex={item.colourHex ?? '#378ADD'}
                  showRing
                />
                <Text style={[styles.playerName, item.colourHex ? { color: item.colourHex } : undefined]}>{item.name}</Text>
                <View style={styles.rightSide}>
                  <Text style={styles.cardCount}>
                    {item.cardCount === 0 ? 'out!' : `${item.cardCount} cards`}
                  </Text>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{item.score} pt{item.score !== 1 ? 's' : ''}</Text>
                  </View>
                </View>
              </View>
            )
          )}
        />

        {showPlayAgain && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handlePlayAgain}>
            <Text style={styles.primaryBtnText}>Play Again</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleHome}>
          <Text style={styles.secondaryBtnText}>Main Menu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.appBackground,
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
    color: THEME.gold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: THEME.textMuted,
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
    backgroundColor: THEME.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  winnerRow: {
    backgroundColor: THEME.surfaceBackground,
    borderWidth: 1.5,
  },
  position: {
    color: THEME.textMuted,
    fontSize: 15,
    width: 32,
    fontWeight: '600',
  },
  playerName: {
    color: THEME.textPrimary,
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },
  rightSide: {
    alignItems: 'flex-end',
    gap: 4,
  },
  cardCount: {
    color: THEME.textSecondary,
    fontSize: 13,
  },
  scoreBadge: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scoreText: {
    color: THEME.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  crown: {
    fontSize: 18,
    color: THEME.gold,
  },
  primaryBtn: {
    backgroundColor: THEME.gold,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: THEME.appBackground,
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
    color: THEME.textMuted,
    fontSize: 15,
  },
});
