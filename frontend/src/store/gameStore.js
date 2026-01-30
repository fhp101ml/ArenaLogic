import { create } from 'zustand';

export const useGameStore = create((set) => ({
    room: null,
    player: null, // { sid, name, team_id, avatar, role }
    gameState: null,

    setRoom: (roomId) => set({ room: roomId }),
    setPlayer: (playerData) => set({ player: playerData }),
    setGameState: (state) => set({ gameState: state }),

    // Actions
    joinTeam: (teamId) => set((state) => ({ player: { ...state.player, team_id: teamId } })),
}));
