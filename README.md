# ⚡ LOGIC ARENA

**Logic Arena** is a real-time multiplayer competitive game designed to test and sharpen logical reasoning through Boolean gate puzzles. Players work in teams to solve complex logic sequences while an operator (Hacker) manages the system and introduces hazards.

## 🎮 Game Concept

In Logic Arena, players are "Operatives" assigned to teams (Alpha/Beta). Each round, the server deals logical "cards" (0 or 1) to players. The team's collective goal depends on the active game mode and objective protocol:

- **PREDICT OUTPUT**: Guess what the logic gate will output based on the current inputs.
- **FORCE OVERRIDE**: Manipulate the inputs (using NOT gates) so the gate outputs a `1`.

### Logical Gates Supported
- `AND`, `OR`, `XOR`, `XNOR`, `NAND`, `NOR`.

---

## 🛠️ Technical Architecture

The project is built with a modern full-stack web architecture optimized for real-time interaction.

### Backend (Python / FastAPI)
- **Framework**: `FastAPI` (ASGI) for the REST API and server orchestration.
- **Real-time Engine**: `python-socketio` for asynchronous WebSocket communication.
- **Game Engine**: A custom `GameManager` class that handles:
    - Room and team management.
    - Real-time logical evaluations.
    - Automatic round transitions and timers.
    - Complex hazard logic (NOT gate sabotages).

### Frontend (React / Vite)
- **Framework**: `React 19` with `Vite` for ultra-fast development and bundling.
- **UI Library**: `React-Bootstrap` + `Vanilla CSS` for a premium "Cyber/High-Tech" aesthetic.
- **State Management**: `Zustand` for lightweight, reactive game state handling.
- **Animations**: `Framer Motion` for smooth transitions and HUD effects.
- **Client Networking**: `socket.io-client` for persistent dual-way communication.

---

## 📡 WebSocket Implementation

The game relies heavily on WebSockets for sub-100ms latency. The communication protocol is defined as follows:

### Client -> Server Events
- `join_game`: Player identification and team assignment.
- `start_round`: (Operator only) Initiates the logic sequence.
- `player_input`: Casting a vote or confirming a setup.
- `apply_not`: Triggering a NOT gate on a teammate or rival.
- `set_game_mode` / `set_target_gate`: Configuration of the round logic.
- `reset_scores`: (Operator only) Wiping team progress.

### Server -> Client Events
- `game_state`: Broadcasts the full room status to all connected clients (teams, inputs, scores, timer).
- `round_result`: Notification of success or failure for a specific unit.
- `error`: System alerts (e.g., "Cannot apply NOT gate yet").

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Setup

1. **Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python main.py
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Access the terminal at `http://localhost:5173`.

---

## 🌐 Remote Access & Tunneling (Serveo)

To play with users outside your local network, you can use **Serveo** to create a secure tunnel.

### 1. Vite Configuration
Vite requires explicit authorization for external hosts. Ensure `frontend/vite.config.js` includes the `allowedHosts` setting:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'your-custom-subdomain.serveousercontent.com'
    ]
  }
})
```

### 2. Launch Tunnel
Once the dev server is running, forward the port using SSH:
```bash
ssh -R your-custom-subdomain:80:localhost:5173 serveo.net
```

---

*Developed by Antigravity*
