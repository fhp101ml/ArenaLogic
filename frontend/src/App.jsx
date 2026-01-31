import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider, useSocket } from './context/SocketContext';
import { useGameStore } from './store/gameStore';
import Lobby from './components/Lobby';
import GameArena from './components/GameArena';
import InstructionsPage from './pages/InstructionsPage';

const GameContent = () => {
  const { socket } = useSocket();
  const { gameState, setGameState, setPlayer } = useGameStore();
  const [inGame, setInGame] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.onAny((event, ...args) => {
      console.log(`[SOCKET DEBUG] Incoming event: ${event}`, args);
    });

    socket.on('game_state', (state) => {
      console.log('Received Game State:', state);
      setGameState(state);

      // Auto-detect player info from game_state (for voice join)
      const mySid = socket.id;
      let myPlayerInfo = null;

      // Check if I'm in any team
      for (const team of Object.values(state.teams || {})) {
        const player = team.players?.[mySid];
        if (player) {
          myPlayerInfo = {
            name: player.name,
            avatar: player.avatar,
            role: 'player',
            roomId: state.id
          };
          break;
        }
      }

      // Check if I'm the operator
      if (state.operator === mySid) {
        myPlayerInfo = myPlayerInfo || {};
        myPlayerInfo.role = 'operator';
        myPlayerInfo.roomId = state.id;
      }

      if (myPlayerInfo) {
        console.log('[AUTO-DETECT] Setting player from game_state:', myPlayerInfo);
        setPlayer(myPlayerInfo);
      }

      setInGame(true);
    });

    // Handle agent actions globally (for Lobby form filling)
    socket.on('agent_action_client', (action) => {
      console.log("[APP] Agent Action:", action);
      if (action.action === 'fill_form') {
        useGameStore.getState().setDraftProfile({
          name: action.name,
          avatar: action.avatar
        });
      }
    });

    return () => {
      socket.off('game_state');
      socket.off('agent_action_client');
    };
  }, [socket, setGameState, setPlayer]);

  return inGame ? <GameArena /> : <Lobby />;
};

import AccessibilityControl from './components/AccessibilityControl';

function App() {
  return (
    <Router>
      <SocketProvider>
        <AccessibilityControl />
        <Routes>
          <Route path="/" element={<GameContent />} />
          <Route path="/game" element={<GameContent />} />
          <Route path="/instructions" element={<InstructionsPage />} />
        </Routes>
      </SocketProvider>
    </Router>
  );
}

export default App;
