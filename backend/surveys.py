"""
Survey Manager - Handles survey questions and responses
"""
from dataclasses import dataclass, field
from typing import Dict, List
from datetime import datetime
import csv
import os

@dataclass
class SurveyResponse:
    player_name: str
    ratings: Dict[str, int]  # question_id -> rating (1-10)
    timestamp: str

class SurveyManager:
    """Manages survey questions and collects responses"""
    
    # Predefined survey questions
    QUESTIONS = [
        {"id": "gameplay", "text": "¿Cómo calificarías la jugabilidad?"},
        {"id": "accessibility", "text": "¿Cómo calificarías la accesibilidad?"},
        {"id": "fun", "text": "¿Cuánto te has divertido?"},
        {"id": "recommend", "text": "¿Recomendarías este juego?"},
    ]
    
    def __init__(self, storage_file: str = "survey_responses.csv"):
        self.storage_file = storage_file
        self.responses: List[Dict] = []
        self._load_from_file()
    
    def get_questions(self) -> List[dict]:
        """Return list of survey questions"""
        return self.QUESTIONS
    
    def submit_response(self, player_name: str, ratings: Dict[str, int], notes: str = "") -> bool:
        """Save a survey response"""
        try:
            response = {
                "player_name": player_name,
                "timestamp": datetime.now().isoformat(),
                **{q["id"]: ratings.get(q["id"], 0) for q in self.QUESTIONS},
                "notes": notes
            }
            self.responses.append(response)
            self._save_to_file(response)
            print(f"[SURVEY] Response saved from {player_name}: {ratings}")
            return True
        except Exception as e:
            print(f"[SURVEY] Error saving response: {e}")
            return False
    
    def get_statistics(self) -> Dict:
        """Calculate average ratings per question"""
        if not self.responses:
            return {}
        
        stats = {}
        for question in self.QUESTIONS:
            qid = question["id"]
            values = [r.get(qid, 0) for r in self.responses if r.get(qid)]
            if values:
                stats[qid] = {
                    "average": round(sum(values) / len(values), 1),
                    "count": len(values)
                }
        return stats
    
    def _load_from_file(self):
        """Load responses from CSV file"""
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, 'r', encoding='utf-8', newline='') as f:
                    reader = csv.DictReader(f)
                    self.responses = list(reader)
                    # Convert rating values to integers
                    for r in self.responses:
                        for q in self.QUESTIONS:
                            if q["id"] in r:
                                r[q["id"]] = int(r[q["id"]])
                print(f"[SURVEY] Loaded {len(self.responses)} responses from CSV")
            except Exception as e:
                print(f"[SURVEY] Error loading file: {e}")
                self.responses = []
    
    def _save_to_file(self, response: Dict):
        """Append response to CSV file"""
        try:
            file_exists = os.path.exists(self.storage_file)
            fieldnames = ["player_name", "timestamp"] + [q["id"] for q in self.QUESTIONS] + ["notes"]
            
            with open(self.storage_file, 'a', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                if not file_exists:
                    writer.writeheader()
                writer.writerow(response)
        except Exception as e:
            print(f"[SURVEY] Error saving file: {e}")

# Singleton instance
survey_manager = SurveyManager()
