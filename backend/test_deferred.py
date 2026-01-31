from game_manager import GameManager

def test_deferred_scoring():
    gm = GameManager()
    room_id = "test_room"
    gm.create_room(room_id)
    gm.join_room("p1", room_id, "P1", "player") # Team A
    gm.join_room("p2", room_id, "P2", "player") # Team A
    
    room = gm.rooms[room_id]
    team_a = room.teams['A']
    
    # 1. Setup round
    gm.start_round(room_id, 10)
    assert team_a.score == 0
    
    # 2. Team A votes correctly for AND gate (1, 1 -> 1)
    team_a.players['p1'].card_value = 1
    team_a.players['p2'].card_value = 1
    team_a.players['p1'].vote_value = 1
    team_a.players['p2'].vote_value = 1
    # Card values default to ? (0 in dataclass), so we forced them to 1.
    
    # 3. Check Logic - Should mark solved but NOT update score
    gm.check_logic(room_id)
    assert team_a.solved_current_round == True
    assert team_a.last_round_base == 2
    assert team_a.score == 0 # STILL 0!
    
    # 4. Finalize Round - Should update score
    gm.finalize_round_scores(room_id)
    assert team_a.score == 2
    assert team_a.last_round_result == "success"
    
    # 5. Reset Scores
    gm.reset_scores(room_id)
    assert team_a.score == 0
    assert team_a.last_round_base == 0
    assert team_a.last_round_result is None

    print("SUCCESS: Deferred scoring and reset work!")

if __name__ == "__main__":
    test_deferred_scoring()
