import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { THEME } from '../utils/theme'
import { CARD_BACKS, CARD_BACKS_MAP, type CardBackDesign } from '../assets/cardbacks'
import { CARD_FACES, CARD_FACES_MAP, type CardFaceDesign } from '../assets/cardfaces'

// ─── CardBackPreview ──────────────────────────────────────────────────────────

function CardBackPreview({
  design,
  size = 64,
  equipped = false,
  locked = false,
}: {
  design: CardBackDesign
  size?: number
  equipped?: boolean
  locked?: boolean
}) {
  const height = size * 1.45
  const borderRadius = Math.round(height * 0.07)

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          {
            width: size,
            height,
            borderRadius,
            backgroundColor: design.bgColour,
            borderWidth: equipped ? 2 : 1,
            borderColor: equipped ? THEME.gold : design.accentColour,
            overflow: 'hidden',
            opacity: locked ? 0.35 : 1,
          },
        ]}
      >
        {/* @ts-ignore — web-only */}
        <svg
          width={size}
          height={height}
          viewBox="0 0 200 300"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', top: 0, left: 0 }}
          dangerouslySetInnerHTML={{ __html: design.svgContent }}
        />
      </View>
    )
  }

  // Native: simple colour block with accent diamond
  return (
    <View
      style={{
        width: size,
        height,
        borderRadius,
        backgroundColor: design.bgColour,
        borderWidth: equipped ? 2 : 1,
        borderColor: equipped ? THEME.gold : design.accentColour,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: locked ? 0.35 : 1,
      }}
    >
      <View style={{
        width: size * 0.45,
        height: size * 0.45,
        borderWidth: 1.5,
        borderColor: design.accentColour,
        transform: [{ rotate: '45deg' }],
        opacity: 0.8,
      }} />
    </View>
  )
}

// ─── CardFacePreview ──────────────────────────────────────────────────────────

function CardFacePreview({
  design,
  size = 64,
  equipped = false,
  locked = false,
}: {
  design: CardFaceDesign
  size?: number
  equipped?: boolean
  locked?: boolean
}) {
  const height = size * 1.45
  const borderRadius = design.cornerStyle === 'sharp'
    ? Math.round(height * 0.03)
    : design.cornerStyle === 'rounded'
      ? Math.round(height * 0.1)
      : Math.round(height * 0.07)
  const rankFontSize = Math.round(height * 0.14)
  const suitFontSize = Math.round(height * 0.26)

  return (
    <View
      style={{
        width: size,
        height,
        borderRadius,
        backgroundColor: design.bgColour,
        borderWidth: equipped ? 2 : design.borderWidth,
        borderColor: equipped ? THEME.gold : design.borderColour,
        overflow: 'hidden',
        opacity: locked ? 0.35 : 1,
      }}
    >
      <View style={{ position: 'absolute', top: 4, left: 5 }}>
        <Text style={{ fontSize: rankFontSize, fontWeight: '800', color: design.rankColourRed, lineHeight: rankFontSize + 2 }}>A</Text>
        <Text style={{ fontSize: rankFontSize - 2, color: design.rankColourRed, lineHeight: rankFontSize }}>♥</Text>
      </View>
      <Text style={{
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        textAlign: 'center',
        lineHeight: height,
        fontSize: suitFontSize,
        color: design.rankColourRed,
      }}>
        ♥
      </Text>
      <View style={{ position: 'absolute', bottom: 4, right: 5, transform: [{ rotate: '180deg' }] }}>
        <Text style={{ fontSize: rankFontSize, fontWeight: '800', color: design.rankColourRed, lineHeight: rankFontSize + 2 }}>A</Text>
        <Text style={{ fontSize: rankFontSize - 2, color: design.rankColourRed, lineHeight: rankFontSize }}>♥</Text>
      </View>
    </View>
  )
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────

function ProgressBar({ progress, colour }: { progress: number; colour: string }) {
  return (
    <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
      <View style={{ height: 3, width: `${Math.min(100, progress * 100)}%` as `${number}%`, backgroundColor: colour, borderRadius: 2 }} />
    </View>
  )
}

// ─── ChallengeCard ────────────────────────────────────────────────────────────

function ChallengeCard({
  type,
  design,
  isEquipped,
  isUnlocked,
  progress,
  onEquip,
}: {
  type: 'back' | 'face'
  design: CardBackDesign | CardFaceDesign
  isEquipped: boolean
  isUnlocked: boolean
  progress: number   // 0–1
  onEquip: () => void
}) {
  const locked = !isUnlocked

  const unlockLabel = design.unlockType === 'default'
    ? 'Default'
    : design.unlockType === 'games_played'
      ? `${design.unlockCount} games played`
      : `${design.unlockCount} wins`

  return (
    <TouchableOpacity
      onPress={isUnlocked ? onEquip : undefined}
      activeOpacity={isUnlocked ? 0.8 : 1}
      style={[
        challengeStyles.card,
        isEquipped && challengeStyles.cardEquipped,
        locked && challengeStyles.cardLocked,
      ]}
    >
      <View style={{ alignItems: 'center' }}>
        {type === 'back' ? (
          <CardBackPreview design={design as CardBackDesign} size={52} equipped={isEquipped} locked={locked} />
        ) : (
          <CardFacePreview design={design as CardFaceDesign} size={52} equipped={isEquipped} locked={locked} />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Text style={[challengeStyles.designName, locked && { opacity: 0.5 }]} numberOfLines={1}>
            {design.name}
          </Text>
          {(design as CardBackDesign).isAnimated && (
            <View style={challengeStyles.animBadge}>
              <Text style={challengeStyles.animBadgeText}>✦</Text>
            </View>
          )}
          {isEquipped && (
            <View style={challengeStyles.equippedBadge}>
              <Text style={challengeStyles.equippedBadgeText}>ON</Text>
            </View>
          )}
        </View>

        <Text style={[challengeStyles.unlockLabel, locked && { opacity: 0.5 }]} numberOfLines={1}>
          {locked ? `🔒 ${unlockLabel}` : unlockLabel}
        </Text>

        {locked && progress > 0 && (
          <View style={{ marginTop: 4 }}>
            <ProgressBar progress={progress} colour={THEME.gold} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const challengeStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(201,168,76,0.12)',
    backgroundColor: 'rgba(17,34,64,0.5)',
    marginBottom: 8,
  },
  cardEquipped: {
    borderColor: 'rgba(201,168,76,0.4)',
    backgroundColor: 'rgba(201,168,76,0.06)',
  },
  cardLocked: {
    opacity: 0.75,
  },
  designName: {
    color: THEME.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  unlockLabel: {
    color: THEME.textMuted,
    fontSize: 11,
  },
  animBadge: {
    backgroundColor: 'rgba(201,168,76,0.2)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  animBadgeText: {
    color: THEME.gold,
    fontSize: 9,
    fontWeight: '700',
  },
  equippedBadge: {
    backgroundColor: THEME.gold,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  equippedBadgeText: {
    color: THEME.appBackground,
    fontSize: 9,
    fontWeight: '800',
  },
})

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 20 }}>
      <View style={{ width: 16, height: 0.5, backgroundColor: THEME.gold }} />
      <Text style={{ color: THEME.gold, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
        {title}
      </Text>
    </View>
  )
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[tabStyles.tab, active && tabStyles.tabActive]}>
      <Text style={[tabStyles.tabText, active && tabStyles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

const tabStyles = StyleSheet.create({
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: THEME.gold,
  },
  tabText: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: THEME.gold,
    fontWeight: '600',
  },
})

// ─── ChallengesScreen ─────────────────────────────────────────────────────────

export default function ChallengesScreen() {
  const router = useRouter()
  const { profile, user, updateProfile, isGuest } = useAuth()

  const [tab, setTab] = useState<'backs' | 'faces'>('backs')
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [gamesWon, setGamesWon] = useState(0)
  const [unlockedBacks, setUnlockedBacks] = useState<string[]>(['back_00'])
  const [unlockedFaces, setUnlockedFaces] = useState<string[]>(['face_00'])

  const equippedBackId = profile?.cardBackId ?? 'back_00'
  const equippedFaceId = profile?.cardFaceId ?? 'face_00'

  // ── Fetch stats and unlocks ──────────────────────────────────────────────
  useEffect(() => {
    if (!user || isGuest) return

    const fetchStats = async () => {
      const { data } = await supabase
        .from('player_stats')
        .select('games_played, games_won, unlocked_card_backs, unlocked_card_faces')
        .eq('id', user.id)
        .single()

      if (data) {
        setGamesPlayed(data.games_played ?? 0)
        setGamesWon(data.games_won ?? 0)
        setUnlockedBacks(data.unlocked_card_backs ?? ['back_00'])
        setUnlockedFaces(data.unlocked_card_faces ?? ['face_00'])
      }
    }

    fetchStats()
  }, [user, isGuest])

  // ── Equip handlers ───────────────────────────────────────────────────────
  const equipBack = async (id: string) => {
    await updateProfile({ cardBackId: id })
  }

  const equipFace = async (id: string) => {
    await updateProfile({ cardFaceId: id })
  }

  // ── Compute progress for locked designs ─────────────────────────────────
  function getProgress(design: CardBackDesign | CardFaceDesign): number {
    if (design.unlockType === 'default') return 1
    if (design.unlockType === 'games_played') {
      return design.unlockCount > 0 ? Math.min(1, gamesPlayed / design.unlockCount) : 0
    }
    return design.unlockCount > 0 ? Math.min(1, gamesWon / design.unlockCount) : 0
  }

  // ── Sort: equipped first, then unlocked, then locked ────────────────────
  function sortDesigns<T extends CardBackDesign | CardFaceDesign>(
    designs: T[],
    equippedId: string,
    unlocked: string[]
  ): T[] {
    return [...designs].sort((a, b) => {
      const aEq = a.id === equippedId ? 2 : unlocked.includes(a.id) ? 1 : 0
      const bEq = b.id === equippedId ? 2 : unlocked.includes(b.id) ? 1 : 0
      if (aEq !== bEq) return bEq - aEq
      return a.tier - b.tier
    })
  }

  const sortedBacks = sortDesigns(CARD_BACKS, equippedBackId, unlockedBacks)
  const sortedFaces = sortDesigns(CARD_FACES, equippedFaceId, unlockedFaces)

  // ── Nearest unlock ───────────────────────────────────────────────────────
  const allDesigns = [...CARD_BACKS, ...CARD_FACES] as (CardBackDesign | CardFaceDesign)[]
  const nearestUnlock = allDesigns
    .filter((d) => {
      if (d.unlockType === 'default') return false
      const isBack = 'svgContent' in d
      const unlocked = isBack ? unlockedBacks : unlockedFaces
      return !unlocked.includes(d.id)
    })
    .sort((a, b) => getProgress(b) - getProgress(a))[0]

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>CARDS</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Nearest unlock strip */}
      {nearestUnlock && (
        <View style={styles.nearestStrip}>
          <Text style={styles.nearestLabel}>Nearest unlock</Text>
          <Text style={styles.nearestName}>{nearestUnlock.name}</Text>
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <ProgressBar progress={getProgress(nearestUnlock)} colour={THEME.gold} />
          </View>
          <Text style={styles.nearestProgress}>
            {nearestUnlock.unlockType === 'games_played'
              ? `${gamesPlayed}/${nearestUnlock.unlockCount}`
              : `${gamesWon}/${nearestUnlock.unlockCount}`}
          </Text>
        </View>
      )}

      {/* Guest notice */}
      {isGuest && (
        <TouchableOpacity style={styles.guestNotice} onPress={() => router.push('/auth')}>
          <Text style={styles.guestNoticeText}>Sign in to save your card preferences →</Text>
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <Tab label="Card Backs" active={tab === 'backs'} onPress={() => setTab('backs')} />
        <Tab label="Card Faces" active={tab === 'faces'} onPress={() => setTab('faces')} />
      </View>

      {/* List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'backs' ? (
          <>
            <SectionHeader title="Card Backs" />
            {sortedBacks.map((design) => {
              const isUnlocked = unlockedBacks.includes(design.id) || design.unlockType === 'default'
              return (
                <ChallengeCard
                  key={design.id}
                  type="back"
                  design={design}
                  isEquipped={design.id === equippedBackId}
                  isUnlocked={isUnlocked}
                  progress={getProgress(design)}
                  onEquip={() => equipBack(design.id)}
                />
              )
            })}
          </>
        ) : (
          <>
            <SectionHeader title="Card Faces" />
            {sortedFaces.map((design) => {
              const isUnlocked = unlockedFaces.includes(design.id) || design.unlockType === 'default'
              return (
                <ChallengeCard
                  key={design.id}
                  type="face"
                  design={design}
                  isEquipped={design.id === equippedFaceId}
                  isUnlocked={isUnlocked}
                  progress={getProgress(design)}
                  onEquip={() => equipFace(design.id)}
                />
              )
            })}
          </>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.appBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(201,168,76,0.15)',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: THEME.gold,
    fontSize: 22,
  },
  title: {
    color: THEME.gold,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 3,
  },
  nearestStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(201,168,76,0.12)',
    gap: 6,
  },
  nearestLabel: {
    color: THEME.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nearestName: {
    color: THEME.gold,
    fontSize: 11,
    fontWeight: '600',
  },
  nearestProgress: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '500',
    minWidth: 42,
    textAlign: 'right',
  },
  guestNotice: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(55,138,221,0.1)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(55,138,221,0.2)',
  },
  guestNoticeText: {
    color: THEME.info,
    fontSize: 12,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(201,168,76,0.12)',
    paddingHorizontal: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
})
