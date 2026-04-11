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
import Avatar from '../components/Avatar'
import AvatarPickerModal from '../components/AvatarPickerModal'

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
  nemesis_avatar_id: string | null
  victim_username: string | null
  victim_win_count: number
  victim_avatar_id: string | null
}

type StatCardProps = {
  label: string
  value: string | number
  colourHex: string
  shame?: boolean
}

function StatCard({ label, value, colourHex, shame = false }: StatCardProps) {
  const isEmpty = value === 0 || value === '0'
  const display = isEmpty ? '—' : value
  const valueColor = shame && !isEmpty ? '#ef5350' : colourHex
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: valueColor }]}>{display}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

type BannerVariant = 'amber' | 'green' | 'red' | 'orange' | 'muted'

const BANNER_COLOURS: Record<BannerVariant, { bg: string }> = {
  amber: { bg: '#2a1f00' },
  green: { bg: '#0d2a14' },
  red: { bg: '#2a0d0d' },
  orange: { bg: '#2a1400' },
  muted: { bg: '#1a1a1a' },
}

function SummaryBanner({ stats, colourHex }: { stats: Stats; colourHex: string }) {
  let message = 'Keep playing to build your stats'
  let variant: BannerVariant = 'muted'
  const winRate = Math.round(stats.win_rate * 100)

  if (winRate > 60 && stats.games_played >= 5) {
    message = `You're on fire — ${winRate}% win rate`
    variant = 'amber'
  } else if (stats.current_streak > 3) {
    message = `On a ${stats.current_streak} game winning streak!`
    variant = 'green'
  } else if (stats.nemesis_username) {
    message = `Watch out for ${stats.nemesis_username}...`
    variant = 'red'
  } else if (stats.times_false_on_cards > stats.times_correct_on_cards && stats.times_false_on_cards > 0) {
    message = 'Stop false alarming on cards!'
    variant = 'orange'
  }

  return (
    <View style={[styles.banner, { backgroundColor: BANNER_COLOURS[variant].bg }]}>
      <Text style={[styles.bannerText, { color: colourHex }]}>{message}</Text>
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
  const [pickerVisible, setPickerVisible] = useState(false)

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

  async function handleAvatarSelect(avatarId: string) {
    try {
      await updateProfile({ avatarId })
    } catch {
      // ignore
    }
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
          <View style={styles.guestAvatarWrapper}>
            <Avatar
              avatarId={profile?.avatarId ?? 'avatar_01'}
              size={88}
              colourHex={profile?.colourHex ?? '#378ADD'}
            />
            <View style={styles.lockBadge}>
              <Text style={styles.lockText}>🔒</Text>
            </View>
          </View>
          <Text style={styles.guestUsername}>{profile?.username ?? 'Guest'}</Text>
          <View style={styles.guestCard}>
            <Text style={styles.guestCardTitle}>Playing as guest</Text>
            <Text style={styles.guestCardBody}>
              Create an account to track your stats, build streaks, and choose your avatar.
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

  const colourHex = profile.colourHex
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
          <TouchableOpacity onPress={() => setPickerVisible(true)} style={styles.avatarTouchable}>
            <Avatar
              avatarId={profile.avatarId}
              size={96}
              colourHex={colourHex}
            />
            <View style={[styles.editBadge, { backgroundColor: colourHex }]}>
              <Text style={styles.editBadgeText}>✎</Text>
            </View>
          </TouchableOpacity>

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

        {/* Stats section */}
        <Text style={styles.sectionTitle}>Stats</Text>

        {stats && <SummaryBanner stats={stats} colourHex={colourHex} />}

        <View style={styles.statsGrid}>
          <StatCard label="Games played" value={stats?.games_played ?? 0} colourHex={colourHex} />
          <StatCard label="Games won" value={stats?.games_won ?? 0} colourHex={colourHex} />
          <StatCard label="Win rate" value={stats ? winRateDisplay : '—'} colourHex={colourHex} />
          <StatCard label="Current streak" value={stats?.current_streak ?? 0} colourHex={colourHex} />
          <StatCard label="Longest streak" value={stats?.longest_streak ?? 0} colourHex={colourHex} />
          <StatCard label="Fastest win" value={stats?.fastest_win_turns != null ? `${stats.fastest_win_turns} turns` : '—'} colourHex={colourHex} />
          <StatCard label="Most cards held" value={stats?.most_cards_held ?? 0} colourHex={colourHex} />
          <StatCard label="Biggest pickup" value={stats?.biggest_pickup ?? 0} colourHex={colourHex} />
          <StatCard label="Black jacks received" value={stats?.times_picked_up_black_jack ?? 0} colourHex={colourHex} shame />
          <StatCard label="Black jacks countered" value={stats?.times_countered_black_jack ?? 0} colourHex={colourHex} />
          <StatCard label="2s stacked on others" value={stats?.times_stacked_two ?? 0} colourHex={colourHex} />
          <StatCard label="2s stacked on you" value={stats?.times_victim_of_two ?? 0} colourHex={colourHex} shame />
          <StatCard label='Correct "on cards"' value={stats?.times_correct_on_cards ?? 0} colourHex={colourHex} />
          <StatCard label='False "on cards"' value={stats?.times_false_on_cards ?? 0} colourHex={colourHex} shame />
          <StatCard label="Times kicked" value={stats?.times_kicked_timeout ?? 0} colourHex={colourHex} shame />
          <StatCard label="Longest game" value={stats?.longest_game_turns != null && stats.longest_game_turns > 0 ? `${stats.longest_game_turns} turns` : '—'} colourHex={colourHex} />
        </View>

        {/* Banter section */}
        <Text style={styles.sectionTitle}>Rivals</Text>
        <View style={styles.rivalsSection}>
          {stats?.nemesis_username ? (
            <View style={styles.rivalCard}>
              <Avatar
                avatarId={stats.nemesis_avatar_id ?? 'avatar_01'}
                size={40}
                colourHex="#ef5350"
              />
              <View style={styles.rivalInfo}>
                <Text style={styles.rivalRole}>Your nemesis</Text>
                <Text style={[styles.rivalName, { color: '#ef5350' }]}>{stats.nemesis_username}</Text>
                <Text style={styles.rivalCount}>Beat you {stats.nemesis_loss_count}x</Text>
              </View>
            </View>
          ) : (
            <View style={styles.rivalCardEmpty}>
              <Text style={styles.rivalEmptyText}>No nemesis yet...</Text>
            </View>
          )}

          {stats?.victim_username ? (
            <View style={[styles.rivalCard, styles.rivalCardGreen]}>
              <Avatar
                avatarId={stats.victim_avatar_id ?? 'avatar_01'}
                size={40}
                colourHex="#4caf50"
              />
              <View style={styles.rivalInfo}>
                <Text style={[styles.rivalRole, styles.rivalRoleGreen]}>Your victim</Text>
                <Text style={[styles.rivalName, { color: '#4caf50' }]}>{stats.victim_username}</Text>
                <Text style={styles.rivalCount}>You've beaten them {stats.victim_win_count}x</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.rivalCardEmpty, styles.rivalCardEmptyGreen]}>
              <Text style={[styles.rivalEmptyText, { fontStyle: 'italic' }]}>No victim yet...</Text>
            </View>
          )}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutBtnText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>

      <AvatarPickerModal
        visible={pickerVisible}
        currentAvatarId={profile.avatarId}
        colourHex={colourHex}
        onSelect={handleAvatarSelect}
        onClose={() => setPickerVisible(false)}
      />
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
  avatarTouchable: {
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#121212',
  },
  editBadgeText: {
    color: '#ffffff',
    fontSize: 12,
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
    marginBottom: 10,
    marginTop: 8,
  },

  // ── Summary banner ────────────────────────────────────────────────────────
  banner: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
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
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '500',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
  },

  // ── Rivals ────────────────────────────────────────────────────────────────
  rivalsSection: {
    gap: 10,
    marginBottom: 32,
  },
  rivalCard: {
    backgroundColor: '#FCEBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5C6C6',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rivalCardGreen: {
    backgroundColor: '#EAF3DE',
    borderColor: '#C6E0B0',
  },
  rivalCardEmpty: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 16,
    alignItems: 'center',
  },
  rivalCardEmptyGreen: {
    backgroundColor: '#1a2a1a',
    borderColor: '#2e5c2e',
  },
  rivalInfo: {
    gap: 2,
    flex: 1,
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
  guestAvatarWrapper: {
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: '#121212',
  },
  lockText: {
    fontSize: 14,
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
