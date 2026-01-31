import os
import json
import asyncio
import tempfile
import base64
import time
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Third-party imports
from openai import AsyncOpenAI
import edge_tts
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from langchain_core.callbacks import BaseCallbackHandler
from langgraph.checkpoint.memory import MemorySaver

# Local imports
from game_manager import GameManager

load_dotenv()

class ActionCaptureCallback(BaseCallbackHandler):
    def __init__(self):
        self.actions = []
    
    def on_tool_end(self, output: str, **kwargs: Any) -> Any:
        # Check if the tool output is our JSON action
        try:
            # Handle both string and ToolMessage object
            if hasattr(output, 'content'):
                output_str = output.content
            else:
                output_str = str(output)
            
            print(f"[CALLBACK DEBUG] on_tool_end called with output: {output_str[:200] if len(output_str) > 200 else output_str}")
            
            data = json.loads(output_str)
            if isinstance(data, dict) and "action" in data:
                print(f"[CALLBACK DEBUG] Captured action: {data}")
                self.actions.append(data)
        except Exception as e:
            print(f"[CALLBACK DEBUG] Failed to parse as JSON: {e}")
            pass

class AccessibilityManager:
    def __init__(self, game_manager: GameManager, sio):
        self.game_manager = game_manager
        self.sio = sio  # Socket.IO instance for broadcasting events
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        
        # Tools definitions
        @tool
        def vote(sid: str, value: int):
            """Submit a vote for the current game round. 
            
            Args:
                sid: Session ID (automatically provided)
                value: The vote value, must be either 0 or 1
                
            Use this when user says things like:
            - "vote 0" / "vote 1"
            - "I choose zero" / "I choose one"  
            - "my answer is 0" / "my answer is 1"
            """
            try:
                room = self.game_manager.set_input(sid, value)
                if room:
                    # Note: broadcast happens in main.py via voice_input handler
                    return f"Voted {value} successfully."
                return "Failed to vote. Are you in a game?"
            except Exception as e:
                print(f"[ERROR] vote failed: {e}")
                return f"Error voting: {str(e)}"

        @tool
        def get_game_state(sid: str) -> str:
            """Get current game status including round number, score, gate type, and player's card.
            
            Use this when user asks:
            - "What's happening?" / "What's the status?"
            - "What's my score?"
            - "What gate is it?" / "What's the current gate?"
            - "What's my card?"
            """
            try:
                for room in self.game_manager.rooms.values():
                    for team in room.teams.values():
                        if sid in team.players:
                            return json.dumps({
                                "round": room.round_number,
                                "gate": team.current_gate,
                                "score": team.score,
                                "my_card": team.players[sid].card_value,
                                "time_left": max(0, room.current_round_end_time - asyncio.get_event_loop().time()) if room.state == 'PLAYING' else 0,
                                "state": room.state
                            })
                return "You are not in a game room yet. Join a game first."
            except Exception as e:
                print(f"[ERROR] get_game_state failed: {e}")
                return f"Error getting game state: {str(e)}"

        # Avatar name to emoji mapping
        AVATAR_MAP = {
            'león': '🦁', 'leon': '🦁',
            'tigre': '🐯',
            'oso': '🐻',
            'dragón': '🐲', 'dragon': '🐲',
            'unicornio': '🦄',
            'robot': '🤖',
            'alien': '👽',
            'fantasma': '👻',
            'rayo': '⚡', 'relámpago': '⚡', 'relampago': '⚡',
            'fuego': '🔥',
            'agua': '💧', 'gota': '💧',
            'viento': '🌪️', 'tornado': '🌪️'
        }
        
        @tool
        def client_fill_form(sid: str, name: str, avatar: str):
            """
            Fills the registration form on the user's screen BUT does not submit it.
            Avatar can be an emoji or a name (e.g., 'rayo', 'gota', 'león').
            """
            # Translate avatar name to emoji if needed
            avatar_emoji = AVATAR_MAP.get(avatar.lower(), avatar)
            if avatar_emoji not in ['🦁', '🐯', '🐻', '🐲', '🦄', '🤖', '👽', '👻', '⚡', '🔥', '💧', '🌪️']:
                avatar_emoji = '🦁'  # Default to lion if invalid
            
            print(f"[FILL_FORM] Name={name}, Avatar={avatar} → {avatar_emoji}")
            return json.dumps({"action": "fill_form", "name": name, "avatar": avatar_emoji})

        @tool
        async def confirm_join_game(sid: str, name: str, avatar: str):
            """
            Actually joins the game. Call this ONLY after user confirmation.
            """
            room_id = "demo-room" 
            success, msg = self.game_manager.join_room(sid, room_id, name, "player", None, avatar)
            if success:
                # CRITICAL: Join the Socket.IO room so the user receives broadcasts
                await self.sio.enter_room(sid, room_id)
                print(f"[AGENT DEBUG] User {sid} joined Socket.IO room {room_id}")
                
                # Broadcast updated game state to all clients in the room (same logic as broadcast_room_state)
                room = self.game_manager.rooms.get(room_id)
                if room:
                    state = {
                        'id': room.id,
                        'state': room.state,
                        'timer': max(0, room.current_round_end_time - time.time()) if room.state == 'PLAYING' else 0,
                        'difficulty': room.difficulty,
                        'game_mode': room.game_mode,
                        'round_number': room.round_number,
                        'custom_card_0': room.custom_card_0,
                        'custom_card_1': room.custom_card_1,
                        'logic_mode': room.logic_mode,
                        'max_players_per_team': room.max_players_per_team,
                        'not_lockout_time': room.not_lockout_time,
                        'target_gate': room.target_gate,
                        'target_gates': room.target_gates,
                        'teams': {
                            tid: {
                                'id': t.id,
                                'name': t.name,
                                'score': t.score,
                                'solved_current_round': t.solved_current_round,
                                'last_round_result': t.last_round_result,
                                'not_gates_used': t.not_gates_used,
                                'was_sabotaged': t.was_sabotaged,
                                'round_stats': {
                                    'base': t.last_round_base,
                                    'bonus': t.last_round_bonus,
                                    'penalty': t.last_round_penalty
                                },
                                'current_gate': t.current_gate,
                                'chat_enabled': t.chat_enabled,
                                'players': {
                                    pid: {
                                        'sid': pid,
                                        'name': p.name,
                                        'card_value': p.card_value,
                                        'vote_value': p.vote_value,
                                        'has_not_gate': p.has_not_gate,
                                        'avatar': p.avatar
                                    } for pid, p in t.players.items()
                                }
                            } for tid, t in room.teams.items()
                        },
                        'operator': room.operator_sid
                    }
                    print(f"[AGENT DEBUG] Broadcasting game_state to room {room_id} with {len(room.teams)} teams")
                    await self.sio.emit('game_state', state, room=room_id)
                    print(f"[AGENT DEBUG] game_state emitted successfully")
                return f"Joined room {room_id} as {name}. Navigating to game..."
            return f"Failed to join: {msg}"
        
        @tool
        def apply_not_gate(sid: str, target_player_name: str):
            """Apply a NOT gate to sabotage a rival player's card.
            
            Args:
                sid: Your session ID (automatic)
                target_player_name: Name of the rival player to sabotage
                
            Use when user says:
            - "sabotage player X" / "apply NOT to X"
            - "invert X's card" / "put NOT on X"
            
            Requirements: Your team needs score > 0 and time > 5s
            """
            try:
                # Find target player SID by name in rival teams
                my_team_id = None
                target_sid = None
                
                for room in self.game_manager.rooms.values():
                    for team in room.teams.values():
                        if sid in team.players:
                            my_team_id = team.id
                        # Look for target in OTHER teams
                        for pid, player in team.players.items():
                            if player.name.lower() == target_player_name.lower():
                                if my_team_id and team.id != my_team_id:
                                    target_sid = pid
                                    break
                
                if not target_sid:
                    return f"Player '{target_player_name}' not found in rival teams."
                
                # Apply NOT gate via game manager
                room = self.game_manager.toggle_not_gate(sid, target_sid, "demo-room")
                if room:
                    return f"Successfully sabotaged {target_player_name}'s card with NOT gate!"
                return "Failed to apply NOT gate. Check score (>0) and time remaining (>5s)."
            except Exception as e:
                print(f"[ERROR] apply_not_gate failed: {e}")
                return f"Error applying NOT gate: {str(e)}"

        self.tools = [vote, get_game_state, client_fill_form, confirm_join_game, apply_not_gate]
        
        self.system_prompt = """You are the 'Hacker Node', an AI assistant for a Logic Gates game.
Your user is blind or visually impaired. You act as their eyes and hands.

**IMPORTANT**: You have access to tools. USE THEM when the user requests actions.

AVAILABLE TOOLS:
1. `vote(sid, value)` - Submit a vote (0 or 1) for the current game round
   - Use when: User says "vote 0", "vote 1", "I choose zero", "my answer is one", etc.
   
2. `get_game_state(sid)` - Read current game information
   - Use when: User asks "what's happening?", "what's my score?", "what gate is it?", etc.
   
3. `client_fill_form(sid, name, avatar)` - Fill registration form (DOES NOT submit)
   - Use when: User wants to set their name/avatar
   - Example: "My name is John" → call client_fill_form(sid, "John", "🦁")
   
4. `confirm_join_game(sid, name, avatar)` - Actually join the game
   - Use ONLY after user explicitly confirms (says "confirm", "yes", "join", "okay")
   - **Always joins as PLAYER role** (not operator)

5. `apply_not_gate(sid, target_player_name)` - Sabotage a rival player
   - Use when: User wants to sabotage/invert a rival's card
   - Example: "sabotage player Alex" → call apply_not_gate(sid, "Alex")
   - Requires: score > 0 and remaining time > 5 seconds

WORKFLOW for registration:
1. User: "My name is Alex"
2. You: Call `client_fill_form(sid, "Alex", "🦁")`
3. You: Tell user "I've set your name to Alex. Say 'confirm' to join the game."
4. User: "confirm"
5. You: Call `confirm_join_game(sid, "Alex", "🦁")`

Be concise and professional. Always USE THE TOOLS when appropriate, don't just describe what you would do."""
        
        if self.client:
            self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=self.api_key)
            # Create Memory Checkpointer for conversation history
            self.memory = MemorySaver()
            # Create LangGraph Agent with memory
            self.agent_graph = create_react_agent(
                self.llm, 
                self.tools, 
                prompt=self.system_prompt,
                checkpointer=self.memory
            )
        else:
            print("WARNING: No OpenAI API Key found. Accessibility features disabled.")

    async def stt(self, audio_bytes: bytes) -> str:
        """Converts audio to text using OpenAI Whisper with Local Fallback."""
        if not self.client: return "Error: No API Key"
        
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp:
            temp.write(audio_bytes)
            temp_path = temp.name
            
        try:
            # Try API First
            with open(temp_path, "rb") as audio_file:
                transcript = await self.client.audio.transcriptions.create(
                    model="gpt-4o-mini-transcribe", 
                    file=audio_file,
                    language="es"
                )
            return transcript.text
        except Exception as e:
            print(f"STT API Error: {e}. Falling back to Local Whisper...")
            try:
                # Fallback to Local Whisper
                import whisper
                # Lazy load model (using 'base' as it's fast)
                if not hasattr(self, 'local_whisper_model'):
                    print("Loading local whisper model 'base'...")
                    self.local_whisper_model = whisper.load_model("base")
                
                result = self.local_whisper_model.transcribe(temp_path, language="es")
                return result["text"]
            except Exception as local_e:
                print(f"Local STT Error: {local_e}")
                return ""
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    async def tts(self, text: str) -> bytes:
        """Converts text to audio using OpenAI (High Quality) or Edge-TTS (Fallback)."""
        if self.client:
            try:
                response = await self.client.audio.speech.create(
                    model="tts-1",
                    voice="nova",
                    input=text
                )
                return response.content
            except Exception as e:
                print(f"OpenAI TTS Failed, falling back to Edge: {e}")
        
        communicate = edge_tts.Communicate(text, "es-ES-AlvaroNeural")
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        return audio_data

    async def process_command(self, sid: str, audio_bytes: Optional[bytes] = None, text_input: Optional[str] = None, context: Dict = None):
        """
        Main pipeline: Audio -> Text -> Agent -> Action -> Response -> Audio
        """
        user_text = text_input
        if audio_bytes:
            user_text = await self.stt(audio_bytes)
        
        if not user_text:
            return None
        
        print(f"User ({sid}) said: {user_text} | Context: {context}")
        
        context_msg = f"Current Client Context: {json.dumps(context)}" if context else ""
        full_input = f"{user_text}\n{context_msg}\n(SID: {sid})"
        
        action_callback = ActionCaptureCallback()
        response_text = "Error processing request."
        
        try:
            # Invoke LangGraph with memory (thread per user SID)
            inputs = {"messages": [HumanMessage(content=full_input)]}
            config = {
                "configurable": {"thread_id": sid},  # Separate conversation thread per user
                "callbacks": [action_callback]
            }
            result = await self.agent_graph.ainvoke(inputs, config=config)
            
            # Extract final response from last message
            messages = result["messages"]
            if messages:
                last_msg = messages[-1]
                response_text = last_msg.content
            
            # Debug: Log captured actions
            if action_callback.actions:
                print(f"[DEBUG] Captured {len(action_callback.actions)} client actions: {action_callback.actions}")
            else:
                print(f"[DEBUG] No client actions captured")
                
        except Exception as e:
            print(f"Agent Error: {e}")
            response_text = "Lo siento, hubo un error procesando tu solicitud."

        # Generate Audio Response
        audio_bytes = await self.tts(response_text)
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        print(f"[PROCESS_COMMAND] Returning {len(action_callback.actions)} client_actions")
        return {
            "text": response_text,
            "audio": audio_b64,
            "user_text": user_text,
            "client_actions": action_callback.actions
        }
