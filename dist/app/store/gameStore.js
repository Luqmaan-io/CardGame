"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGameStore = void 0;
const zustand_1 = require("zustand");
exports.useGameStore = (0, zustand_1.create)((set, get) => ({
    gameState: null,
    myPlayerId: '',
    roomId: null,
    roomInfo: null,
    selectedCards: [],
    socket: null,
    playerName: '',
    error: null,
    pendingTimeoutNotification: null,
    connectionState: 'connecting',
    pendingGameStats: null,
    pendingReaction: null,
    setGameState: (state) => set({ gameState: state, selectedCards: [] }),
    setError: (error) => set({ error }),
    setPendingTimeoutNotification: (msg) => set({ pendingTimeoutNotification: msg }),
    setConnectionState: (state) => set({ connectionState: state }),
    setPendingGameStats: (stats) => set({ pendingGameStats: stats }),
    setPendingReaction: (r) => set({ pendingReaction: r }),
    setRoom: (roomId, playerId) => set({ roomId, myPlayerId: playerId }),
    setRoomInfo: (room) => set({ roomInfo: room }),
    setSocket: (socket) => set({ socket }),
    setPlayerName: (name) => set({ playerName: name }),
    selectCard: (card) => {
        const { selectedCards } = get();
        const alreadySelected = selectedCards.some((c) => c.rank === card.rank && c.suit === card.suit);
        if (!alreadySelected) {
            set({ selectedCards: [...selectedCards, card] });
        }
    },
    deselectCard: (card) => {
        const { selectedCards } = get();
        set({
            selectedCards: selectedCards.filter((c) => !(c.rank === card.rank && c.suit === card.suit)),
        });
    },
    clearSelection: () => set({ selectedCards: [] }),
    reset: () => set({
        gameState: null,
        roomId: null,
        roomInfo: null,
        selectedCards: [],
        myPlayerId: '',
    }),
}));
//# sourceMappingURL=gameStore.js.map