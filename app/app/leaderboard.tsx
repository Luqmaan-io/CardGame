import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import {
  getGlobalLeaderboard,
  getFriendsLeaderboard,
  type LeaderboardEntry,
} from '../lib/friends'

type Tab = 'global' | 'friends'

const RANK_COLOURS: Record<number, string> = {
  1: '#EF9F27',
  2: '#B4B2A9',
  3: '#C07040',
}

function PodiumIcon({ rank }: { rank: number }) {
  const colour = RANK_COLOURS[rank] ?? '#616161'
  if (rank === 1) {
    return (
      <View style={[podStyles.wrap, { borderColor: colour }]}>
        <Text style={[podStyles.text, { color: colour }]}>★</Text>
      </View>
    )
  }
  return (
    <View style={[podStyles.wrap, { borderColor: colour }]}>
      <Text style={[podStyles.text, { color: colour }]}>{rank}</Text>
    </View>
  )
}

const podStyles = StyleSheet.create({
  wrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
  },
})

// Skeleton placeholder row
function SkeletonRow() {
  return (
    <View style={styles.row}>
      <View style={styles.skeletonRank} />
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonInfo}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '50%' }]} />
      </View>
    </View>
  )
}

function LeaderboardRow({
  entry,
  isMe,
}: {
  entry: LeaderboardEntry
  isMe: boolean
}) {
  const rank = entry.rank ?? 0
  const rankColour = RANK_COLOURS[rank] ?? (isMe ? entry.colourHex : '#616161')
  const isTop3 = rank <= 3
  const winRatePct = Math.round(entry.winRate * 100)
  const hasStreak = entry.currentStreak > 3

  return (
    <View
      style={[
        styles.row,
        isTop3 && styles.rowTop3,
        isMe && { backgroundColor: entry.colourHex + '18', borderColor: entry.colourHex + '44' },
      ]}
    >
      {isTop3
        ? <PodiumIcon rank={rank} />
        : (
          <Text style={[styles.rankNum, { color: rankColour }]}>
            {rank}
          </Text>
        )
      }

      <Avatar
        avatarId={entry.avatarId}
        size={44}
        colourHex={isTop3 ? (RANK_COLOURS[rank] ?? entry.colourHex) : entry.colourHex}
        showRing
      />

      <View style={styles.entryInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.entryName, { color: isMe ? entry.colourHex : '#ffffff' }]} numberOfLines={1}>
            {entry.username}
            {isMe ? ' (you)' : ''}
          </Text>
          {hasStreak && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {entry.currentStreak}</Text>
            </View>
          )}
        </View>
        <Text style={styles.entryMeta}>
          {winRatePct}% win rate · {entry.gamesPlayed} games
        </Text>
      </View>

      <View style={styles.winsCol}>
        <Text style={[styles.winsNum, { color: isTop3 ? (RANK_COLOURS[rank] ?? '#ffffff') : '#ffffff' }]}>
          {entry.gamesWon}
        </Text>
        <Text style={styles.winsLabel}>wins</Text>
      </View>
    </View>
  )
}

export default function LeaderboardScreen() {
  const router = useRouter()
  const { user, profile } = useAuth()

  const [tab, setTab] = useState<Tab>('global')
  const [globalData, setGlobalData] = useState<LeaderboardEntry[]>([])
  const [friendsData, setFriendsData] = useState<LeaderboardEntry[]>([])
  const [loadingGlobal, setLoadingGlobal] = useState(true)
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadGlobal = useCallback(async () => {
    setLoadingGlobal(true)
    const data = await getGlobalLeaderboard(50)
    setGlobalData(data)
    setLoadingGlobal(false)
  }, [])

  const loadFriends = useCallback(async () => {
    if (!user) return
    setLoadingFriends(true)
    const data = await getFriendsLeaderboard(user.id)
    setFriendsData(data)
    setLoadingFriends(false)
  }, [user])

  useEffect(() => { loadGlobal() }, [loadGlobal])

  useEffect(() => {
    if (tab === 'friends') loadFriends()
  }, [tab, loadFriends])

  async function handleRefresh() {
    setRefreshing(true)
    if (tab === 'global') await loadGlobal()
    else await loadFriends()
    setRefreshing(false)
  }

  const currentData = tab === 'global' ? globalData : friendsData
  const isLoading = tab === 'global' ? loadingGlobal : loadingFriends

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Tab pills */}
      <View style={styles.tabs}>
        {(['global', 'friends'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabPill, tab === t && styles.tabPillActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabPillText, tab === t && styles.tabPillTextActive]}>
              {t === 'global' ? '🌍 Global' : '👥 Friends'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
        </View>
      ) : currentData.length === 0 ? (
        <View style={styles.emptyState}>
          {tab === 'friends' ? (
            <>
              <Text style={styles.emptyText}>Add friends to see how you compare!</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/friends')}>
                <Text style={styles.primaryBtnText}>Go to Friends</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.emptyText}>No data yet — play some games!</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#4caf50"
            />
          }
          renderItem={({ item }) => (
            <LeaderboardRow
              entry={item}
              isMe={item.id === user?.id}
            />
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#4caf50',
    fontSize: 22,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  tabPillActive: {
    backgroundColor: '#1b3a1f',
    borderColor: '#2e7d32',
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#616161',
  },
  tabPillTextActive: {
    color: '#4caf50',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 8,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  rowTop3: {
    borderWidth: 1.5,
  },
  rankNum: {
    width: 28,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    color: '#616161',
  },
  entryInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  entryMeta: {
    fontSize: 11,
    color: '#757575',
  },
  streakBadge: {
    backgroundColor: 'rgba(239,159,39,0.15)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  streakText: {
    fontSize: 11,
    color: '#EF9F27',
    fontWeight: '700',
  },
  winsCol: {
    alignItems: 'center',
    minWidth: 40,
  },
  winsNum: {
    fontSize: 20,
    fontWeight: '800',
  },
  winsLabel: {
    fontSize: 10,
    color: '#616161',
    fontWeight: '600',
  },

  // Skeleton
  skeletonRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2a2a2a',
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a2a',
  },
  skeletonInfo: {
    flex: 1,
    gap: 6,
  },
  skeletonLine: {
    height: 12,
    width: '75%',
    borderRadius: 6,
    backgroundColor: '#2a2a2a',
  },

  // Empty
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyText: {
    color: '#616161',
    fontSize: 15,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
})
