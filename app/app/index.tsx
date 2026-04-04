import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';

export default function HomeScreen() {
  const router = useRouter();
  const { createRoom, joinRoom, startGame } = useSocket();
  const { playerName, setPlayerName, roomId, roomInfo, myPlayerId, gameState } =
    useGameStore();
  const [joinCode, setJoinCode] = useState('');

  // Navigate to game as soon as the server broadcasts game:state
  useEffect(() => {
    if (gameState) {
      router.replace('/game');
    }
  }, [gameState]);

  function handleCreate() {
    if (!playerName.trim()) {
      Alert.alert('Name required', 'Enter your name first');
      return;
    }
    createRoom(4);
  }

  function handleJoin() {
    if (!playerName.trim()) {
      Alert.alert('Name required', 'Enter your name first');
      return;
    }
    if (!joinCode.trim()) {
      Alert.alert('Room code required', 'Enter a room code');
      return;
    }
    joinRoom(joinCode.trim().toUpperCase());
  }

  const isHost = roomInfo?.players[0]?.playerId === myPlayerId;
  const canStart = isHost && (roomInfo?.players.length ?? 0) >= 2;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Card Game</Text>

        {!roomId ? (
          // ── Lobby ──────────────────────────────────────────────────
          <View style={styles.lobby}>
            <Text style={styles.label}>Your name</Text>
            <TextInput
              style={styles.input}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Enter name"
              placeholderTextColor="#616161"
              maxLength={20}
              returnKeyType="done"
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate}>
              <Text style={styles.primaryBtnText}>Create Room</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.line} />
            </View>

            <Text style={styles.label}>Room code</Text>
            <TextInput
              style={styles.input}
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder="XXXXXXXX"
              placeholderTextColor="#616161"
              autoCapitalize="characters"
              maxLength={8}
              returnKeyType="go"
              onSubmitEditing={handleJoin}
            />
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleJoin}>
              <Text style={styles.secondaryBtnText}>Join Room</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ── Waiting Room ───────────────────────────────────────────
          <View style={styles.waitingRoom}>
            <View style={styles.roomCodeBox}>
              <Text style={styles.roomCodeLabel}>Room code</Text>
              <Text style={styles.roomCode}>{roomId}</Text>
              <Text style={styles.roomCodeHint}>Share this with friends</Text>
            </View>

            <Text style={styles.sectionTitle}>
              Players ({roomInfo?.players.length ?? 0} / {roomInfo?.maxPlayers ?? 4})
            </Text>

            <FlatList
              data={roomInfo?.players ?? []}
              keyExtractor={(item) => item.playerId}
              renderItem={({ item, index }) => (
                <View style={styles.playerRow}>
                  <Text style={styles.playerName}>{item.name}</Text>
                  {index === 0 && <Text style={styles.hostBadge}>HOST</Text>}
                  {item.playerId === myPlayerId && (
                    <Text style={styles.youBadge}>YOU</Text>
                  )}
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
                Waiting for more players to join…
              </Text>
            )}
          </View>
        )}
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
    paddingTop: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 0.5,
  },
  lobby: {
    gap: 10,
  },
  label: {
    color: '#9e9e9e',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  input: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  primaryBtn: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
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
    borderWidth: 1.5,
    borderColor: '#2e7d32',
    marginTop: 4,
  },
  secondaryBtnText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#2a2a2a',
  },
  orText: {
    color: '#616161',
    fontSize: 14,
  },
  // Waiting room
  waitingRoom: {
    flex: 1,
    gap: 16,
  },
  roomCodeBox: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  roomCodeLabel: {
    color: '#9e9e9e',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  roomCode: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4caf50',
    letterSpacing: 4,
    marginVertical: 4,
  },
  roomCodeHint: {
    color: '#616161',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playerList: {
    flexGrow: 0,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    gap: 8,
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
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
