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
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

load_dotenv()

class AssistantManager:
    def __init__(self, sio):
        self.sio = sio
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        self.characters = self.load_characters()
        self.memory = MemorySaver()
        self.moderator_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=self.api_key) if self.api_key else None
        
        # We'll create agents on demand or cache them per character
        self.agents = {}
        
        if not self.api_key:
            print("WARNING: No OpenAI API Key found. AI Assistant features disabled.")

    def save_character(self, key: str, name: str, description: str, voice: str = "es-ES-AlvaroNeural"):
        """Saves a new character to characters.yaml and updates the local dict."""
        try:
            # Update local dict
            char_data = {
                "name": name,
                "description": description,
                "context": description,
                "voice": voice
            }
            self.characters[key] = char_data
            
            # Save to file
            base_path = os.path.dirname(os.path.abspath(__file__))
            yaml_path = os.path.join(base_path, "characters.yaml")
            
            config = {"characters": {}}
            if os.path.exists(yaml_path):
                with open(yaml_path, "r", encoding="utf-8") as f:
                    config = yaml.safe_load(f) or {"characters": {}}
            
            if "characters" not in config:
                config["characters"] = {}
                
            config["characters"][key] = {
                "name": name,
                "description": description,
                "voice": voice
            }
            
            with open(yaml_path, "w", encoding="utf-8") as f:
                yaml.dump(config, f, allow_unicode=True)
            
            print(f"[INFO] New character saved: {key}")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to save character: {e}")
            return False

    def load_characters(self):
        """Loads characters from characters.yaml and adds context from .md files."""
        base_path = os.path.dirname(os.path.abspath(__file__))
        yaml_path = os.path.join(base_path, "characters.yaml")
        
        if not os.path.exists(yaml_path):
            print(f"WARNING: characters.yaml not found at {yaml_path}")
            return {}

        with open(yaml_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
        
        characters = config.get('characters', {})
        
        # Load context from .md files
        for char_id, char_data in characters.items():
            context_file = os.path.join(base_path, "characters", f"{char_id}.md")
            
            if os.path.exists(context_file):
                with open(context_file, 'r', encoding='utf-8') as f:
                    char_data['context'] = f.read()
            else:
                char_data['context'] = char_data.get('description', '')
                
        return characters

    async def moderate(self, text: str, character_context: str, is_user_input: bool = True) -> Dict[str, Any]:
        """Checks if the text is appropriate for children and consistent with the character."""
        if not self.moderator_llm:
            return {"safe": True, "reason": ""}

        role_desc = "usuario" if is_user_input else "asistente"
        
        system_prompt = f"""
        Eres un experto en moderación de contenido infantil y consistencia de personajes.
        Tu tarea es revisar el mensaje de un {role_desc} en una aplicación educativa de puertas lógicas.
        
        CRITERIOS DE SEGURIDAD INFANTIL:
        - NO lenguaje ofensivo, violento o sexual.
        - NO temas de drogas, alcohol o juego.
        - NO acoso o discriminación.
        - El tono debe ser seguro y amigable.
        
        CRITERIO DE CONSISTENCIA (solo si no es entrada de usuario):
        - El mensaje debe ser coherente con la descripción del personaje: {character_context}
        
        Responde estrictamente en formato JSON:
        {{
            "safe": boolean,
            "reason": "explicación breve si no es seguro",
            "filtered_text": "texto modificado si es necesario o el original"
        }}
        """
        
        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Mensaje a revisar: {text}")
            ]
            response = await self.moderator_llm.ainvoke(messages)
            
            # Use JsonOutputParser for robustness
            parser = JsonOutputParser()
            result = parser.parse(response.content)
            return result
        except Exception as e:
            print(f"[MODERATION ERROR] {e}")
            return {"safe": True, "reason": "", "filtered_text": text}

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
            char_config = self.characters.get(character_key, {})
            char_context = char_config.get("context", "")

            # 1. Moderate Input
            moderation_in = await self.moderate(user_text, char_context, is_user_input=True)
            if not moderation_in.get("safe", True):
                response_text = "Lo siento, pero no puedo hablar sobre ese tema. Vamos a enfocarnos en algo divertido y apropiado para todos."
                audio_out = await self.tts(response_text, character_key)
                return {
                    "text": response_text,
                    "audio": base64.b64encode(audio_out).decode('utf-8'),
                    "user_text": user_text,
                    "character": character_key,
                    "moderated": True
                }

            # Thread ID unique per user AND character to maintain separate histories if needed
            thread_id = f"{sid}_{character_key}"
            
            inputs = {"messages": [HumanMessage(content=user_text)]}
            config = {"configurable": {"thread_id": thread_id}}
            
            result = await agent.ainvoke(inputs, config=config)
            
            response_text = result["messages"][-1].content
            
            # 2. Moderate Output
            moderation_out = await self.moderate(response_text, char_context, is_user_input=False)
            if not moderation_out.get("safe", True):
                response_text = "¡Uy! Me he despistado un poco. Como decía, ¡vamos a aprender sobre puertas lógicas!"
                # Optionally use the filtered text if provided
                if moderation_out.get("filtered_text"):
                    response_text = moderation_out["filtered_text"]

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
