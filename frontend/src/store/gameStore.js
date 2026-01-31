import { create } from 'zustand';

export const useGameStore = create((set) => ({
    room: null,
    player: null, // { sid, name, team_id, avatar, role }
    gameState: null,

    // Draft Profile for Lobby (Shared between UI and Agent)
    draftProfile: { name: '', avatar: '🦁', role: 'player' },

    setRoom: (roomId) => set({ room: roomId }),
    setPlayer: (playerData) => set({ player: playerData }),
    setGameState: (state) => set({ gameState: state }),
    setDraftProfile: (updates) => set((state) => ({ draftProfile: { ...state.draftProfile, ...updates } })),

    // Actions
    joinTeam: (teamId) => set((state) => ({ player: { ...state.player, team_id: teamId } })),
}));
