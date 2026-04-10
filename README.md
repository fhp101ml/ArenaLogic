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
  - Round ends (result, score, rival team status)
  - NOT gates applied (sabotage alerts)
  - Game state changes
- **🔔 Audio Alerts**:
  - Countdown beeps in last 5 seconds of each round
  - Success fanfare on round win
  - Failure sound on round loss
- **🤖 AI Agent**: LangGraph-powered assistant with conversation memory
  - Never suggests which vote to choose (player decides)
  - Avatar name recognition (rayo→⚡, gota→💧, león→🦁)
  - Voice-guided survey completion
  - **Voice-controlled instructions**: "ver instrucciones", "leer las reglas", "cerrar instrucciones"
- **🎛️ Operator Control**: Enable/disable accessibility per player (🔊/🔇)
- **🌐 Multilingual**: Spanish voice support (Edge-TTS)
- **⚙️ Local STT**: Whisper model fallback for privacy

### 📋 Satisfaction Survey
- **Star Rating System**: 1-10 scale for 4 categories
- **Categories**: Gameplay, Accessibility, Fun, Recommendation
- **Voice-Guided Mode**: AI assistant guides through survey step by step
- **Real-time Updates**: Form updates as you speak
- **CSV Storage**: Responses saved to `survey_responses.csv`

### 🎮 Operator Features
- **Reset Scores**: Clear all team scores
- **Reset Game**: Full restart (round 0, scores 0, state reset)
- **Real-time Timer**: Live countdown broadcast every second

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

**External Access (Optional):**
To play over the internet, you need to expose both the backend and frontend. Because free ngrok accounts only permit one tunnel, we recommend a **hybrid approach**:
```bash
# Terminal 3: Expose API (Backend) via ngrok for stable WebSockets
ngrok http 8000

# Terminal 4: Expose Frontend via Serveo 
ssh -R 80:localhost:5173 serveo.net
```
*Note: Ensure you update the `VITE_BACKEND_URL` in `frontend/.env` to the specific API domain provided by ngrok.*

## 🎮 How to Play

### As Player
1. Open browser → `http://localhost:5173`
2. Enter name and avatar
3. Join room `demo-room`
4. **Optional**: Enable HACKER_MODE (👁️) for voice control
5. Wait for operator to start round
6. Vote on gate output (0 or 1)
7. Sabotage rivals with NOT gates (costs points)
   - **New Mechanic**: In **Force Open** mode, you can remove NOT gates from yourself or teammates.
   - **Vote Reset**: When a NOT gate is applied or removed, the team's votes are wiped, forcing a re-vote.

### As Operator
1. Join as operator
2. Configure game mode, gates, timers
3. Click "Initiate Sequence" to start round
4. **Enable accessibility** (🔊) for visually impaired players
5. Monitor teams and manage sabotage

### Voice Commands (Accessibility Mode)
- **Register**: "Mi nombre es Fernando" → "Confirmar"
- **Vote**: "Voto uno" / "Mi voto es cero"
- **Sabotage**: "Sabotea a Alex" (Rival) / "Quítame el NOT" (Force Open Self-Defense)
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

To make the game accessible over the internet, you need to expose both the backend API and the frontend. 

*⚠️ Note: Free ngrok accounts are limited to exactly **one** tunnel. To solve this, you can use two separate ngrok accounts configured in different terminals.*

### Deployment Approach: Dual ngrok accounts (Recommended/Used)

This approach uses two ngrok processes authenticated with two different ngrok accounts to expose both services reliably.

**1. Expose the Backend API (Account 1)**
In your backend terminal, authenticate your first ngrok account and start the tunnel:
```bash
ngrok config add-authtoken 3ByoOnFXh3pAjHEaoDjzPaAmomJ_7JrDHWafDdD2uu37L1GrL
ngrok http 8000
```
*Copy the Forwarding URL generated by ngrok (e.g., `https://<api-url>.ngrok-free.app`).*

**2. Configure Frontend Environment**
Edit the `frontend/.env` file to point to the new ngrok backend URL:
```env
VITE_BACKEND_URL=https://<api-url>.ngrok-free.app
```

**3. Expose the Frontend (Account 2)**
Restart `npm run dev` in the frontend folder.
In a new terminal, authenticate your second ngrok account and start the Frontend tunnel:
```bash
ngrok config add-authtoken 2QBokXQJCbI2JJSshqDkTq3VeCw_XNCDtM54usJbseUjUUzF
ngrok http 5173
```
*Share this second ngrok link with the players so they can access the game.*

### Alternative: Using strictly Serveo (For both)

**1. Expose the Backend API**
```bash
ssh -R puertaslogicas-api:80:localhost:8000 serveo.net
```

**2. Configure Frontend Environment**
Create or edit the `frontend/.env` file:
```env
VITE_BACKEND_URL=https://puertaslogicas-api.serveousercontent.com
```

**3. Expose the Frontend**
```bash
ssh -R 80:localhost:5173 serveo.net
```

### Configure Vite (Required for both)

To bypass dynamic domain host checks from the tunneling services, ensure `vite.config.js` has `allowedHosts: true`:
```javascript
export default defineConfig({
  server: {
    allowedHosts: true, // Allow all hosts for tunneling compatibility
    watch: { usePolling: true }
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
