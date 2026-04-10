import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

type Stats = {
  games_played: number
  games_won: number
  win_rate: number
  current_streak: number
  longest_streak: number
  fastest_win_turns: number | null
  most_cards_held: number
  biggest_pickup: number
  times_picked_up_black_jack: number
  times_countered_black_jack: number
  times_stacked_two: number
  times_victim_of_two: number
  times_correct_on_cards: number
  times_false_on_cards: number
  times_kicked_timeout: number
  longest_game_turns: number
  nemesis_username: string | null
  nemesis_loss_count: number
  victim_username: string | null
  victim_win_count: number
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export default function ProfileScreen() {
  const router = useRouter()
  const { profile, isGuest, signOut, updateProfile } = useAuth()

  const [stats, setStats] = useState<Stats | null>(null)
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!profile || isGuest) return
    supabase
      .from('player_stats')
      .select('*')
      .eq('id', profile.id)
      .single()
      .then(({ data }) => {
        if (data) setStats(data as Stats)
      })
  }, [profile?.id, isGuest])

  async function handleCopyFriendCode() {
    if (!profile?.friendCode) return
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(profile.friendCode)
      }
    } catch (_) {
      // clipboard unavailable
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSaveUsername() {
    if (!newUsername.trim()) return
    try {
      await updateProfile({ username: newUsername.trim() })
      setEditingUsername(false)
    } catch {
      // ignore
    }
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/auth')
  }

  // ── Guest view ──────────────────────────────────────────────────────────────
  if (isGuest || !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.guestContainer}>
          <View style={[styles.bigAvatar, { backgroundColor: profile?.colourHex ?? '#378ADD' }]}>
            <Text style={styles.bigAvatarText}>
              {(profile?.username ?? '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.guestUsername}>{profile?.username ?? 'Guest'}</Text>
          <View style={styles.guestCard}>
            <Text style={styles.guestCardTitle}>Playing as guest</Text>
            <Text style={styles.guestCardBody}>
              Create an account to track your stats, build streaks, and see your nemesis.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.replace('/auth')}
            >
              <Text style={styles.primaryBtnText}>Create account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  const winRateDisplay = stats ? `${Math.round(stats.win_rate * 100)}%` : '—'

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar + identity */}
        <View style={styles.identitySection}>
          <View style={[styles.bigAvatar, { backgroundColor: profile.colourHex }]}>
            <Text style={styles.bigAvatarText}>
              {profile.username.charAt(0).toUpperCase()}
            </Text>
          </View>

          {editingUsername ? (
            <View style={styles.usernameEditRow}>
              <TextInput
                style={styles.usernameInput}
                value={newUsername}
                onChangeText={setNewUsername}
                autoFocus
                maxLength={20}
                returnKeyType="done"
                onSubmitEditing={handleSaveUsername}
              />
              <TouchableOpacity onPress={handleSaveUsername} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingUsername(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { setNewUsername(profile.username); setEditingUsername(true) }}>
              <Text style={styles.username}>{profile.username}</Text>
            </TouchableOpacity>
          )}

          {profile.friendCode ? (
            <TouchableOpacity style={styles.friendCodeRow} onPress={handleCopyFriendCode}>
              <Text style={styles.friendCodeLabel}>Code: </Text>
              <Text style={styles.friendCode}>{profile.friendCode}</Text>
              <Text style={styles.copyHint}>{copied ? ' ✓' : ' Copy'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Stats grid */}
        <Text style={styles.sectionTitle}>Stats</Text>

        <View style={styles.statsGrid}>
          <StatCard label="Games played" value={stats?.games_played ?? 0} />
          <StatCard label="Games won" value={stats?.games_won ?? 0} />
          <StatCard label="Win rate" value={winRateDisplay} />
          <StatCard label="Current streak" value={stats?.current_streak ?? 0} />
          <StatCard label="Longest streak" value={stats?.longest_streak ?? 0} />
          <StatCard label="Fastest win (turns)" value={stats?.fastest_win_turns ?? '—'} />
          <StatCard label="Most cards held" value={stats?.most_cards_held ?? 0} />
          <StatCard label="Biggest pickup" value={stats?.biggest_pickup ?? 0} />
          <StatCard label="Black jacks received" value={stats?.times_picked_up_black_jack ?? 0} />
          <StatCard label="Black jacks countered" value={stats?.times_countered_black_jack ?? 0} />
          <StatCard label="2s stacked on others" value={stats?.times_stacked_two ?? 0} />
          <StatCard label="2s stacked on you" value={stats?.times_victim_of_two ?? 0} />
          <StatCard
            label={'Correct "on cards"'}
            value={stats?.times_correct_on_cards ?? 0}
          />
          <StatCard
            label={`False "on cards"${stats && stats.times_false_on_cards > (stats.times_correct_on_cards) ? ' 😬' : ''}`}
            value={stats?.times_false_on_cards ?? 0}
          />
          <StatCard label="Times kicked" value={stats?.times_kicked_timeout ?? 0} />
          <StatCard label="Longest game (turns)" value={stats?.longest_game_turns ?? 0} />
        </View>

        {/* Nemesis + victim */}
        <Text style={styles.sectionTitle}>Rivals</Text>
        <View style={styles.rivalsSection}>
          {stats?.nemesis_username ? (
            <View style={styles.rivalCard}>
              <Text style={styles.rivalEmoji}>💀</Text>
              <View style={styles.rivalInfo}>
                <Text style={styles.rivalRole}>Your nemesis</Text>
                <Text style={styles.rivalName}>{stats.nemesis_username}</Text>
                <Text style={styles.rivalCount}>Lost to them {stats.nemesis_loss_count}x</Text>
              </View>
            </View>
          ) : (
            <View style={styles.rivalCardEmpty}>
              <Text style={styles.rivalEmptyText}>No nemesis yet — play more games!</Text>
            </View>
          )}

          {stats?.victim_username ? (
            <View style={[styles.rivalCard, styles.rivalCardGreen]}>
              <Text style={styles.rivalEmoji}>😈</Text>
              <View style={styles.rivalInfo}>
                <Text style={[styles.rivalRole, styles.rivalRoleGreen]}>Your victim</Text>
                <Text style={styles.rivalName}>{stats.victim_username}</Text>
                <Text style={styles.rivalCount}>Beat them {stats.victim_win_count}x</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutBtnText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },

  // ── Identity section ──────────────────────────────────────────────────────
  identitySection: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  bigAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigAvatarText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '700',
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  usernameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usernameInput: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2e7d32',
    minWidth: 140,
  },
  saveBtn: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: '#616161',
    fontSize: 14,
  },
  friendCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendCodeLabel: {
    color: '#757575',
    fontSize: 13,
  },
  friendCode: {
    color: '#9e9e9e',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2,
  },
  copyHint: {
    color: '#4caf50',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Section titles ────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },

  // ── Stats grid ────────────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 14,
    width: '47%',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 11,
    color: '#757575',
    fontWeight: '500',
  },

  // ── Rivals ────────────────────────────────────────────────────────────────
  rivalsSection: {
    gap: 10,
    marginBottom: 32,
  },
  rivalCard: {
    backgroundColor: '#2a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5c2d2d',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rivalCardGreen: {
    backgroundColor: '#1a2a1a',
    borderColor: '#2e5c2e',
  },
  rivalCardEmpty: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 16,
    alignItems: 'center',
  },
  rivalEmoji: {
    fontSize: 28,
  },
  rivalInfo: {
    gap: 2,
  },
  rivalRole: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef5350',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rivalRoleGreen: {
    color: '#4caf50',
  },
  rivalName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  rivalCount: {
    fontSize: 12,
    color: '#757575',
  },
  rivalEmptyText: {
    color: '#616161',
    fontSize: 14,
  },

  // ── Sign out ──────────────────────────────────────────────────────────────
  signOutBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  signOutBtnText: {
    color: '#ef5350',
    fontSize: 15,
    fontWeight: '600',
  },

  // ── Guest view ────────────────────────────────────────────────────────────
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 16,
  },
  guestUsername: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  guestCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2e7d32',
    padding: 24,
    gap: 12,
    width: '100%',
    marginTop: 16,
  },
  guestCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  guestCardBody: {
    fontSize: 14,
    color: '#9e9e9e',
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
})
