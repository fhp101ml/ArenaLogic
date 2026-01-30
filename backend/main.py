from game_manager import GameManager
import asyncio
import time
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
socket_app = socketio.ASGIApp(sio, app)

game_manager = GameManager()

@app.get("/")
async def root():
    return {"message": "Logic Gates Game Backend is running"}

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    await sio.emit('connection_ack', {'sid': sid}, to=sid)

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    game_manager.remove_player(sid)
    # Broadcast update? Ideally yes.
    
@sio.event
async def join_game(sid, data):
    print(f"DEBUG: join_game called with data: {data}")
    # data: { room_id, name, role, team_id }
    room_id = data.get('room_id')
    name = data.get('name')
    role = data.get('role')
    team_id = data.get('team_id')
    avatar = data.get('avatar', '😀')
    
    success = game_manager.join_room(sid, room_id, name, role, team_id, avatar)
    print(f"DEBUG: join_room result for {sid}: {success}")
    
    if success:
        await sio.enter_room(sid, room_id)
        room = game_manager.rooms[room_id]
        print(f"DEBUG: Broadcasting state for room {room_id}")
        # Send full state to everyone in room
        await broadcast_room_state(room_id)
    else:
        print(f"DEBUG: Join failed for {sid}")
        await sio.emit('error', {'message': 'Could not join room'}, to=sid)

@sio.event
async def start_round(sid, data):
    room_id = data.get('room_id')
    duration = data.get('duration', 30) # Default 30s
    room = game_manager.rooms.get(room_id)
    if room and room.operator_sid == sid:
        print(f"DEBUG: Starting round for room {room_id} initiated by {sid} with duration {duration}s")
        game_manager.start_round(room_id, duration)
        await broadcast_room_state(room_id)
        # Start timer task
        asyncio.create_task(game_timer(room_id))

@sio.event
async def player_input(sid, data):
    vote = data.get('vote') # 0 or 1
    room = game_manager.set_input(sid, vote)
    if room:
        # Check logic immediately on input change
        solved_team = game_manager.check_logic(room.id)
        if solved_team:
            await sio.emit('round_result', {'winner': solved_team.id, 'score': solved_team.score}, room=room.id)
            # Maybe waiting period before next round?
            
        await broadcast_room_state(room.id)
        
@sio.event
async def attempt_open(sid, data):
    room, solved_team = game_manager.attempt_open(sid)
    if room:
        if solved_team:
            await sio.emit('round_result', {'winner': solved_team.id, 'score': solved_team.score, 'type': 'success'}, room=room.id)
        else:
            await sio.emit('error', {'message': 'System lock active: Logic output is still 0.'}, to=sid)
        await broadcast_room_state(room.id)

@sio.event
async def apply_not(sid, data):
    target_sid = data.get('target_sid')
    room_id = data.get('room_id')
    room = game_manager.toggle_not_gate(sid, target_sid, room_id)
    if room:
        await broadcast_room_state(room.id)
    else:
        # Send error message to requester
        await sio.emit('error', {'message': 'Cannot apply NOT gate (time/score/team restrictions)'}, room=sid)

@sio.event
async def kick_player(sid, data):
    """Operator can kick any player from the room"""
    target_sid = data.get('target_sid')
    room_id = data.get('room_id')
    
    # Verify operator
    room = game_manager.rooms.get(room_id)
    if room and room.operator_sid == sid:
        # Disconnect the target player
        game_manager.remove_player(target_sid)
        await sio.leave_room(target_sid, room_id)
        await sio.emit('kicked', {'message': 'You have been removed from the game'}, room=target_sid)
        await sio.disconnect(target_sid)
        await broadcast_room_state(room_id)

@sio.event
async def set_game_mode(sid, data):
    """Operator sets the game mode"""
    room_id = data.get('room_id')
    mode = data.get('mode')  # 'competitive', 'asymmetric', 'campaign'
    
    room = game_manager.rooms.get(room_id)
    if room and room.operator_sid == sid and mode in ['competitive', 'asymmetric', 'campaign']:
        room.game_mode = mode
        room.round_number = 0  # Reset rounds when changing mode
        await broadcast_room_state(room_id)

@sio.event
async def set_target_gate(sid, data):
    """Operator sets the target gate sequence or single gate"""
    room_id = data.get('room_id')
    gate = data.get('gate')  # Single gate (Competitive)
    gates = data.get('gates') # Sequence (Campaign)
    
    room = game_manager.rooms.get(room_id)
    if not room or room.operator_sid != sid: return
    
    valid_gates = ['AND', 'OR', 'XOR', 'XNOR', 'NAND', 'NOR']
    
    if gates is not None:
        if isinstance(gates, str): gates = [gates]
        if all(g in valid_gates for g in gates):
            room.target_gates = gates
            await broadcast_room_state(room_id)
    elif gate is not None:
        if gate in valid_gates:
            room.target_gate = gate
            await broadcast_room_state(room_id)

@sio.event
async def reset_scores(sid, data):
    """Operator resets all team scores"""
    room_id = data.get('room_id')
    room = game_manager.rooms.get(room_id)
    if room and room.operator_sid == sid:
        game_manager.reset_scores(room_id)
        await broadcast_room_state(room_id)

@sio.event
async def set_logic_mode(sid, data):
    """Operator sets the logic mode ('predict' or 'open')"""
    room_id = data.get('room_id')
    mode = data.get('mode')
    
    room = game_manager.set_logic_mode(room_id, mode)
    if room:
        await broadcast_room_state(room_id)

@sio.event
async def upload_card_image(sid, data):
    """Player uploads custom card image"""
    room_id = data.get('room_id')
    card_type = data.get('card_type')  # '0' or '1'
    image_data = data.get('image_data')  # base64 string
    
    room = game_manager.rooms.get(room_id)
    if room:
        if card_type == '0':
            room.custom_card_0 = image_data
        elif card_type == '1':
            room.custom_card_1 = image_data
        await broadcast_room_state(room_id)

async def broadcast_room_state(room_id):
    room = game_manager.rooms.get(room_id)
    if room:
        # Serialize room state
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
                    'current_gate': t.current_gate,
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
        await sio.emit('game_state', state, room=room_id)

async def game_timer(room_id):
    room = game_manager.rooms.get(room_id)
    while room and room.state == "PLAYING":
        remaining = room.current_round_end_time - time.time()
        if remaining <= 0:
            # Final logic evaluation before ending
            game_manager.check_logic(room_id)
            
            # Mark results before changing state
            for team in room.teams.values():
                if team.solved_current_round:
                    team.last_round_result = "success"
                else:
                    team.last_round_result = "failed"
                    # Deduct 2 points for failure
                    team.score = max(0, team.score - 2)
            
            room.state = "FINISHED"
            
            # Reset for next round (but keep solved_current_round to show results)
            for team in room.teams.values():
                # DON'T reset solved_current_round yet - needed to show green results
                team.not_gates_used = 0
                for player in team.players.values():
                    # Preserve values for the results screen
                    pass
            
            await sio.emit('round_end', {'message': 'Time up!'}, room=room_id)
            await broadcast_room_state(room_id)
            break
        
        await asyncio.sleep(1)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:socket_app", host="0.0.0.0", port=8000, reload=True)
