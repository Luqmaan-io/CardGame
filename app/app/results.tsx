import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';

interface Standing {
  id: string;
  name: string;
  cardCount: number;
  isWinner: boolean;
}

export default function ResultsScreen() {
  const router = useRouter();
  const { startGame } = useSocket();
  const { gameState, myPlayerId, roomId, roomInfo, reset } = useGameStore();

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

  const winnerId = gameState.winnerId;
  const isWinner = winnerId === myPlayerId;

  const winnerName =
    roomInfo?.players.find((p) => p.playerId === winnerId)?.name ??
    winnerId?.slice(0, 8) ??
    'Unknown';

  const standings: Standing[] = gameState.players
    .map((p) => ({
      id: p.id,
      name:
        roomInfo?.players.find((rp) => rp.playerId === p.id)?.name ??
        p.id.slice(0, 8),
      cardCount: p.hand.length,
      isWinner: p.id === winnerId,
    }))
    .sort((a, b) => a.cardCount - b.cardCount);

  function handlePlayAgain() {
    if (roomId) {
      // Reset game state but keep room/socket alive
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>
          {isWinner ? '🏆 You Win!' : `${winnerName} wins!`}
        </Text>

        <Text style={styles.subtitle}>Final standings</Text>

        <FlatList
          data={standings}
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item, index }) => (
            <View style={[styles.row, item.isWinner && styles.winnerRow]}>
              <Text style={styles.position}>#{index + 1}</Text>
              <Text style={styles.playerName}>{item.name}</Text>
              <Text style={styles.cardCount}>
                {item.cardCount === 0 ? 'out!' : `${item.cardCount} cards`}
              </Text>
              {item.isWinner && <Text style={styles.crown}>♛</Text>}
            </View>
          )}
        />

        {roomId && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handlePlayAgain}>
            <Text style={styles.primaryBtnText}>Play Again</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleHome}>
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    gap: 16,
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffd54f',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#616161',
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
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  winnerRow: {
    backgroundColor: '#1a3a1a',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  position: {
    color: '#616161',
    fontSize: 15,
    width: 32,
    fontWeight: '600',
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },
  cardCount: {
    color: '#9e9e9e',
    fontSize: 14,
  },
  crown: {
    fontSize: 18,
    color: '#ffd54f',
  },
  primaryBtn: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#616161',
    fontSize: 15,
  },
});
