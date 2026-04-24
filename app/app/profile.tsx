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
  Share,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'
import AvatarPickerModal from '../components/AvatarPickerModal'
import { THEME } from '../utils/theme'

type PlayerStats = {
  games_played: number
  games_won: number
  win_rate: number           // stored as decimal 0–1 (e.g. 0.75 = 75%)
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
  nemesis_id: string | null
  nemesis_username: string | null
  nemesis_loss_count: number
  nemesis_avatar_id: string | null
  victim_id: string | null
  victim_username: string | null
  victim_win_count: number
  victim_avatar_id: string | null
  recent_results: number[]   // last 10 placements, e.g. [1, 2, 1, 3, 4]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSummaryMessage(stats: PlayerStats): string {
  const winRatePct = Math.round(stats.win_rate * 100)
  if (stats.current_streak > 3)
    return `🔥 On a ${stats.current_streak} game winning streak`
  if (winRatePct > 60 && stats.games_played >= 5)
    return `⚡ ${winRatePct}% win rate — dominant`
  if (stats.games_played === 0)
    return 'Play your first game to build your stats'
  if (stats.games_won === 0)
    return `${stats.games_played} games played — keep going`
  return `${stats.games_won} wins from ${stats.games_played} games`
}

function getPlacementColour(placement: number): string {
  if (placement === 1) return THEME.gold
  if (placement === 2) return '#C0C0C0'
  if (placement === 3) return '#CD7F32'
  return THEME.textMuted
}

function StatCard({
  label,
  value,
  colourHex,
  isShame = false,
}: {
  label: string
  value: string | number
  colourHex: string
  isShame?: boolean
}) {
  const isEmpty = value === 0 || value === '—'
  const display = isEmpty ? '—' : value
  const valueColor = isEmpty
    ? THEME.textMuted
    : isShame && !isEmpty
    ? THEME.danger
    : colourHex
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: valueColor }]}>{display}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter()
  const { profile, isGuest, signOut, updateProfile, user } = useAuth()

  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [copied, setCopied] = useState(false)
  const [pickerVisible, setPickerVisible] = useState(false)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('')
  const [accountMessage, setAccountMessage] = useState<{ text: string; isError: boolean } | null>(null)
  const [nemesisAvatar, setNemesisAvatar] = useState<{ avatarId: string; colourHex: string } | null>(null)
  const [victimAvatar, setVictimAvatar] = useState<{ avatarId: string; colourHex: string } | null>(null)

  // ── Load stats ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile || isGuest) {
      setIsLoading(false)
      return
    }
    supabase
      .from('player_stats')
      .select('*')
      .eq('id', profile.id)
      .single()
      .then(({ data }) => {
        if (data) setStats(data as PlayerStats)
        setIsLoading(false)
      })
  }, [profile?.id, isGuest])

  useEffect(() => {
    const id = stats?.nemesis_id
    if (!id) return
    supabase
      .from('profiles')
      .select('avatar_id, colour_hex')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setNemesisAvatar({ avatarId: data.avatar_id, colourHex: data.colour_hex })
      })
  }, [stats?.nemesis_id])

  useEffect(() => {
    const id = stats?.victim_id
    if (!id) return
    supabase
      .from('profiles')
      .select('avatar_id, colour_hex')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setVictimAvatar({ avatarId: data.avatar_id, colourHex: data.colour_hex })
      })
  }, [stats?.victim_id])

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleCopyFriendCode() {
    if (!profile?.friendCode) return
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(profile.friendCode)
      }
    } catch (_) { /* clipboard unavailable */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSaveUsername() {
    if (!newUsername.trim()) return
    try {
      await updateProfile({ username: newUsername.trim() })
      setEditingUsername(false)
    } catch { /* ignore */ }
  }

  async function handleAvatarSelect(avatarId: string) {
    try {
      await updateProfile({ avatarId })
    } catch { /* ignore */ }
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/auth')
  }

  async function handleShareProfile() {
    if (!profile || !stats) return
    const winRatePct = Math.round(stats.win_rate * 100)
    const lines = [
      `🃏 ${profile.username} on Powerstack`,
      `📊 ${stats.games_won} wins from ${stats.games_played} games`,
      `🏆 Win rate: ${winRatePct}%`,
      stats.current_streak > 2 ? `🔥 ${stats.current_streak} game winning streak` : '',
      '',
      `Add me: ${profile.friendCode}`,
      `Play at: https://playpowerstack.vercel.app`,
    ].filter((l) => l !== undefined && (l.length > 0 || l === '')).join('\n')
    try {
      await Share.share({ message: lines })
    } catch { /* ignore */ }
  }

  async function handleChangeEmail() {
    if (!emailInput.trim()) return
    try {
      const { error } = await supabase.auth.updateUser({ email: emailInput.trim() })
      if (error) throw error
      setAccountMessage({ text: 'Check your new email to confirm the change.', isError: false })
      setEmailInput('')
      setShowChangeEmail(false)
    } catch (err) {
      setAccountMessage({ text: (err as Error).message, isError: true })
    }
    setTimeout(() => setAccountMessage(null), 4000)
  }

  async function handleChangePassword() {
    if (!passwordInput.trim()) return
    if (passwordInput !== confirmPasswordInput) {
      setAccountMessage({ text: 'Passwords do not match.', isError: true })
      setTimeout(() => setAccountMessage(null), 3000)
      return
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordInput })
      if (error) throw error
      setAccountMessage({ text: 'Password updated.', isError: false })
      setPasswordInput('')
      setConfirmPasswordInput('')
      setShowChangePassword(false)
    } catch (err) {
      setAccountMessage({ text: (err as Error).message, isError: true })
    }
    setTimeout(() => setAccountMessage(null), 4000)
  }

  function handleDeleteAccount() {
    setAccountMessage({
      text: 'To delete your account, contact support at support@playpowerstack.com',
      isError: false,
    })
    setTimeout(() => setAccountMessage(null), 6000)
  }

  // ── Guest view ──────────────────────────────────────────────────────────────
  if (isGuest || !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.guestContainer}>
          <View style={{ position: 'relative' }}>
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
              Create an account to save your stats, track wins, build streaks, and add friends.
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
  const recentResults: number[] = stats?.recent_results ?? []

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: THEME.textMuted, fontSize: 15 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const statRows: { label: string; value: string | number; isShame?: boolean }[][] = [
    [
      { label: 'Games played', value: stats?.games_played ?? 0 },
      { label: 'Games won', value: stats?.games_won ?? 0 },
    ],
    [
      { label: 'Win rate', value: stats ? winRateDisplay : '—' },
      { label: 'Current streak', value: stats?.current_streak ?? 0 },
    ],
    [
      { label: 'Longest streak', value: stats?.longest_streak ?? 0 },
      { label: 'Fastest win', value: stats?.fastest_win_turns != null ? `${stats.fastest_win_turns} turns` : '—' },
    ],
    [
      { label: 'Most cards held', value: stats?.most_cards_held ?? 0 },
      { label: 'Biggest pickup', value: stats?.biggest_pickup ?? 0 },
    ],
    [
      { label: 'Black jacks received', value: stats?.times_picked_up_black_jack ?? 0, isShame: true },
      { label: 'Black jacks countered', value: stats?.times_countered_black_jack ?? 0 },
    ],
    [
      { label: '2s stacked on others', value: stats?.times_stacked_two ?? 0 },
      { label: '2s stacked on you', value: stats?.times_victim_of_two ?? 0, isShame: true },
    ],
    [
      { label: 'Correct on cards', value: stats?.times_correct_on_cards ?? 0 },
      { label: 'False on cards', value: stats?.times_false_on_cards ?? 0, isShame: true },
    ],
    [
      { label: 'Times kicked', value: stats?.times_kicked_timeout ?? 0, isShame: true },
      { label: 'Longest game', value: stats?.longest_game_turns ? `${stats.longest_game_turns} turns` : '—' },
    ],
  ]

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Section 1: Identity ────────────────────────────────────────────── */}
        <View style={styles.identitySection}>
          {/* Avatar with edit badge */}
          <TouchableOpacity onPress={() => setPickerVisible(true)} style={{ position: 'relative' }}>
            <Avatar avatarId={profile.avatarId} size={96} colourHex={colourHex} />
            <View style={[styles.editBadge, { backgroundColor: THEME.gold }]}>
              <Text style={styles.editBadgeText}>✎</Text>
            </View>
          </TouchableOpacity>

          {/* Username — inline edit */}
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
            <TouchableOpacity
              onPress={() => { setNewUsername(profile.username); setEditingUsername(true) }}
              style={{ alignItems: 'center', gap: 2 }}
            >
              <Text style={styles.username}>{profile.username}</Text>
              <Text style={{ color: THEME.textMuted, fontSize: 12 }}>tap to edit</Text>
            </TouchableOpacity>
          )}

          {/* Friend code */}
          {profile.friendCode ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: THEME.textSecondary, fontSize: 13 }}>
                Code: {profile.friendCode}
              </Text>
              <TouchableOpacity onPress={handleCopyFriendCode}>
                <Text style={{ color: THEME.gold, fontSize: 12, fontWeight: '600' }}>
                  {copied ? '✓ Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* ── Section 2: Summary banner ──────────────────────────────────────── */}
        {stats && (
          <View style={styles.summaryBanner}>
            <Text style={styles.summaryText}>{getSummaryMessage(stats)}</Text>
          </View>
        )}
        {!stats && (
          <View style={styles.summaryBanner}>
            <Text style={styles.summaryText}>No stats yet — play your first game!</Text>
          </View>
        )}

        {/* ── Section 3: Stats grid ──────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsGrid}>
          {statRows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.statsRow}>
              {row.map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  colourHex={colourHex}
                  isShame={stat.isShame}
                />
              ))}
            </View>
          ))}
        </View>

        {/* ── Section 4: Recent form ─────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Recent form</Text>
        <View style={styles.recentFormRow}>
          {recentResults.length === 0 ? (
            <Text style={{ color: THEME.textMuted, fontSize: 12 }}>No games yet</Text>
          ) : (
            recentResults.map((placement, i) => (
              <View
                key={i}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: getPlacementColour(placement),
                }}
              />
            ))
          )}
        </View>

        {/* ── Rivals ────────────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Rivals</Text>
        <View style={styles.rivalsSection}>
          {stats?.nemesis_username ? (
            <View style={styles.rivalCard}>
              <Avatar
                avatarId={nemesisAvatar?.avatarId ?? stats.nemesis_avatar_id ?? 'avatar_01'}
                size={40}
                colourHex={nemesisAvatar?.colourHex ?? '#ef5350'}
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
                avatarId={victimAvatar?.avatarId ?? stats.victim_avatar_id ?? 'avatar_01'}
                size={40}
                colourHex={victimAvatar?.colourHex ?? '#4caf50'}
              />
              <View style={styles.rivalInfo}>
                <Text style={[styles.rivalRole, { color: THEME.success }]}>Your victim</Text>
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

        {/* ── Section 5: Account settings ───────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => setShowAccountSettings(!showAccountSettings)}
          style={styles.accountSettingsToggle}
        >
          <Text style={{ color: THEME.textPrimary, fontSize: 15 }}>Account settings</Text>
          <Text style={{ color: THEME.textMuted, fontSize: 13 }}>{showAccountSettings ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showAccountSettings && (
          <View style={styles.accountSettingsContent}>
            {accountMessage && (
              <View style={[styles.accountMsg, accountMessage.isError && styles.accountMsgError]}>
                <Text style={{ color: accountMessage.isError ? THEME.danger : THEME.success, fontSize: 13 }}>
                  {accountMessage.text}
                </Text>
              </View>
            )}

            {/* Change email */}
            {!showChangeEmail ? (
              <TouchableOpacity onPress={() => { setShowChangeEmail(true); setShowChangePassword(false) }}>
                <Text style={styles.accountSettingsItem}>Change email</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.accountInputGroup}>
                <TextInput
                  style={styles.accountInput}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder="New email address"
                  placeholderTextColor={THEME.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoFocus
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={handleChangeEmail} style={styles.accountActionBtn}>
                    <Text style={styles.accountActionBtnText}>Update</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowChangeEmail(false)} style={styles.accountCancelBtn}>
                    <Text style={styles.accountCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Change password */}
            {!showChangePassword ? (
              <TouchableOpacity onPress={() => { setShowChangePassword(true); setShowChangeEmail(false) }}>
                <Text style={styles.accountSettingsItem}>Change password</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.accountInputGroup}>
                <TextInput
                  style={styles.accountInput}
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                  placeholder="New password"
                  placeholderTextColor={THEME.textMuted}
                  secureTextEntry
                  autoFocus
                />
                <TextInput
                  style={styles.accountInput}
                  value={confirmPasswordInput}
                  onChangeText={setConfirmPasswordInput}
                  placeholder="Confirm new password"
                  placeholderTextColor={THEME.textMuted}
                  secureTextEntry
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={handleChangePassword} style={styles.accountActionBtn}>
                    <Text style={styles.accountActionBtnText}>Update</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowChangePassword(false)} style={styles.accountCancelBtn}>
                    <Text style={styles.accountCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Delete account */}
            <TouchableOpacity onPress={handleDeleteAccount}>
              <Text style={[styles.accountSettingsItem, { color: THEME.danger }]}>Delete account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Section 6: Share profile ───────────────────────────────────────── */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShareProfile}>
          <Text style={styles.shareBtnText}>Share my stats</Text>
        </TouchableOpacity>

        {/* ── Section 7: Sign out ────────────────────────────────────────────── */}
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
  safe: { flex: 1, backgroundColor: THEME.appBackground },

  // ── Header ───────────────────────────────────────────────────────────────
  header: { paddingHorizontal: 4, paddingTop: 4, paddingBottom: 4 },
  backBtn: { padding: 12 },
  backBtnText: { color: THEME.gold, fontSize: 15 },

  scroll: { paddingHorizontal: 20, paddingBottom: 56 },

  // ── Identity ─────────────────────────────────────────────────────────────
  identitySection: { alignItems: 'center', gap: 12, paddingVertical: 20 },
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
    borderColor: THEME.appBackground,
  },
  editBadgeText: { color: THEME.appBackground, fontSize: 12, fontWeight: '700' },
  username: { fontSize: 22, fontWeight: '700', color: THEME.textPrimary },
  usernameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  usernameInput: {
    backgroundColor: THEME.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 18,
    color: THEME.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: THEME.gold,
    minWidth: 140,
  },
  saveBtn: { backgroundColor: THEME.gold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  saveBtnText: { color: THEME.appBackground, fontWeight: '700', fontSize: 14 },
  cancelBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  cancelBtnText: { color: THEME.textMuted, fontSize: 14 },

  // ── Summary banner ────────────────────────────────────────────────────────
  summaryBanner: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: THEME.gold,
    padding: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  summaryText: { color: THEME.gold, fontSize: 14, textAlign: 'center', fontWeight: '500' },

  // ── Section titles ────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 4,
  },

  // ── Stats grid ────────────────────────────────────────────────────────────
  statsGrid: { gap: 10, marginBottom: 28 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: THEME.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(201,168,76,0.15)',
    minHeight: 72,
    justifyContent: 'space-between',
  },
  statValue: { fontSize: 24, fontWeight: '500' },
  statLabel: { fontSize: 11, color: THEME.textMuted, marginTop: 4 },

  // ── Recent form ───────────────────────────────────────────────────────────
  recentFormRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 28,
  },

  // ── Rivals ────────────────────────────────────────────────────────────────
  rivalsSection: { gap: 10, marginBottom: 28 },
  rivalCard: {
    backgroundColor: 'rgba(226,75,74,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,75,74,0.25)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rivalCardGreen: { backgroundColor: 'rgba(93,202,165,0.08)', borderColor: 'rgba(93,202,165,0.25)' },
  rivalCardEmpty: {
    backgroundColor: THEME.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
    padding: 16,
    alignItems: 'center',
  },
  rivalCardEmptyGreen: { borderColor: 'rgba(93,202,165,0.15)' },
  rivalInfo: { gap: 2, flex: 1 },
  rivalRole: { fontSize: 11, fontWeight: '600', color: THEME.danger, textTransform: 'uppercase', letterSpacing: 1 },
  rivalName: { fontSize: 18, fontWeight: '700' },
  rivalCount: { fontSize: 12, color: THEME.textMuted },
  rivalEmptyText: { color: THEME.textMuted, fontSize: 14 },

  // ── Account settings ──────────────────────────────────────────────────────
  accountSettingsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(201,168,76,0.15)',
    marginBottom: 0,
  },
  accountSettingsContent: {
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(201,168,76,0.15)',
    marginBottom: 16,
  },
  accountSettingsItem: { color: THEME.textSecondary, fontSize: 14, paddingVertical: 4 },
  accountInputGroup: { gap: 8 },
  accountInput: {
    backgroundColor: THEME.surfaceBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  accountActionBtn: {
    backgroundColor: THEME.gold,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  accountActionBtnText: { color: THEME.appBackground, fontWeight: '700', fontSize: 13 },
  accountCancelBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  accountCancelBtnText: { color: THEME.textMuted, fontSize: 13 },
  accountMsg: {
    backgroundColor: 'rgba(93,202,165,0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(93,202,165,0.25)',
  },
  accountMsgError: {
    backgroundColor: 'rgba(226,75,74,0.1)',
    borderColor: 'rgba(226,75,74,0.25)',
  },

  // ── Share profile ─────────────────────────────────────────────────────────
  shareBtn: {
    margin: 0,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareBtnText: { color: THEME.gold, fontSize: 15, fontWeight: '600' },

  // ── Sign out ──────────────────────────────────────────────────────────────
  signOutBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226,75,74,0.3)',
    marginBottom: 8,
  },
  signOutBtnText: { color: THEME.danger, fontSize: 15, fontWeight: '600' },

  // ── Guest view ────────────────────────────────────────────────────────────
  guestContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 32, gap: 16 },
  lockBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: THEME.cardBackground,
    borderRadius: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: THEME.appBackground,
  },
  lockText: { fontSize: 14 },
  guestUsername: { fontSize: 22, fontWeight: '700', color: THEME.textPrimary },
  guestCard: {
    backgroundColor: THEME.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    padding: 24,
    gap: 12,
    width: '100%',
    marginTop: 16,
  },
  guestCardTitle: { fontSize: 18, fontWeight: '700', color: THEME.textPrimary },
  guestCardBody: { fontSize: 14, color: THEME.textSecondary, lineHeight: 20 },
  primaryBtn: { backgroundColor: THEME.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: THEME.appBackground, fontSize: 15, fontWeight: '700' },
})
