# GAME_RULES.md
> The canonical rule spec for the card game engine. All game logic must be validated against this document.
 
---
 
## Overview
 
- **Players:** 2–4
- **Deck:** Standard 52-card deck, no jokers
- **Goal:** Be the first player to empty your hand
- **Turn order:** Clockwise from dealer's left (direction can be reversed by Kings)
 
---
 
## Setup
 
1. Shuffle the full 52-card deck
2. Deal 7 cards to each player
3. Remaining cards form the **draw pile** (face-down)
4. Flip the top card of the draw pile to start the **discard pile**
5. If the starting discard card is a power card, its effect does NOT apply — it is treated as a neutral starting card
 
---
 
## On Your Turn — Basic Flow
 
1. Check if you have an active penalty (see Power Cards). If yes, counter it or take the penalty (turn ends).
2. If no penalty, play one or more valid cards as a combo (see Combos), OR draw one card and end your turn.
3. After playing, apply any power card effects.
4. If your hand is now empty AND your last card was not a power card — you win.
5. If your last card WAS a power card, you must immediately draw one card (the power card effect still applies).
6. Pass play to the next player (adjusted for skips/reversals).
 
---
 
## Valid Card Play
 
A card is valid to play if ANY of the following are true:
- It matches the **suit** of the top discard card (or the Ace-declared suit if active)
- It matches the **rank** of the top discard card
- It is a power card with a special interaction (see Power Cards)
 
---
 
## Combos
 
A player may play **multiple cards in a single turn** forming a continuous ascending or descending run.
 
**Rules:**
- Each card in the combo must connect to the previous by **matching rank** (to change suit) or **matching suit** (to change rank by ±1 in the run direction)
- The run direction (ascending or descending) is set by the first two cards and must be maintained
- Suits may change mid-run by matching rank: `4♦ → 4♠ → 5♠ → 6♠` is valid
- There is no maximum combo length
- A combo may **end on a power card** — but see the power card finish rule below
- A Queen played mid-combo requires an immediate same-suit cover card; that cover card **can** continue the combo
 
**Example valid combos:**
- `3♦ 4♦ 4♠ 5♠` — ascending, suit change via matching rank
- `9♣ 8♣ 7♣ 7♥ 6♥` — descending, suit change via matching rank
- `Q♥ 3♥ 4♥ 4♠` — Queen covered by 3♥, combo continues from there

When multiple different power cards are played in the same combo, only the final power card's effect applies — earlier power card effects are overridden. Exception: the same power card type played multiple times in one combo still stacks normally (e.g. two 2s = pick up 4, two Kings = two reversals).
 
---
 
## Power Cards
 
### Ace — Suit Changer
- **Effect:** Player declares a new active suit. Next player must match that suit, play another Ace, or draw.
- **Declared suit:** Can be any suit, including the suit currently in play.
- **Stacking:** Aces chain — each new Ace overrides the previously declared suit.
- **Counter:** Another Ace (any suit).
 
### 2 — Pick Up 2
- **Effect:** Next player must draw 2 cards, OR play another 2 to pass and stack the penalty.
- **Stacking:** Each additional 2 adds +2. The player who cannot counter draws the full total.
- **Counter:** Another 2 (any suit).
- **On penalty draw:** Drawing due to a 2-stack penalty ends the player's turn. They may NOT play cards from what they just drew.
 
### 8 — Miss a Turn
- **Effect:** The next player in rotation misses their go.
- **Multiple 8s same turn:** If a player plays two 8s in one turn, the **next two** players both miss.
- **Stacking between players:** Does NOT chain between players. If Player B plays an 8 in response to Player A's 8, the penalty **resets** — Player C misses (not Player C and D). The responding player's 8 is treated as a fresh skip of the following player only.
- **Counter:** Another 8 — redirects the skip to the following player.
 
### Jack of Spades / Jack of Clubs — Pick Up 7
- **Effect:** Next player must draw 7 cards.
- **Stacking:** Black Jacks stack with each other. Two black Jacks = draw 14.
- **Counter:** Jack of Hearts or Jack of Diamonds (red Jack). A red Jack fully cancels the penalty — the player who plays it does NOT draw.
- **Red Jack only counters black Jack — not vice versa.** Red Jacks are defensive only.
- **Red Jacks played outside a black Jack penalty** are treated as normal rank/suit cards (no special effect).
 
### Queen — Must Cover
- **Effect:** A Queen must be covered by either another Queen of any suit OR a card of the same suit as the Queen. Multiple Queens can be stacked — each new Queen satisfies the previous Queen's cover requirement. The final Queen in a chain must be covered by a same-suit non-Queen card.
- **If a player cannot cover:** They cannot legally play the Queen. They must play a different card or draw.
- **Cover card continues combo:** The cover card can extend into a further combo as normal.
- **Cover card can be a power card:** e.g. `Q♥ → 2♥` is valid; the 2♥ penalty then applies to the next player.
- **Example stacking:** `Q♠ → Q♥ → K♥` is valid: Q♥ covers Q♠, K♥ covers Q♥. The cover suit must always match the most recent Queen's suit.
 
### King — Reverse Direction
- **Effect:** Reverses the direction of play (clockwise ↔ anticlockwise).
- **Stacking:** Kings stack. Two Kings = two reversals (back to original direction). Three Kings = one net reversal.
- **2-player rule:** A King still reverses direction — it does NOT function as a skip in 2-player. The other player simply goes next (which is the same result, but the direction state must still update for consistency if more players join).
- **Counter:** Another King.
 
---
 
## Power Card Finish Rule
 
A player **cannot win** by playing a power card as their final card.
 
- If a player's last card is a power card and it is valid to play, they have two options:
  1. Play it — the power card effect applies — then they **immediately draw one card** (turn ends, game continues)
  2. Choose not to play it and instead **draw one card** normally
- A player wins only when their hand reaches zero cards on a **non-power card** play.
 
---
 
## Draw Pile Empty
 
When the draw pile is exhausted:
1. Take all discard pile cards **except** the top card
2. Shuffle them thoroughly
3. Place them face-down as the new draw pile
4. Play continues
 
---
 
## Winning
 
The first player to legally empty their hand on a non-power card wins. The game ends immediately — no further turns are played.
 
---
 
## Edge Cases for the Engine
 
| Situation | Resolution |
|---|---|
| Starting discard is a power card | Treat as neutral — no effect on first turn |
| Player must draw but deck + discard are both empty | Player skips drawing, turn ends (extremely rare) |
| Queen is second-to-last card, no same-suit cover in hand | Player cannot legally play the Queen; must draw |
| All red Jacks already discarded when black Jack played | Next player must draw 7 (or 14 if stacked) — no counter available |
| Player plays King as last card | Direction reverses, then player draws one card (power card finish rule) |
| 2-stack penalty + player draws | Turn ends immediately after drawing. No play from drawn cards. |
| Player has one card left (not a power card) | No special rule — normal play. They should announce "last card" (UI prompt). |
 
---
 
## Turn Timer

- Each player has **30 seconds** to complete their turn.
- The timer resets at the start of every turn.
- If the timer expires, the player **automatically draws one card** and their turn ends — this counts as a **timeout strike**.
- Strikes are **consecutive only** — if a player makes any valid move on their turn, their strike count resets to zero.

| Strike | Consequence |
|---|---|
| Strike 1 | Auto-draw, turn passes. All players see: `"[Player] ran out of time"` |
| Strike 2 | Auto-draw, turn passes. Stronger warning: `"[Player] is about to be removed"` |
| Strike 3 | Player is **kicked** from the game. Their cards are shuffled into the draw pile. The game continues with remaining players. |

- If a kick reduces the game to **one player**, that player wins immediately.
- **Disconnection is treated the same as a timeout** — the 30-second window serves as the reconnection grace period before a strike is issued.

---

## I'm On Cards

- A player may declare **"I'm on cards"** only after completing their action for the turn (after playing cards or drawing) and before passing to the next player.
- The declaration button appears as a **final action at the end of the player's turn** — not at the start.
- When a player taps "I'm on cards" the engine immediately validates whether their remaining hand contains **at least one valid winning play** for their next turn.
- A **winning play** is defined as: a valid combo that would empty the player's hand completely, where the final card in that combo is **not** a power card (A, 2, 8, J, Q, K).
- **Queen edge case:** if the player's hand contains a Queen as part of a potential winning combo, the cover card must also be present in hand and must **not** be a power card.
- **If the declaration is valid:** all other players are notified `"[Player name] is on cards!"` and the declaration is recorded in game state.
- **If the declaration is invalid** (engine determines the player cannot actually win next turn): the player immediately draws 2 cards as a penalty, no notification is sent to other players, a private message shows to the declaring player only: `"You're not on cards — draw 2"`.
- The declaration is **not** a bluff tool — false declarations are penalised.
- If a player legitimately declares but game state changes before their next turn (e.g. Ace changes suit) making their winning play no longer valid — **no penalty applies**, the declaration simply clears.
- The declaration **resets automatically** at the start of that player's next turn regardless of outcome.
- There is **no limit** on how many times a player can declare per game, but each false declaration costs 2 cards.

---

## Scoring

- Each completed game awards **1 point** to the winner.
- Points accumulate across multiple games in the same session.
- **No points are awarded for position** — 2nd, 3rd, and 4th place score nothing.
- A player who is **kicked due to 3 consecutive timeouts** scores nothing for that game.
- Session scores are displayed on the results screen and **persist until the room is closed**.

---

## State Model (for developers)
 
The game engine must track the following at all times:
 
```
GameState {
  deck: Card[]                  // remaining draw pile
  discard: Card[]               // full discard history, top = current
  players: Player[]             // ordered array, index = seat
  currentPlayerIndex: number
  direction: 'clockwise' | 'anticlockwise'
  activeSuit: Suit | null       // set by Ace, cleared when matched
  pendingPickup: number         // cumulative 2-stack or black jack stack
  pendingPickupType: '2' | 'jack' | null
  skipsRemaining: number        // set by 8 plays
  phase: 'play' | 'pickup' | 'cover' | 'declare-suit' | 'game-over'
}
 
Player {
  id: string
  hand: Card[]
  isHuman: boolean
}
 
Card {
  rank: 'A'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'
  suit: 'hearts'|'diamonds'|'clubs'|'spades'
}
```
 
---
 
## Key Functions to Implement
 
- `isValidPlay(card, gameState): boolean`
- `isValidCombo(cards[], gameState): boolean`
- `applyPlay(cards[], gameState): GameState`
- `applyPowerCardEffect(card, gameState): GameState`
- `getNextPlayerIndex(gameState): number`
- `checkWinCondition(player, gameState): boolean`
- `reshuffleDeck(gameState): GameState`
- `getValidPlays(player, gameState): Card[][]` — used by AI and to highlight valid cards in UI
 