import { supabase } from './supabase'
import { CARD_BACKS } from '../assets/cardbacks'
import { CARD_FACES } from '../assets/cardfaces'

export type GameResult = {
  userId: string
  isGuest: boolean
  placement: number  // 1 = 1st place (win), 2+ = loss
  isRanked: boolean
  gameMode: 'quickplay' | 'private' | 'ai'
  turnsPlayed: number
  maxCardsHeld: number
  cardsDrawn: number
  biggestPickup: number
  blackJacksReceived: number
  blackJacksCountered: number
  twosStacked: number
  twosReceived: number
  falseOnCardsCount: number
  correctOnCardsCount: number
  timedOutCount: number
  wasKicked: boolean
  opponentId?: string
  opponentUsername?: string
  suitWonWith?: string
}

// Returns newly unlocked design IDs (backs and faces combined) so the caller
// can show a notification. Call AFTER updating stats so counts are current.
export async function checkAndGrantUnlocks(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('player_stats')
    .select('games_played, games_won, unlocked_card_backs, unlocked_card_faces')
    .eq('id', userId)
    .single()

  if (!data) return []

  const gamesPlayed: number = data.games_played ?? 0
  const gamesWon: number = data.games_won ?? 0
  const currentBacks: string[] = data.unlocked_card_backs ?? ['back_00']
  const currentFaces: string[] = data.unlocked_card_faces ?? ['face_00']

  const newBacks = CARD_BACKS.filter((d) => {
    if (d.unlockType === 'default') return false
    if (currentBacks.includes(d.id)) return false
    if (d.unlockType === 'games_played') return gamesPlayed >= d.unlockCount
    return gamesWon >= d.unlockCount
  }).map((d) => d.id)

  const newFaces = CARD_FACES.filter((d) => {
    if (d.unlockType === 'default') return false
    if (currentFaces.includes(d.id)) return false
    if (d.unlockType === 'games_played') return gamesPlayed >= d.unlockCount
    return gamesWon >= d.unlockCount
  }).map((d) => d.id)

  if (newBacks.length > 0 || newFaces.length > 0) {
    await supabase
      .from('player_stats')
      .update({
        unlocked_card_backs: [...currentBacks, ...newBacks],
        unlocked_card_faces: [...currentFaces, ...newFaces],
      })
      .eq('id', userId)
  }

  return [...newBacks, ...newFaces]
}

export async function recordGameStats(result: GameResult): Promise<void> {
  if (result.isGuest) return  // guests don't get stats recorded

  const won = result.placement === 1

  const { data: current } = await supabase
    .from('player_stats')
    .select('*')
    .eq('id', result.userId)
    .single()

  if (!current) return

  const newGamesPlayed = current.games_played + 1
  const newGamesWon = current.games_won + (won ? 1 : 0)
  const newWinRate = Math.round((newGamesWon / newGamesPlayed) * 100) / 100
  const newStreak = won ? current.current_streak + 1 : 0
  const newLongestStreak = Math.max(current.longest_streak, newStreak)

  // Update recent results — keep last 10
  const currentResults: number[] = current.recent_results ?? []
  const newResults = [result.placement, ...currentResults].slice(0, 10)

  // Nemesis calculation — if lost to same opponent more than current nemesis
  let nemesisUpdate: Record<string, unknown> = {}
  if (!won && result.opponentId) {
    const newLossCount = (current.nemesis_id === result.opponentId
      ? current.nemesis_loss_count
      : 0) + 1
    if (newLossCount > current.nemesis_loss_count || current.nemesis_id === result.opponentId) {
      nemesisUpdate = {
        nemesis_id: result.opponentId,
        nemesis_username: result.opponentUsername,
        nemesis_loss_count: newLossCount,
      }
    }
  }

  // Victim calculation — if beat same opponent more than current victim
  let victimUpdate: Record<string, unknown> = {}
  if (won && result.opponentId) {
    const newWinCount = (current.victim_id === result.opponentId
      ? current.victim_win_count
      : 0) + 1
    if (newWinCount > current.victim_win_count || current.victim_id === result.opponentId) {
      victimUpdate = {
        victim_id: result.opponentId,
        victim_username: result.opponentUsername,
        victim_win_count: newWinCount,
      }
    }
  }

  // Ranked stats — only update when game was a Quick Play ranked match
  let rankedUpdate: Record<string, unknown> = {}
  if (result.isRanked) {
    const newRankedGamesPlayed = (current.ranked_games_played ?? 0) + 1
    const newRankedWins = (current.ranked_wins ?? 0) + (won ? 1 : 0)
    const newRankedWinRate = Math.round((newRankedWins / newRankedGamesPlayed) * 100) / 100
    const newRankedStreak = won ? (current.ranked_current_streak ?? 0) + 1 : 0
    const newRankedLongestStreak = Math.max(current.ranked_longest_streak ?? 0, newRankedStreak)
    rankedUpdate = {
      ranked_wins: newRankedWins,
      ranked_games_played: newRankedGamesPlayed,
      ranked_win_rate: newRankedWinRate,
      ranked_current_streak: newRankedStreak,
      ranked_longest_streak: newRankedLongestStreak,
    }
  }

  await supabase
    .from('player_stats')
    .update({
      games_played: newGamesPlayed,
      games_won: newGamesWon,
      win_rate: newWinRate,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      total_cards_drawn: current.total_cards_drawn + result.cardsDrawn,
      most_cards_held: Math.max(current.most_cards_held, result.maxCardsHeld),
      biggest_pickup: Math.max(current.biggest_pickup, result.biggestPickup),
      times_picked_up_black_jack: current.times_picked_up_black_jack + result.blackJacksReceived,
      times_countered_black_jack: current.times_countered_black_jack + result.blackJacksCountered,
      times_stacked_two: current.times_stacked_two + result.twosStacked,
      times_victim_of_two: current.times_victim_of_two + result.twosReceived,
      times_false_on_cards: current.times_false_on_cards + result.falseOnCardsCount,
      times_correct_on_cards: current.times_correct_on_cards + result.correctOnCardsCount,
      times_kicked_timeout: result.wasKicked
        ? current.times_kicked_timeout + 1
        : current.times_kicked_timeout,
      fastest_win_turns: won
        ? (current.fastest_win_turns
          ? Math.min(current.fastest_win_turns, result.turnsPlayed)
          : result.turnsPlayed)
        : current.fastest_win_turns,
      longest_game_turns: Math.max(current.longest_game_turns, result.turnsPlayed),
      favourite_suit: (won && result.suitWonWith) ? result.suitWonWith : current.favourite_suit,
      recent_results: newResults,
      ...nemesisUpdate,
      ...victimUpdate,
      ...rankedUpdate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', result.userId)
}
