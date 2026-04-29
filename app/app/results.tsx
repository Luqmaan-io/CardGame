import React, { useEffect, useRef, useState } from 'react';
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
import { CARD_BACKS_MAP } from '../assets/cardbacks';
import { CARD_FACES_MAP } from '../assets/cardfaces';

interface Standing {
  id: string;
  name: string;
  place: number;
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
  const { gameState, myPlayerId, roomId, roomInfo, reset, setGameState, newlyUnlockedDesigns, setNewlyUnlockedDesigns } = useGameStore();
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

  // Build standings from placements (already ordered by place)
  const allPlayers = [
    ...(gameState.placements.map((pl) => {
      const player = (gameState as { allPlayers?: { id: string; colourHex?: string; avatarId?: string }[] })
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
        avatarId: (p as { avatarId?: string }).avatarId,
      })),
  ];
  const standings: Standing[] = allPlayers.sort((a, b) => a.place - b.place);

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
          renderItem={({ item }) => {
            const placeBadge = item.place === 1 ? '♛' : item.place === 2 ? '🥈' : item.place === 3 ? '🥉' : null;
            const placeColor = item.place === 1 ? THEME.gold : item.place === 2 ? '#C0C0C0' : item.place === 3 ? '#CD7F32' : THEME.textMuted;
            return item.isWinner ? (
              <Animated.View
                style={[
                  styles.row,
                  styles.winnerRow,
                  { borderColor: winnerBorderColor },
                ]}
              >
                <Text style={[styles.position, { color: placeColor }]}>#{item.place}</Text>
                <Avatar
                  avatarId={item.avatarId ?? 'avatar_01'}
                  size={48}
                  colourHex="#EF9F27"
                  showRing
                />
                <Text style={[styles.playerName, item.colourHex ? { color: item.colourHex } : undefined]}>{item.name}</Text>
                <View style={styles.rightSide}>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{item.score} pt{item.score !== 1 ? 's' : ''}</Text>
                  </View>
                </View>
                {placeBadge && <Text style={[styles.crown, { color: placeColor }]}>{placeBadge}</Text>}
              </Animated.View>
            ) : (
              <View style={[styles.row]}>
                <Text style={[styles.position, { color: placeColor }]}>#{item.place}</Text>
                <Avatar
                  avatarId={item.avatarId ?? 'avatar_01'}
                  size={48}
                  colourHex={item.colourHex ?? '#378ADD'}
                  showRing
                />
                <Text style={[styles.playerName, item.colourHex ? { color: item.colourHex } : undefined]}>{item.name}</Text>
                <View style={styles.rightSide}>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{item.score} pt{item.score !== 1 ? 's' : ''}</Text>
                  </View>
                </View>
                {placeBadge && <Text style={[styles.crown, { color: placeColor }]}>{placeBadge}</Text>}
              </View>
            );
          }}
        />

        {/* ── Unlock notification ── */}
        {newlyUnlockedDesigns.length > 0 && (
          <TouchableOpacity
            style={styles.unlockBanner}
            onPress={() => {
              setNewlyUnlockedDesigns([]);
              router.push('/challenges');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.unlockBannerTitle}>✦ New unlock{newlyUnlockedDesigns.length > 1 ? 's' : ''}!</Text>
            <Text style={styles.unlockBannerSub}>
              {newlyUnlockedDesigns.map((id) => {
                const back = CARD_BACKS_MAP[id];
                const face = CARD_FACES_MAP[id];
                return back?.name ?? face?.name ?? id;
              }).join(', ')}
            </Text>
            <Text style={styles.unlockBannerCta}>View in Cards →</Text>
          </TouchableOpacity>
        )}

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
  unlockBanner: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.4)',
    padding: 14,
    gap: 4,
  },
  unlockBannerTitle: {
    color: THEME.gold,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  unlockBannerSub: {
    color: THEME.textPrimary,
    fontSize: 13,
  },
  unlockBannerCta: {
    color: THEME.gold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
