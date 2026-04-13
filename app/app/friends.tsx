import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  Platform,
  Share,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import { THEME } from '../utils/theme'
import {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendship,
  getFriends,
  type FriendProfile,
} from '../lib/friends'

type Tab = 'friends' | 'requests' | 'find'

type FriendEntry = FriendProfile & { friendshipId: string }

export default function FriendsScreen() {
  const router = useRouter()
  const { profile, user } = useAuth()

  const [tab, setTab] = useState<Tab>('friends')
  const [loading, setLoading] = useState(true)

  const [friends, setFriends] = useState<FriendEntry[]>([])
  const [pendingReceived, setPendingReceived] = useState<FriendEntry[]>([])
  const [pendingSent, setPendingSent] = useState<FriendEntry[]>([])

  // Add friend state
  const [addCode, setAddCode] = useState('')
  const [addStatus, setAddStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [addLoading, setAddLoading] = useState(false)

  // Copy/share state
  const [codeCopied, setCodeCopied] = useState(false)

  const loadFriends = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const result = await getFriends(user.id)
    setFriends(result.friends)
    setPendingReceived(result.pendingReceived)
    setPendingSent(result.pendingSent)
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadFriends()
  }, [loadFriends])

  async function handleSendRequest() {
    if (!user || addCode.length !== 8) return
    setAddLoading(true)
    setAddStatus(null)
    const result = await sendFriendRequest(user.id, addCode)
    if (result.success) {
      setAddStatus({ type: 'success', message: 'Request sent!' })
      setAddCode('')
      loadFriends()
    } else {
      setAddStatus({ type: 'error', message: result.error ?? 'Failed to send' })
    }
    setAddLoading(false)
  }

  async function handleAccept(friendshipId: string) {
    await acceptFriendRequest(friendshipId)
    loadFriends()
  }

  async function handleDecline(friendshipId: string) {
    await removeFriendship(friendshipId)
    loadFriends()
  }

  async function handleRemove(friendshipId: string) {
    await removeFriendship(friendshipId)
    loadFriends()
  }

  async function handleShare() {
    if (!profile?.friendCode) return
    try {
      await Share.share({
        message: `Add me on Card Game! My friend code is: ${profile.friendCode}`,
      })
    } catch { /* ignore */ }
  }

  async function handleCopyCode() {
    if (!profile?.friendCode) return
    try {
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(profile.friendCode)
      }
    } catch { /* ignore */ }
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const requestBadge = pendingReceived.length

  // ── Guest guard ──────────────────────────────────────────────────────────────
  if (!user || !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Friends</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.guestState}>
          <Text style={styles.guestStateText}>Create an account to add friends</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/auth')}>
            <Text style={styles.primaryBtnText}>Create account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Tab pills */}
      <View style={styles.tabs}>
        {(['friends', 'requests', 'find'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabPill, tab === t && styles.tabPillActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabPillText, tab === t && styles.tabPillTextActive]}>
              {t === 'friends' ? 'Friends' : t === 'requests' ? 'Requests' : 'Find'}
            </Text>
            {t === 'requests' && requestBadge > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{requestBadge > 9 ? '9+' : requestBadge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Friends tab ── */}
      {tab === 'friends' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Add friend input */}
          <View style={styles.addRow}>
            <TextInput
              style={styles.codeInput}
              value={addCode}
              onChangeText={(t) => { setAddCode(t.toUpperCase().slice(0, 8)); setAddStatus(null) }}
              placeholder="Friend code (8 chars)"
              placeholderTextColor="#616161"
              autoCapitalize="characters"
              maxLength={8}
              returnKeyType="send"
              onSubmitEditing={handleSendRequest}
            />
            <TouchableOpacity
              style={[styles.sendBtn, addCode.length !== 8 && styles.sendBtnDisabled]}
              onPress={handleSendRequest}
              disabled={addCode.length !== 8 || addLoading}
            >
              {addLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.sendBtnText}>Add</Text>
              }
            </TouchableOpacity>
          </View>

          {addStatus && (
            <Text style={[styles.addStatusText, addStatus.type === 'error' && styles.addStatusError]}>
              {addStatus.message}
            </Text>
          )}

          <Text style={styles.sectionLabel}>
            {friends.length > 0 ? `${friends.length} friend${friends.length !== 1 ? 's' : ''}` : ''}
          </Text>

          {loading
            ? <ActivityIndicator color="#4caf50" style={{ marginTop: 32 }} />
            : friends.length === 0
              ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No friends yet</Text>
                  <Text style={styles.emptyStateHint}>Add someone using their friend code above</Text>
                </View>
              )
              : friends.map((f) => (
                <View key={f.friendshipId} style={styles.friendRow}>
                  <Avatar avatarId={f.avatarId} size={44} colourHex={f.colourHex} />
                  <View style={styles.friendInfo}>
                    <Text style={[styles.friendName, { color: f.colourHex }]}>{f.username}</Text>
                    <Text style={styles.friendCode}>{f.friendCode}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemove(f.friendshipId)}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))
          }
        </ScrollView>
      )}

      {/* ── Requests tab ── */}
      {tab === 'requests' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionLabel}>Received</Text>
          {pendingReceived.length === 0
            ? <Text style={styles.emptyInline}>No pending requests</Text>
            : pendingReceived.map((f) => (
              <View key={f.friendshipId} style={styles.friendRow}>
                <Avatar avatarId={f.avatarId} size={44} colourHex={f.colourHex} />
                <View style={styles.friendInfo}>
                  <Text style={[styles.friendName, { color: f.colourHex }]}>{f.username}</Text>
                  <Text style={styles.friendCode}>{f.friendCode}</Text>
                </View>
                <View style={styles.requestBtns}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAccept(f.friendshipId)}
                  >
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={() => handleDecline(f.friendshipId)}
                  >
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          }

          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Sent</Text>
          {pendingSent.length === 0
            ? <Text style={styles.emptyInline}>No sent requests</Text>
            : pendingSent.map((f) => (
              <View key={f.friendshipId} style={styles.friendRow}>
                <Avatar avatarId={f.avatarId} size={44} colourHex={f.colourHex} />
                <View style={styles.friendInfo}>
                  <Text style={[styles.friendName, { color: f.colourHex }]}>{f.username}</Text>
                  <Text style={styles.friendCode}>{f.friendCode}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleDecline(f.friendshipId)}
                >
                  <Text style={styles.removeBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ))
          }
        </ScrollView>
      )}

      {/* ── Find tab ── */}
      {tab === 'find' && (
        <View style={styles.findContainer}>
          <Text style={styles.findLabel}>Your friend code</Text>
          <Text style={styles.findCode}>{profile.friendCode || '——————'}</Text>
          <Text style={styles.findHint}>Share this code so others can add you</Text>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share my code</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
            <Text style={styles.copyBtnText}>{codeCopied ? '✓ Copied!' : 'Copy to clipboard'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.appBackground },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: THEME.gold, fontSize: 22 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: THEME.textPrimary },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tabPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 20, backgroundColor: THEME.cardBackground, borderWidth: 1, borderColor: 'rgba(201,168,76,0.18)', gap: 6 },
  tabPillActive: { backgroundColor: THEME.surfaceBackground, borderColor: THEME.gold },
  tabPillText: { fontSize: 13, fontWeight: '600', color: THEME.textMuted },
  tabPillTextActive: { color: THEME.gold },
  tabBadge: { backgroundColor: THEME.danger, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, minWidth: 16, alignItems: 'center' },
  tabBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  codeInput: { flex: 1, backgroundColor: THEME.cardBackground, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 16, color: THEME.textPrimary, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)', letterSpacing: 2, fontWeight: '600' },
  sendBtn: { backgroundColor: THEME.gold, borderRadius: 10, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: THEME.cardBackground, borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)' },
  sendBtnText: { color: THEME.appBackground, fontWeight: '800', fontSize: 14 },
  addStatusText: { fontSize: 13, fontWeight: '600', color: THEME.success, marginBottom: 12, paddingHorizontal: 2 },
  addStatusError: { color: THEME.danger },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  friendRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.cardBackground, borderRadius: 12, padding: 12, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)' },
  friendInfo: { flex: 1, gap: 2 },
  friendName: { fontSize: 15, fontWeight: '700' },
  friendCode: { fontSize: 11, color: THEME.textMuted, letterSpacing: 1.5, fontWeight: '500' },
  removeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  removeBtnText: { color: THEME.textMuted, fontSize: 12, fontWeight: '600' },
  requestBtns: { flexDirection: 'row', gap: 6 },
  acceptBtn: { backgroundColor: THEME.gold, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  acceptBtnText: { color: THEME.appBackground, fontSize: 12, fontWeight: '800' },
  declineBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  declineBtnText: { color: THEME.textMuted, fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyStateText: { color: THEME.textMuted, fontSize: 16, fontWeight: '600' },
  emptyStateHint: { color: THEME.textMuted, fontSize: 13, textAlign: 'center' },
  emptyInline: { color: THEME.textMuted, fontSize: 13, fontStyle: 'italic', marginBottom: 8 },
  findContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  findLabel: { fontSize: 12, fontWeight: '600', color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  findCode: { fontSize: 36, fontWeight: '800', color: THEME.gold, letterSpacing: 6 },
  findHint: { fontSize: 13, color: THEME.textMuted, textAlign: 'center', marginBottom: 8 },
  shareBtn: { backgroundColor: THEME.gold, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, width: '100%', alignItems: 'center' },
  shareBtnText: { color: THEME.appBackground, fontWeight: '800', fontSize: 15 },
  copyBtn: { borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)' },
  copyBtnText: { color: THEME.gold, fontWeight: '600', fontSize: 14 },
  guestState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  guestStateText: { color: THEME.textSecondary, fontSize: 16, textAlign: 'center' },
  primaryBtn: { backgroundColor: THEME.gold, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center' },
  primaryBtnText: { color: THEME.appBackground, fontSize: 15, fontWeight: '800' },
})
