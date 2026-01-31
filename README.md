# 🕹️ ArenaLogic - Multiplayer Logic Gates Game

A real-time competitive multiplayer game where teams collaborate to solve logic gate challenges. Features **full voice accessibility** for visually impaired players using AI-powered narration and voice commands.

## ✨ Features

### 🎮 Core Gameplay
- **Real-time Multiplayer**: Socket.IO powered synchronization
- **Team-based Competition**: Up to 2 teams (Alpha/Beta) with up to 5 players each
- **Logic Gates**: AND, OR, XOR, XNOR, NAND, NOR challenges
- **Multiple Game Modes**:
  - **Competitive**: Single gate for all teams
  - **Asymmetric**: Each team gets different gates
  - **Campaign**: Progressive gate sequences
- **Operator Controls**: HackerDashboard for game configuration and player management

### 🔊 Accessibility (NEW!)
**Complete voice control system for visually impaired players:**

- **🎤 Voice Commands**: Join games, vote, sabotage rivals - all by voice
- **🔊 Auto-Narration**: Automatic updates on:
  - Round starts (gate type, your card, teammates' cards)
  - NOT gates applied (sabotage alerts)
  - Game state changes
- **🤖 AI Agent**: LangGraph-powered assistant with conversation memory
- **🎛️ Operator Control**: Enable/disable accessibility per player (🔊/🔇)
- **🌐 Multilingual**: Spanish voice support (Edge-TTS)
- **⚙️ Local STT**: Whisper model fallback for privacy

### 🛠️ Technical Stack

**Backend:**
- Python 3.12
- FastAPI + Socket.IO (real-time)
- OpenAI API (GPT-4o-mini)
- LangGraph (AI agent framework)
- Whisper (local STT)
- Edge-TTS (text-to-speech)

**Frontend:**
- React + Vite
- Socket.IO client
- Zustand (state management)
- Bootstrap 5 + Framer Motion
- MediaRecorder API (voice recording)

## 📖 Documentation

See **[MANUAL.md](./MANUAL.md)** for complete technical documentation including:
- WebSocket architecture
- Voice accessibility system
- AI agent implementation
- Game mechanics

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- OpenAI API key

### Installation

1. **Clone repository**
```bash
git clone https://github.com/yourusername/ArenaLogic.git
cd ArenaLogic
```

2. **Backend setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Configure environment**
```bash
# backend/.env
OPENAI_API_KEY=your_key_here
```

4. **Frontend setup**
```bash
cd frontend
npm install
```

### Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

**Terminal 3 - External Access (Optional):**
```bash
ssh -R 80:localhost:5173 serveo.net
# Provides public URL for external testing
```

## 🎮 How to Play

### As Player
1. Open browser → `http://localhost:5173`
2. Enter name and avatar
3. Join room `demo-room`
4. **Optional**: Enable HACKER_MODE (👁️) for voice control
5. Wait for operator to start round
6. Vote on gate output (0 or 1)
7. Sabotage rivals with NOT gates (costs points)

### As Operator
1. Join as operator
2. Configure game mode, gates, timers
3. Click "Initiate Sequence" to start round
4. **Enable accessibility** (🔊) for visually impaired players
5. Monitor teams and manage sabotage

### Voice Commands (Accessibility Mode)
- **Register**: "Mi nombre es Fernando" → "Confirmar"
- **Vote**: "Voto uno" / "Mi voto es cero"
- **Sabotage**: "Sabotea a Alex"
- **Status**: "¿Qué puerta tengo?" / "¿Cuál es mi carta?"

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Frontend                         │
│  React + Socket.IO Client + AccessibilityControl    │
└──────────────┬──────────────────────────────────────┘
               │ WebSocket (Socket.IO)
               │ Voice Data (Audio Blobs)
┌──────────────┴──────────────────────────────────────┐
│                     Backend                          │
│  ┌─────────────────────────────────────────────┐   │
│  │  FastAPI + Socket.IO Server                 │   │
│  │  • Game state management                    │   │
│  │  • Room broadcasting                        │   │
│  │  • Player synchronization                   │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │  AccessibilityManager                       │   │
│  │  • STT (Whisper/OpenAI)                     │   │
│  │  • TTS (Edge-TTS/OpenAI)                    │   │
│  │  • LangGraph AI Agent (GPT-4o-mini)         │   │
│  │  • Per-user conversation memory             │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## � Project Structure

```
ArenaLogic/
├── backend/
│   ├── main.py              # FastAPI + Socket.IO server
│   ├── game_manager.py      # Game logic & state
│   ├── accessibility.py     # Voice AI system
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GameArena.jsx          # Player view
│   │   │   ├── HackerDashboard.jsx    # Operator panel
│   │   │   └── AccessibilityControl.jsx # Voice UI
│   │   ├── store/
│   │   │   └── gameStore.js           # Zustand state
│   │   └── context/
│   │       └── SocketContext.jsx      # Socket.IO provider
│   └── package.json
├── MANUAL.md            # Technical documentation
└── README.md
```

## 🔧 Configuration

### Game Settings (Operator)
- **Max Players**: 1-5 per team
- **Round Duration**: 5-60 seconds
- **NOT Lockout**: 0-30s before end (prevents last-second sabotage)
- **Target Gate**: Select logic gate challenge
- **Logic Mode**: 
  - `predict`: Vote on final output (0 or 1)
  - `open`: Force output to 1

### Accessibility Settings
- **Per-Player Control**: Operator enables voice narration individually
- **Auto-Narration**: Triggered on game events (configurable)
- **Voice Model**: Whisper (local) or OpenAI API
- **TTS Voice**: Edge-TTS Spanish (configurable)

## 🎯 Scoring System

- **Base Score**: 10 points per correct gate
- **Speed Bonus**: +5 for solving in first 50% of time
- **Sabotage Penalty**: -1 point to apply NOT gate to rival
- **Sabotage Survival**: +0.5 if you were sabotaged but still solved

## 🌐 External Access

Use Serveo for external testing:
```bash
ssh -R 80:localhost:5173 serveo.net
```

**Vite Configuration** (`vite.config.js`):
```javascript
export default defineConfig({
  server: {
    host: '0.0.0.0',  // Allow external connections
    port: 5173
  }
})
```

## 🤝 Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch
3. Test thoroughly (especially accessibility features)
4. Submit pull request

## 📄 License

MIT License - See LICENSE file

## 🙏 Acknowledgments

- OpenAI for GPT-4o-mini and Whisper
- LangGraph for agent framework
- Socket.IO for real-time sync
- Edge-TTS for accessible voice synthesis

---

**Developed for educational purposes and accessibility innovation.**
