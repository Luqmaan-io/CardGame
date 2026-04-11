import { supabase } from './supabase'

export type FriendProfile = {
  id: string
  username: string
  avatarId: string
  colourHex: string
  friendCode: string
  status: 'pending' | 'accepted' | 'sent'
}

export type LeaderboardEntry = {
  id: string
  username: string
  avatarId: string
  colourHex: string
  gamesWon: number
  gamesPlayed: number
  winRate: number
  currentStreak: number
  longestStreak: number
  rank?: number
}

// Send a friend request by friend code
export async function sendFriendRequest(
  myUserId: string,
  friendCode: string
): Promise<{ success: boolean; error?: string }> {
  const { data: targetProfile, error: lookupError } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('friend_code', friendCode.toUpperCase())
    .single()

  if (lookupError || !targetProfile) {
    return { success: false, error: 'Friend code not found' }
  }

  if (targetProfile.id === myUserId) {
    return { success: false, error: 'You cannot add yourself' }
  }

  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status')
    .or(
      `and(requester_id.eq.${myUserId},addressee_id.eq.${targetProfile.id}),` +
      `and(requester_id.eq.${targetProfile.id},addressee_id.eq.${myUserId})`
    )
    .single()

  if (existing) {
    if (existing.status === 'accepted') {
      return { success: false, error: 'Already friends' }
    }
    return { success: false, error: 'Friend request already sent' }
  }

  const { error } = await supabase
    .from('friendships')
    .insert({
      requester_id: myUserId,
      addressee_id: targetProfile.id,
      status: 'pending',
    })

  if (error) {
    return { success: false, error: 'Failed to send request' }
  }

  return { success: true }
}

// Accept a friend request
export async function acceptFriendRequest(
  friendshipId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)

  return !error
}

// Decline or remove a friendship
export async function removeFriendship(
  friendshipId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)

  return !error
}

type RawProfile = {
  id: string
  username: string
  avatar_id: string
  colour_hex: string
  friend_code: string
}

// Get all friends and pending requests for a user
export async function getFriends(userId: string): Promise<{
  friends: (FriendProfile & { friendshipId: string })[]
  pendingReceived: (FriendProfile & { friendshipId: string })[]
  pendingSent: (FriendProfile & { friendshipId: string })[]
}> {
  const { data: friendships } = await supabase
    .from('friendships')
    .select(`
      id,
      status,
      requester_id,
      addressee_id,
      requester:profiles!friendships_requester_id_fkey(id, username, avatar_id, colour_hex, friend_code),
      addressee:profiles!friendships_addressee_id_fkey(id, username, avatar_id, colour_hex, friend_code)
    `)
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

  if (!friendships) return { friends: [], pendingReceived: [], pendingSent: [] }

  const friends: (FriendProfile & { friendshipId: string })[] = []
  const pendingReceived: (FriendProfile & { friendshipId: string })[] = []
  const pendingSent: (FriendProfile & { friendshipId: string })[] = []

  for (const f of friendships) {
    const isRequester = f.requester_id === userId
    const otherProfile = (isRequester ? f.addressee : f.requester) as RawProfile | null

    if (!otherProfile) continue

    const entry = {
      friendshipId: f.id as string,
      id: otherProfile.id,
      username: otherProfile.username,
      avatarId: otherProfile.avatar_id,
      colourHex: otherProfile.colour_hex,
      friendCode: otherProfile.friend_code,
      status: f.status as 'pending' | 'accepted' | 'sent',
    }

    if (f.status === 'accepted') {
      friends.push(entry)
    } else if (f.status === 'pending') {
      if (isRequester) {
        pendingSent.push({ ...entry, status: 'sent' })
      } else {
        pendingReceived.push({ ...entry, status: 'pending' })
      }
    }
  }

  return { friends, pendingReceived, pendingSent }
}

// Global leaderboard
export async function getGlobalLeaderboard(
  limit = 50
): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from('player_stats')
    .select(`
      id,
      games_won,
      games_played,
      win_rate,
      current_streak,
      longest_streak,
      profiles(username, avatar_id, colour_hex)
    `)
    .order('games_won', { ascending: false })
    .limit(limit)

  if (!data) return []

  return data.map((row, index) => ({
    id: row.id,
    username: (row.profiles as { username: string } | null)?.username ?? 'Unknown',
    avatarId: (row.profiles as { avatar_id: string } | null)?.avatar_id ?? 'avatar_01',
    colourHex: (row.profiles as { colour_hex: string } | null)?.colour_hex ?? '#378ADD',
    gamesWon: row.games_won,
    gamesPlayed: row.games_played,
    winRate: row.win_rate,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    rank: index + 1,
  }))
}

// Friends leaderboard — includes the current user
export async function getFriendsLeaderboard(
  userId: string
): Promise<LeaderboardEntry[]> {
  const { data: friendships } = await supabase
    .from('accepted_friends')
    .select('friend_id')
    .eq('user_id', userId)

  const friendIds = [userId, ...(friendships ?? []).map((f: { friend_id: string }) => f.friend_id)]

  const { data } = await supabase
    .from('player_stats')
    .select(`
      id,
      games_won,
      games_played,
      win_rate,
      current_streak,
      longest_streak,
      profiles(username, avatar_id, colour_hex)
    `)
    .in('id', friendIds)
    .order('games_won', { ascending: false })

  if (!data) return []

  return data.map((row, index) => ({
    id: row.id,
    username: (row.profiles as { username: string } | null)?.username ?? 'Unknown',
    avatarId: (row.profiles as { avatar_id: string } | null)?.avatar_id ?? 'avatar_01',
    colourHex: (row.profiles as { colour_hex: string } | null)?.colour_hex ?? '#378ADD',
    gamesWon: row.games_won,
    gamesPlayed: row.games_played,
    winRate: row.win_rate,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    rank: index + 1,
  }))
}
