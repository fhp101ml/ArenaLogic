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
      setInGame(true);
    });

    return () => {
      socket.off('game_state');
    };
  }, [socket, setGameState]);

  return inGame ? <GameArena /> : <Lobby />;
};

function App() {
  return (
    <Router>
      <SocketProvider>
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
