import { supabase } from './supabase'

export type GameResult = {
  userId: string
  isGuest: boolean
  placement: number  // 1 = 1st place (win), 2+ = loss
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
      ...nemesisUpdate,
      ...victimUpdate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', result.userId)
}
