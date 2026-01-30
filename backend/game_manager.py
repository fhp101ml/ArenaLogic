import random
import asyncio
from typing import Dict, List, Optional
from dataclasses import dataclass, field
import time

# Gate Logic Functions
GATE_LOGIC = {
    'AND': lambda inputs: all(inputs),
    'OR': lambda inputs: any(inputs),
    'XOR': lambda inputs: sum(inputs) == 1,
    'XNOR': lambda inputs: len(set(inputs)) == 1,  # All same
    'NAND': lambda inputs: not all(inputs),
    'NOR': lambda inputs: not any(inputs)
}

# Scoring based on difficulty
GATE_SCORES = {
    'OR': 1,       # Easy (at least one 1)
    'AND': 2,      # Medium-Hard (all 1)
    'NAND': 2,     # Medium-Hard (at least one 0)
    'NOR': 2,      # Medium-Hard (no ones)
    'XOR': 3,      # Hard (exactly one 1)
    'XNOR': 3      # Hard (all same)
}

GAME_MODES = ['competitive', 'asymmetric', 'campaign']

@dataclass
class Player:
    sid: str
    name: str
    team_id: str
    avatar: str  # '0' or '1' character/symbol
    card_value: int = 0 # The "Card" (0 or 1) dealt by server
    vote_value: Optional[int] = None # The Player's Vote: 0 or 1
    has_not_gate: bool = False # If true, input is inverted

@dataclass
class Team:
    id: str
    name: str
    players: Dict[str, Player] = field(default_factory=dict)
    score: int = 0
    solved_current_round: bool = False
    last_round_result: str = None  # "success", "failed", or None
    not_gates_used: int = 0  # Count of NOT gates used in current round
    current_gate: str = 'AND'  # Current gate type for this team

@dataclass
class Room:
    id: str
    operator_sid: Optional[str] = None # The "Hacker"
    teams: Dict[str, Team] = field(default_factory=dict)
    state: str = "LOBBY" # LOBBY, PLAYING, FINISHED
    difficulty: int = 1
    current_round_end_time: float = 0
    round_duration: int = 10 # Seconds
    
    # Game Mode System
    game_mode: str = 'competitive'  # 'competitive', 'asymmetric', 'campaign'
    round_number: int = 0
    custom_card_0: Optional[str] = None  # base64 image data
    custom_card_1: Optional[str] = None  # base64 image data
    
    # Game Logic State
    target_gate: str = "AND"
    target_gates: List[str] = field(default_factory=lambda: ["AND"])
    logic_requirements: Dict = field(default_factory=dict)
    
    # Logic Objectives: 'predict' (Guess Output) or 'open' (Force Output 1)
    logic_mode: str = 'predict'
    logic_requirements: Dict[str, bool] = field(default_factory=dict) # Requirements per team maybe? 
    # Actually, for AND, the goal is always Output=1.
    # So for AND, Logic(A) AND Logic(B)... = 1.
    
class GameManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}

    def create_room(self, room_id: str) -> Room:
        if room_id not in self.rooms:
            self.rooms[room_id] = Room(id=room_id)
        return self.rooms[room_id]

    def join_room(self, sid: str, room_id: str, name: str, role: str, team_id: Optional[str] = None, avatar: str = '😀'):
        # Role: 'player' or 'operator'
        room = self.create_room(room_id)
        
        if role == 'operator':
            if room.operator_sid is None:
                room.operator_sid = sid
                return True
            return False # Already has operator
            
        if role == 'player' and team_id:
            if team_id not in room.teams:
                room.teams[team_id] = Team(id=team_id, name=f"Team {team_id}")
            
            # Max 3 players per team
            if len(room.teams[team_id].players) >= 3:
                return False
                
            player = Player(sid=sid, name=name, team_id=team_id, avatar=avatar) 
            room.teams[team_id].players[sid] = player
            return True
        return False

    def remove_player(self, sid: str):
        # Scan rooms to remove player
        for room in self.rooms.values():
            if room.operator_sid == sid:
                room.operator_sid = None
                return
            
            for team in room.teams.values():
                if sid in team.players:
                    del team.players[sid]
                    # If team empty, remove? Maybe.
                    return

    def set_input(self, sid: str, vote: int):
        """Set player vote and reset team's solved status to allow re-solving"""
        for room in self.rooms.values():
            for team in room.teams.values():
                if sid in team.players:
                    team.players[sid].vote_value = vote
                    # Reset solved status when input changes
                    team.solved_current_round = False
                    return room
        return None

    def toggle_not_gate(self, operator_sid: str, target_sid: str, room_id: str = None):
        """
        Toggle NOT gate on a player.
        Rules:
        - Only operator OR teams with >4 points can apply NOT
        - Can only apply to rival teams
        - Only when >5 seconds remaining
        """
        for room in self.rooms.values():
            if room_id and room.id != room_id:
                continue
                
            # Check time remaining
            if room.state == 'PLAYING':
                time_remaining = room.current_round_end_time - time.time()
                if time_remaining <= 5:
                    return None  # Too late to apply NOT
            
            # Find the team of the requester
            requester_team = None
            # Find requester team
            requester_team = None
            is_operator = (room.operator_sid == operator_sid)
            
            if not is_operator:
                for team in room.teams.values():
                    if operator_sid in team.players:
                        requester_team = team
                        break
            
            # Find target player and their team
            target_team = None
            for team in room.teams.values():
                if target_sid in team.players:
                    target_team = team
                    break
            
            if not target_team:
                return None  # Target not found
            
            # LOGIC RULES:
            # 1. Operator can do anything.
            # 2. Player TARGETING OWN TEAM (Self/Ally): Allowed. Free. (Mechanic for solving)
            # 3. Player TARGETING RIVAL: Allowed. Costs Points. (Sabotage)
            
            is_rival_interaction = (not is_operator) and (requester_team and requester_team.id != target_team.id)
            is_self_interaction = (not is_operator) and (requester_team and requester_team.id == target_team.id)
            
            if is_self_interaction and room.logic_mode != 'open':
                return None # Players can only toggle self-NOT in 'open' mode
            
            if is_rival_interaction:
                 # Check points for sabotage
                 if requester_team.score <= 0: # Relaxed from 4, maybe just needs positive score? Or cost is 1.
                     # Let's keep it accessible but cost points.
                     # If score is 0, maybe can't sabotage?
                     if requester_team.score < 1:
                         return None
            
            # Apply Toggle
            target_team.players[target_sid].has_not_gate = not target_team.players[target_sid].has_not_gate
            target_team.solved_current_round = False
            
            # Deduct points ONLY for rival sabotage
            if is_rival_interaction:
                requester_team.score = max(0, requester_team.score - 1)
                requester_team.not_gates_used += 1
                
            return room
                        
        return None

    def set_logic_mode(self, room_id: str, mode: str):
        if room_id in self.rooms and mode in ['predict', 'open']:
            self.rooms[room_id].logic_mode = mode
            return self.rooms[room_id]
        return None

    def reset_scores(self, room_id: str):
        room = self.rooms.get(room_id)
        if room:
            for team in room.teams.values():
                team.score = 0
            return room
        return None

    def check_logic(self, room_id: str):
        room = self.rooms.get(room_id)
        if not room or room.state != "PLAYING":
            return
        
        for team in room.teams.values():
            if team.solved_current_round:
                continue

            # 1. Calculate REALITY (The output the gate produces based on cards)
            gate_type = team.current_gate
            gate_func = GATE_LOGIC.get(gate_type, GATE_LOGIC['AND'])
            
            logic_inputs = []
            
            for player in team.players.values():
                # Input comes from CARD VALUE now, not vote
                # If NOT gate is active, invert the card value
                raw_val = player.card_value
                logic_value = bool(raw_val)
                if player.has_not_gate:
                    logic_value = not logic_value
                logic_inputs.append(logic_value)
            
            # The True Output of the gate
            real_output_bool = gate_func(logic_inputs)
            real_output = 1 if real_output_bool else 0
            
            # 2. Check Logic based on Mode
            if room.logic_mode == 'open':
                # FORCE OPEN MODE:
                # Goal: Real Output MUST be 1.
                
                player_votes = [p.vote_value for p in team.players.values()]
                if any(v is None for v in player_votes): continue
                
                # Win Condition: Output is 1 AND Consensus is 1
                if real_output == 1 and all(v == 1 for v in player_votes):
                    team.solved_current_round = True
                    gate_score = GATE_SCORES.get(gate_type, 2)
                    team.score += gate_score
                    return team
            
            else:
                # PREDICT MODE (Default):
                # Goal: Predict the output correctly (0 or 1).
                
                player_votes = [p.vote_value for p in team.players.values()]
                if any(v is None for v in player_votes): continue 
                
                # Win Condition: Consensus matches Reality
                if all(v == real_output for v in player_votes):
                    team.solved_current_round = True
                    gate_score = GATE_SCORES.get(gate_type, 2)
                    team.score += gate_score
                    return team
            
        return None

    def attempt_open(self, sid: str):
        """Team attempts to open the gate. If real output is 1, they succeed."""
        for room in self.rooms.values():
            for team in room.teams.values():
                if sid in team.players:
                    if room.logic_mode == 'open' and room.state == 'PLAYING':
                        # NEW: Check if EVERYONE in the team has confirmed
                        player_votes = [p.vote_value for p in team.players.values()]
                        if any(v is None for v in player_votes):
                            return room, None # Cannot override yet
                        
                        # Calculate REALITY (The output the gate produces based on cards + active NOTs)
                        gate_type = team.current_gate
                        gate_func = GATE_LOGIC.get(gate_type, GATE_LOGIC['AND'])
                        
                        logic_inputs = []
                        for p in team.players.values():
                            logic_value = bool(p.card_value)
                            if p.has_not_gate:
                                logic_value = not logic_value
                            logic_inputs.append(logic_value)
                        
                        real_output_bool = gate_func(logic_inputs)
                        
                        if real_output_bool:
                            team.solved_current_round = True
                            gate_score = GATE_SCORES.get(gate_type, 2)
                            team.score += gate_score
                            return room, team
                        else:
                            # Penalty for wrong attempt to avoid spamming
                            team.score = max(0, team.score - 1)
                            return room, None
        return None, None

    def start_round(self, room_id: str, duration: int = 60):
        room = self.rooms.get(room_id)
        if not room:
            return None
        
        # Increment round number
        room.round_number += 1
        
        # Reset teams for new round
        for team in room.teams.values():
            team.solved_current_round = False
            team.last_round_result = None  # Clear previous result
            team.not_gates_used = 0
        
        # Assign gates based on game mode
        self.assign_gates(room)
            
        room.state = 'PLAYING'
        room.current_round_end_time = time.time() + duration
        
        # Deal random cards (0 or 1) to each player
        # Iterate through all players in all teams
        for team in room.teams.values():
            for player in team.players.values():
                player.card_value = random.choice([0, 1])
                player.vote_value = None  # Reset vote
                player.has_not_gate = False
        
        return room

    def assign_gates(self, room: Room):
        """Assign gates to teams based on game mode and round number"""
        team_list = list(room.teams.values())
        num_teams = len(team_list)
        
        if room.game_mode == 'campaign':
            # Cycle through target gates based on round number
            gates = room.target_gates if room.target_gates else ['AND']
            gate_index = (room.round_number - 1) % len(gates)
            gate = gates[gate_index]
            for team in team_list:
                team.current_gate = gate
        
        elif room.game_mode == 'competitive':
            # Use the single selected gate for everyone
            gate = room.target_gate if room.target_gate else 'AND'
            for team in team_list:
                team.current_gate = gate
                
        elif room.game_mode == 'asymmetric':
            # Each team gets a different gate, rotating each round
            available_gates = ['AND', 'OR', 'XOR', 'XNOR', 'NAND', 'NOR']
            for i, team in enumerate(team_list):
                # Rotate gates based on round number
                gate_index = (i + room.round_number) % len(available_gates)
                team.current_gate = available_gates[gate_index]

    def check_gate_logic(self, team: Team) -> bool:
        """Check if a specific team solved their gate"""
        gate_func =GATE_LOGIC.get(team.current_gate, GATE_LOGIC['AND'])
        logic_inputs = []
        
        for player in team.players.values():
            logic_value = player.is_input_active if not player.has_not_gate else not player.is_input_active
            logic_inputs.append(logic_value)
        
        return gate_func(logic_inputs)

    # def check_logic(self, room_id: str):
    #     room = self.rooms.get(room_id)
    #     if not room or room.state != "PLAYING":
    #         return
        
    #     for team in room.teams.values():
    #         if team.solved_current_round:
    #             continue

    #         # Calculate Expected Result based on Cards
    #         # Gate: AND
    #         server_inputs = []
    #         for player in team.players.values():
    #             val = player.card_value
    #             if player.has_not_gate:
    #                 val = 1 if val == 0 else 0
    #             server_inputs.append(val)
            
    #         # If no players, ignore
    #         if not server_inputs:
    #             continue
                
    #         # AND Logic: Result is 1 if ALL inputs are 1
    #         expected_result = 1 if all(v == 1 for v in server_inputs) else 0
            
    #         # Check Team Action
    #         # Rule: Everyone must vote CORRECTLY matches Expected Result?
    #         # User: "para que el equipo acierte deben acertar todos los miembros del equipo"
    #         # This implies if Expected=1, everyone must vote 1. If Expected=0, everyone must vote 0.
            
    #         # Check if all players have voted
    #         player_votes = [p.vote_value for p in team.players.values()]
    #         if any(v is None for v in player_votes):
    #             continue # Wait for everyone to vote
            
    #         # Check if all votes trigger success
    #         # Success = All Votes Match the Expected Result
    #         all_correct = all(v == expected_result for v in player_votes)
            
    #         if all_correct:
    #             team.solved_current_round = True
    #             team.score += 2
    #             return team
    #         else:
    #             # If everyone voted but not all correct, is it a fail immediately?
    #             # Or wait for them to change? 
    #             # "que puedan seleccionar salida 1 o salida 0". 
    #             # Let's assume real-time check: if everyone has voted and it's WRONG, penalize? 
    #             # Or simply don't solve it yet.
    #             # Let's implement immediate penalty if everyone is locked in but wrong could be harsh.
    #             # Let's just return None (not solved) until they fix it.
    #             pass
