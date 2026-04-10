import os
import json
import yaml
import asyncio
import base64
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Third-party imports
from openai import AsyncOpenAI
import edge_tts
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

load_dotenv()

class AssistantManager:
    def __init__(self, sio):
        self.sio = sio
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        self.characters = self.load_characters()
        self.memory = MemorySaver()
        
        # We'll create agents on demand or cache them per character
        self.agents = {}
        
        if not self.api_key:
            print("WARNING: No OpenAI API Key found. AI Assistant features disabled.")

    def load_characters(self):
        """Loads characters from YAML and MD files"""
        try:
            with open("characters.yaml", "r", encoding="utf-8") as f:
                config = yaml.safe_load(f)
            
            characters = config.get("characters", {})
            for key, char in characters.items():
                # Load context from file if specified
                if "file" in char:
                    file_path = char["file"]
                    try:
                        with open(file_path, "r", encoding="utf-8") as md_f:
                            char["context"] = md_f.read()
                    except Exception as e:
                        print(f"[ERROR] Could not load character file {file_path}: {e}")
                        char["context"] = char.get("description", "Eres un asistente amable.")
                else:
                    char["context"] = char.get("description", "Eres un asistente amable.")
            
            return characters
        except Exception as e:
            print(f"[ERROR] Failed to load characters.yaml: {e}")
            return {}

    def get_agent(self, character_key: str):
        """Creates or retrieves a LangGraph agent for a specific character"""
        if not self.client: return None
        
        if character_key in self.agents:
            return self.agents[character_key]
        
        char_config = self.characters.get(character_key)
        if not char_config:
            character_key = "superhero" # Fallback
            char_config = self.characters.get(character_key)

        system_prompt = char_config["context"]
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7, api_key=self.api_key)
        
        # No tools needed for this assistant as per request (just chat)
        # but create_react_agent expects tools. We can pass an empty list.
        agent = create_react_agent(
            llm, 
            tools=[], 
            prompt=system_prompt,
            checkpointer=self.memory
        )
        
        self.agents[character_key] = agent
        return agent

    async def stt(self, audio_bytes: bytes) -> str:
        """Converts audio to text using OpenAI Whisper."""
        if not self.client: return ""
        
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp:
            temp.write(audio_bytes)
            temp_path = temp.name
            
        try:
            with open(temp_path, "rb") as audio_file:
                transcript = await self.client.audio.transcriptions.create(
                    model="whisper-1", 
                    file=audio_file,
                    language="es"
                )
            return transcript.text.strip()
        except Exception as e:
            print(f"STT Error: {e}")
            return ""
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    async def tts(self, text: str, character_key: str) -> bytes:
        """Converts text to audio using Edge-TTS with character-specific voice."""
        char_config = self.characters.get(character_key, {})
        voice = char_config.get("voice", "es-ES-AlvaroNeural")
        
        communicate = edge_tts.Communicate(text, voice)
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        return audio_data

    async def process_chat(self, sid: str, character_key: str, audio_bytes: Optional[bytes] = None, text_input: Optional[str] = None):
        """Processes a chat message (audio or text) and returns a response."""
        user_text = text_input
        if audio_bytes:
            user_text = await self.stt(audio_bytes)
        
        if not user_text:
            return None
            
        agent = self.get_agent(character_key)
        if not agent:
            return {"text": "Error: IA no disponible", "audio": None}

        try:
            # Thread ID unique per user AND character to maintain separate histories if needed
            # or just per user to have a multi-character friend who remembers you.
            # Let's do per user-character to be safe.
            thread_id = f"{sid}_{character_key}"
            
            inputs = {"messages": [HumanMessage(content=user_text)]}
            config = {"configurable": {"thread_id": thread_id}}
            
            result = await agent.ainvoke(inputs, config=config)
            
            response_text = result["messages"][-1].content
            
            # Generate Audio
            audio_out = await self.tts(response_text, character_key)
            audio_b64 = base64.b64encode(audio_out).decode('utf-8')
            
            return {
                "text": response_text,
                "audio": audio_b64,
                "user_text": user_text,
                "character": character_key
            }
        except Exception as e:
            print(f"[ASSISTANT ERROR] {e}")
            return {"text": "Hubo un error en mi sistema de comunicación.", "audio": None}
