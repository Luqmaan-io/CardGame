import { Card, GameState, Player, Suit } from './types';
import { isPowerCard, isBlackJack } from './types';
import { isValidCombo } from './validation';
import { canWinNextTurn } from './validation';
import { applyPowerCardEffect } from './effects';
import { reshuffleDiscard, shuffleDeck } from './deck';

export function getNextPlayerIndex(state: GameState): number {
  const { players, currentPlayerIndex, direction, skipsRemaining } = state;
  const count = players.length;
  const step = direction === 'clockwise' ? 1 : -1;

  let skipsLeft = skipsRemaining;
  let idx = currentPlayerIndex;

  // Advance past current player first
  idx = ((idx + step) % count + count) % count;

  // Apply skips
  while (skipsLeft > 0) {
    idx = ((idx + step) % count + count) % count;
    skipsLeft--;
  }

  return idx;
}

export function checkWinCondition(playerId: string, state: GameState): boolean {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return false;
  return player.hand.length === 0;
}

/**
 * Called after a player empties their hand (non-power card finish).
 * Records their placement, removes them from active players, and either
 * ends the game (≤1 player remaining) or continues play.
 */
export function checkPlayerFinished(playerId: string, state: GameState): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.hand.length > 0) return state;

  const place = state.placements.length + 1;
  const newPlacements = [...state.placements, { playerId, place }];
  const remainingPlayers = state.players.filter((p) => p.id !== playerId);
  const scoredState = awardWin(playerId, state);

  // Only 1 player left — award last place automatically, game over
  if (remainingPlayers.length === 1) {
    const lastPlace = place + 1;
    const finalPlacements = [...newPlacements, { playerId: remainingPlayers[0]!.id, place: lastPlace }];
    return {
      ...scoredState,
      placements: finalPlacements,
      players: [],
      phase: 'game-over',
      winnerId: newPlacements[0]!.playerId,
    };
  }

  // No players left at all
  if (remainingPlayers.length === 0) {
    return {
      ...scoredState,
      placements: newPlacements,
      players: [],
      phase: 'game-over',
      winnerId: newPlacements[0]!.playerId,
    };
  }

  // Game continues — remove finished player, adjust currentPlayerIndex
  const newCurrentIndex =
    state.currentPlayerIndex >= remainingPlayers.length ? 0 : state.currentPlayerIndex;
  return {
    ...scoredState,
    placements: newPlacements,
    players: remainingPlayers,
    winnerId: newPlacements[0]!.playerId,
    currentPlayerIndex: newCurrentIndex,
    phase: 'play',
  };
}

/**
 * Advance the turn to the next player.
 * Resets skipsRemaining, sets phase to 'play', clears currentPlayerHasActed,
 * and clears onCardsDeclarations for the incoming player.
 */
export function advanceTurn(state: GameState): GameState {
  const nextIndex = getNextPlayerIndex(state);
  const nextPlayer = state.players[nextIndex];
  return {
    ...state,
    currentPlayerIndex: nextIndex,
    skipsRemaining: 0,
    phase: 'play',
    timerStartedAt: null,
    currentPlayerHasActed: false,
    onCardsDeclarations: nextPlayer
      ? clearOnCardsDeclarationInner(nextPlayer.id, state.onCardsDeclarations)
      : state.onCardsDeclarations,
  };
}

/**
 * Draw `count` cards for the current player.
 * Does NOT advance the turn — call advanceTurn() after this.
 * Sets currentPlayerHasActed: true.
 */
export function drawCard(count: number, state: GameState): GameState {
  let currentState = { ...state };

  const currentPlayer = currentState.players[currentState.currentPlayerIndex];
  if (!currentPlayer) return currentState;

  let drawn: Card[] = [];
  let remaining = count;

  while (remaining > 0) {
    if (currentState.deck.length === 0) {
      const reshuffled = reshuffleDiscard(currentState);
      if (reshuffled.deck.length === 0) {
        break;
      }
      currentState = reshuffled;
    }

    const card = currentState.deck[0];
    if (!card) break;

    drawn.push(card);
    currentState = {
      ...currentState,
      deck: currentState.deck.slice(1),
    };
    remaining--;
  }

  const updatedPlayer: Player = {
    ...currentPlayer,
    hand: [...currentPlayer.hand, ...drawn],
  };

  const updatedPlayers = currentState.players.map((p) =>
    p.id === currentPlayer.id ? updatedPlayer : p
  );

  return {
    ...currentState,
    players: updatedPlayers,
    pendingPickup: 0,
    pendingPickupType: null,
    skipsRemaining: 0,
    phase: 'play',
    currentPlayerHasActed: true,
  };
}

/**
 * When a combo contains multiple DIFFERENT power card types, only the last
 * power card's effect applies. Same-type stacking (two 2s, two Kings, etc.)
 * is unaffected — this only resolves conflicts between different types.
 */
export function resolveConflictingEffects(state: GameState, playedCards: Card[]): GameState {
  const powerCards = playedCards.filter(isPowerCard);
  if (powerCards.length <= 1) return state;

  const lastPowerCard = powerCards[powerCards.length - 1]!;
  const otherPowerRanks = new Set(powerCards.slice(0, -1).map((c) => c.rank));

  // Only resolve if there are genuinely different power card types involved
  const hasDifferentTypes = otherPowerRanks.size > 0 && !otherPowerRanks.has(lastPowerCard.rank)
    || (otherPowerRanks.size > 1);

  if (!hasDifferentTypes) return state;

  // Last power card is Ace — clear any pickup from earlier 2s or black Jacks
  if (lastPowerCard.rank === 'A') {
    return { ...state, pendingPickup: 0, pendingPickupType: null };
  }

  // Last power card is 2 or black Jack — clear any active suit from earlier Ace
  if (lastPowerCard.rank === '2' || isBlackJack(lastPowerCard)) {
    return { ...state, activeSuit: null };
  }

  // Last power card is King — clear any active suit from earlier Ace
  if (lastPowerCard.rank === 'K') {
    return { ...state, activeSuit: null };
  }

  // Last power card is 8 — clear any pickup from earlier 2s or black Jacks
  if (lastPowerCard.rank === '8') {
    return { ...state, pendingPickup: 0, pendingPickupType: null };
  }

  return state;
}

/**
 * Apply a valid combo play for the current player.
 * Does NOT advance the turn — call advanceTurn() after this.
 * Sets currentPlayerHasActed: true.
 * Immediately returns game-over state when the win condition is met.
 */
export function applyPlay(
  cards: Card[],
  declaredSuit: Suit | null,
  state: GameState
): GameState {
  if (!isValidCombo(cards, state)) {
    throw new Error('Invalid combo played.');
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer) throw new Error('No current player.');

  // Remove played cards from hand
  const playedSet = [...cards];
  const newHand = [...currentPlayer.hand];
  for (const played of playedSet) {
    const idx = newHand.findIndex(
      (c) => c.rank === played.rank && c.suit === played.suit
    );
    if (idx === -1) throw new Error(`Card not in hand: ${played.rank} of ${played.suit}`);
    newHand.splice(idx, 1);
  }

  const updatedPlayer: Player = { ...currentPlayer, hand: newHand };
  let updatedPlayers = state.players.map((p) =>
    p.id === currentPlayer.id ? updatedPlayer : p
  );

  // Add cards to discard
  let newDiscard = [...state.discard, ...cards];

  // Build intermediate state — reset strike for successful move, reset timer
  let newState: GameState = applyMoveSuccess(currentPlayer.id, {
    ...state,
    players: updatedPlayers,
    discard: newDiscard,
    activeSuit: null,
    skipsRemaining: 0,
    timerStartedAt: null,
  });

  // Apply power card effects in order
  for (const card of cards) {
    if (isPowerCard(card)) {
      newState = applyPowerCardEffect(card, declaredSuit, newState);
    }
  }

  // Resolve conflicting effects when different power card types appear in the same combo
  newState = resolveConflictingEffects(newState, cards);

  // Check win condition
  const lastCard = cards[cards.length - 1]!;
  const handEmpty = newHand.length === 0;

  if (handEmpty) {
    if (!isPowerCard(lastCard)) {
      // Player finished — record placement, may continue if others remain
      return checkPlayerFinished(currentPlayer.id, {
        ...newState,
        currentPlayerHasActed: true,
      });
    } else {
      // Power card finish — draw 1 card for current player, stay on their turn
      let drawState = { ...newState, currentPlayerIndex: state.currentPlayerIndex };
      if (drawState.deck.length === 0) {
        drawState = reshuffleDiscard(drawState);
      }
      let drawnCard: Card | undefined;
      if (drawState.deck.length > 0) {
        drawnCard = drawState.deck[0];
        drawState = { ...drawState, deck: drawState.deck.slice(1) };
      }
      const handAfterDraw = drawnCard ? [...newHand, drawnCard] : [...newHand];
      const updatedPlayerAfterDraw: Player = { ...currentPlayer, hand: handAfterDraw };
      const playersAfterDraw = drawState.players.map((p) =>
        p.id === currentPlayer.id ? updatedPlayerAfterDraw : p
      );
      return {
        ...drawState,
        players: playersAfterDraw,
        phase: newState.phase === 'declare-suit' ? 'declare-suit' : 'play',
        currentPlayerHasActed: true,
      };
    }
  }

  // Normal play — stay on current player, awaiting end-turn / declaration
  return {
    ...newState,
    phase: newState.phase === 'declare-suit' ? 'declare-suit' : 'play',
    currentPlayerHasActed: true,
  };
}

// ─── Timer / strike helpers ───────────────────────────────────────────────────

/**
 * Called when a player's turn timer expires.
 * Strike 1–2: auto-draw one card, advance turn immediately (no declaration window).
 * Strike 3: kick the player, shuffle their hand into the deck, advance turn.
 * If only one player remains after kick, that player wins immediately.
 */
export function applyTimeout(state: GameState): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer) return state;

  const playerId = currentPlayer.id;
  const currentStrikes = state.timeoutStrikes[playerId] ?? 0;
  const newStrikes = currentStrikes + 1;

  if (newStrikes >= 3) {
    // Kick the player — shuffle their hand into the deck
    const newDeck = shuffleDeck([...state.deck, ...currentPlayer.hand]);
    const remainingPlayers = state.players.filter((p) => p.id !== playerId);

    // Base state after kick, reset that player's strikes
    const kickedStrikes = { ...state.timeoutStrikes };
    delete kickedStrikes[playerId];

    if (remainingPlayers.length === 1) {
      // Last player standing wins
      const winner = remainingPlayers[0]!;
      const scoredState = awardWin(winner.id, {
        ...state,
        deck: newDeck,
        players: remainingPlayers,
        timeoutStrikes: kickedStrikes,
      });
      return {
        ...scoredState,
        phase: 'game-over',
        winnerId: winner.id,
        timerStartedAt: null,
        currentPlayerHasActed: false,
      };
    }

    // Clamp currentPlayerIndex in case it was at or beyond the removed player
    const newIndex = state.currentPlayerIndex >= remainingPlayers.length
      ? 0
      : state.currentPlayerIndex;

    const nextPlayer = remainingPlayers[newIndex];

    return {
      ...state,
      deck: newDeck,
      players: remainingPlayers,
      currentPlayerIndex: newIndex,
      phase: 'play',
      timerStartedAt: null,
      timeoutStrikes: kickedStrikes,
      currentPlayerHasActed: false,
      onCardsDeclarations: nextPlayer
        ? clearOnCardsDeclarationInner(nextPlayer.id, state.onCardsDeclarations)
        : state.onCardsDeclarations,
    };
  }

  // Strike 1 or 2 — draw one card, advance turn immediately (bypass declaration window)
  let drawState: GameState = { ...state };
  if (drawState.deck.length === 0) {
    drawState = reshuffleDiscard(drawState);
  }
  let drawnCard: Card | undefined;
  if (drawState.deck.length > 0) {
    drawnCard = drawState.deck[0];
    drawState = { ...drawState, deck: drawState.deck.slice(1) };
  }
  const newHand = drawnCard
    ? [...currentPlayer.hand, drawnCard]
    : [...currentPlayer.hand];
  const updatedPlayer: Player = { ...currentPlayer, hand: newHand };
  const updatedPlayers = drawState.players.map((p) =>
    p.id === playerId ? updatedPlayer : p
  );

  const withStrikes: GameState = {
    ...drawState,
    players: updatedPlayers,
    pendingPickup: 0,
    pendingPickupType: null,
    skipsRemaining: 0,
    currentPlayerHasActed: true,
    timeoutStrikes: { ...state.timeoutStrikes, [playerId]: newStrikes },
  };

  return advanceTurn(withStrikes);
}

/**
 * Resets the consecutive timeout strike for playerId to 0.
 * Called after any successful valid move.
 */
export function applyMoveSuccess(playerId: string, state: GameState): GameState {
  if ((state.timeoutStrikes[playerId] ?? 0) === 0) return state;
  return {
    ...state,
    timeoutStrikes: { ...state.timeoutStrikes, [playerId]: 0 },
  };
}

/**
 * Declare "I'm on cards" for the current player.
 * Requires: it is currently this player's turn AND currentPlayerHasActed === true.
 * Validates whether the player can actually win next turn via canWinNextTurn.
 * If valid: adds playerId to onCardsDeclarations, returns { newState, isValid: true }.
 * If invalid: draws 2 cards as penalty (without advancing turn), returns { newState, isValid: false }.
 * Does NOT advance the turn — call advanceTurn() after this.
 */
export function declareOnCards(
  playerId: string,
  state: GameState
): { newState: GameState; isValid: boolean } {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) {
    throw new Error('Can only declare "on cards" on your own turn.');
  }
  if (!state.currentPlayerHasActed) {
    throw new Error('Must complete your action (play or draw) before declaring.');
  }

  const isValid = canWinNextTurn(playerId, state);

  if (isValid) {
    if (state.onCardsDeclarations.includes(playerId)) {
      // Already declared — idempotent
      return { newState: state, isValid: true };
    }
    const newState: GameState = {
      ...state,
      onCardsDeclarations: [...state.onCardsDeclarations, playerId],
    };
    return { newState, isValid: true };
  }

  // Invalid declaration — draw 2 as penalty (inline, no turn advance)
  let penaltyState = { ...state };
  let drawn: Card[] = [];
  let remaining = 2;
  while (remaining > 0) {
    if (penaltyState.deck.length === 0) {
      const reshuffled = reshuffleDiscard(penaltyState);
      if (reshuffled.deck.length === 0) break;
      penaltyState = reshuffled;
    }
    const card = penaltyState.deck[0];
    if (!card) break;
    drawn.push(card);
    penaltyState = { ...penaltyState, deck: penaltyState.deck.slice(1) };
    remaining--;
  }

  const updatedPlayer: Player = {
    ...currentPlayer,
    hand: [...currentPlayer.hand, ...drawn],
  };
  const updatedPlayers = penaltyState.players.map((p) =>
    p.id === playerId ? updatedPlayer : p
  );

  const newState: GameState = {
    ...penaltyState,
    players: updatedPlayers,
  };
  return { newState, isValid: false };
}

/**
 * Removes playerId from onCardsDeclarations.
 * Called at the start of that player's next turn (internally by advanceTurn).
 */
export function clearOnCardsDeclaration(playerId: string, state: GameState): GameState {
  return {
    ...state,
    onCardsDeclarations: clearOnCardsDeclarationInner(playerId, state.onCardsDeclarations),
  };
}

function clearOnCardsDeclarationInner(playerId: string, declarations: string[]): string[] {
  return declarations.filter((id) => id !== playerId);
}

/**
 * Increments sessionScores[playerId] by 1.
 * Called when a winner is determined.
 */
export function awardWin(playerId: string, state: GameState): GameState {
  const current = state.sessionScores[playerId] ?? 0;
  return {
    ...state,
    sessionScores: { ...state.sessionScores, [playerId]: current + 1 },
  };
}
