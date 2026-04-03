import { Card, GameState, Player, Suit } from './types';
import { isPowerCard } from './types';
import { isValidCombo } from './validation';
import { applyPowerCardEffect } from './effects';
import { reshuffleDiscard } from './deck';

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

export function drawCard(count: number, state: GameState): GameState {
  let currentState = { ...state };

  const currentPlayer = currentState.players[currentState.currentPlayerIndex];
  if (!currentPlayer) return currentState;

  let drawn: Card[] = [];
  let remaining = count;

  while (remaining > 0) {
    if (currentState.deck.length === 0) {
      // Try to reshuffle discard into deck
      const reshuffled = reshuffleDiscard(currentState);
      if (reshuffled.deck.length === 0) {
        // Both deck and discard are empty — stop drawing gracefully
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

  const nextIndex = getNextPlayerIndex({
    ...currentState,
    skipsRemaining: 0, // drawing does not carry skips
  });

  return {
    ...currentState,
    players: updatedPlayers,
    currentPlayerIndex: nextIndex,
    pendingPickup: 0,
    pendingPickupType: null,
    skipsRemaining: 0,
    phase: 'play',
  };
}

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

  // Build intermediate state
  let newState: GameState = {
    ...state,
    players: updatedPlayers,
    discard: newDiscard,
    activeSuit: null, // reset activeSuit; Ace effect will re-set if needed
    skipsRemaining: 0, // reset; 8 effects will accumulate
  };

  // Apply power card effects in order
  for (const card of cards) {
    if (isPowerCard(card)) {
      newState = applyPowerCardEffect(card, declaredSuit, newState);
    }
  }

  // Check win condition
  const lastCard = cards[cards.length - 1]!;
  const handEmpty = newHand.length === 0;

  if (handEmpty) {
    if (!isPowerCard(lastCard)) {
      // Win!
      return {
        ...newState,
        phase: 'game-over',
        winnerId: currentPlayer.id,
      };
    } else {
      // Power card finish — draw 1 card for the current player without
      // resetting pendingPickup/pendingPickupType (those belong to the next
      // player) and using current skipsRemaining to advance correctly.
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
      const nextIdxAfterDraw = getNextPlayerIndex({ ...drawState, players: playersAfterDraw });
      return {
        ...drawState,
        players: playersAfterDraw,
        currentPlayerIndex: nextIdxAfterDraw,
        skipsRemaining: 0,
        phase: 'play',
      };
    }
  }

  // Advance to next player
  const nextIndex = getNextPlayerIndex(newState);

  return {
    ...newState,
    currentPlayerIndex: nextIndex,
    skipsRemaining: 0,
    phase: 'play',
  };
}
