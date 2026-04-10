import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SurveyModal from './SurveyModal';
import GameInstructions from './GameInstructions';
import AiAssistantModal from './AiAssistantModal';

const AVATARS = ['🦁', '🐯', '🐻', '🐲', '🦄', '🤖', '👽', '👻', '⚡', '🔥', '💧', '🌪️'];

const Lobby = () => {
    const { socket, isConnected } = useSocket();
    const { draftProfile, setDraftProfile, setPlayer } = useGameStore();

    // Destructure from store state
    const { name, avatar, role } = draftProfile;

    const [roomId, setRoomId] = useState('demo-room');
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [roomInfo, setRoomInfo] = useState(null);
    const [showSurvey, setShowSurvey] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showAiAssistant, setShowAiAssistant] = useState(false);
    const nameInputRef = useRef(null);

    useEffect(() => {
        nameInputRef.current?.focus();
    }, []);

    // Listen for voice-triggered survey start/close
    useEffect(() => {
        if (!socket) return;

        const handleSurveyVoiceStart = () => {
            console.log('[LOBBY] Voice survey start received');
            setShowSurvey(true);
        };

        const handleSurveyClose = () => {
            console.log('[LOBBY] Voice survey close received');
            setShowSurvey(false);
        };

        // Instructions listeners
        const handleInstructionsOpen = () => {
            console.log('[LOBBY] Voice instructions open received');
            setShowInstructions(true);
        };

        const handleInstructionsClose = () => {
            console.log('[LOBBY] Voice instructions close received');
            setShowInstructions(false);
        };

        socket.on('survey_voice_start', handleSurveyVoiceStart);
        socket.on('survey_close', handleSurveyClose);
        socket.on('instructions_open', handleInstructionsOpen);
        socket.on('instructions_close', handleInstructionsClose);


        return () => {
            socket.off('survey_voice_start', handleSurveyVoiceStart);
            socket.off('survey_close', handleSurveyClose);
            socket.off('instructions_open', handleInstructionsOpen);
            socket.off('instructions_close', handleInstructionsClose);
        };
    }, [socket]);

    // Polling for room info when RoomID is set and socket connected
    useEffect(() => {
        if (!socket || !isConnected || !roomId) {
            setRoomInfo(null);
            return;
        }

        // Room info listener
        const handleRoomInfo = (info) => {
            console.log('[LOBBY] Room info received:', info);
            setRoomInfo(info);
            // Default select first available team if none selected
            if (info.teams && Object.keys(info.teams).length > 0) {
                const teams = Object.values(info.teams);
                const available = teams.find(t => t.player_count < info.max_players_per_team);
                if (available && !selectedTeamId) {
                    setSelectedTeamId(available.id);
                }
            }
        };

        socket.on('room_info', handleRoomInfo);

        // Function to fetch info
        const fetchInfo = () => {
            socket.emit('get_room_info', { room_id: roomId });
        };

        // Initial fetch
        fetchInfo();

        // Setup interval
        const intervalId = setInterval(fetchInfo, 3000);

        return () => {
            socket.off('room_info', handleRoomInfo);
            clearInterval(intervalId);
        };
    }, [socket, isConnected, roomId, selectedTeamId]);

    const updateProfile = (field, value) => {
        setDraftProfile({ [field]: value });
    };

    const joinGame = () => {
        if (!name || !socket) return;
        setPlayer({
            name,
            role,
            team_id: selectedTeamId,
            avatar
        });
        socket.emit('join_game', {
            room_id: roomId,
            name,
            role,
            team_id: selectedTeamId,
            avatar
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && name) {
            joinGame();
        }
    };

    return (
        <Container fluid className="d-flex align-items-center justify-content-center min-vh-100 bg-dark p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ width: '100%', maxWidth: '900px' }}
            >
                <Card className="border-secondary shadow-lg overflow-hidden bg-opacity-10 bg-black backdrop-blur">
                    <Card.Header className="text-center p-5 border-bottom border-secondary bg-gradient text-info">
                        <h1 className="display-4 fw-black mb-0 tracking-tighter">LOGIC ARENA</h1>
                        <small className="text-muted text-uppercase tracking-widest">Secure Connection Protocol</small>
                    </Card.Header>

                    <Card.Body className="p-4 p-md-5">
                        <Row className="gy-5">
                            <Col md={6}>
                                <div className="mb-4">
                                    <h6 className="text-info text-uppercase fw-bold mb-3">1. Identification</h6>
                                    <InputGroup className="mb-3">
                                        <InputGroup.Text className="bg-dark border-secondary text-info">@</InputGroup.Text>
                                        <Form.Control
                                            ref={nameInputRef}
                                            size="lg"
                                            placeholder="ENTER CODENAME"
                                            value={name}
                                            onChange={(e) => updateProfile('name', e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            className="bg-dark border-secondary text-light"
                                        />
                                    </InputGroup>
                                    <Form.Control
                                        placeholder="ROOM ID"
                                        value={roomId}
                                        onChange={(e) => setRoomId(e.target.value)}
                                        className="bg-dark border-secondary text-secondary small font-monospace tracking-widest"
                                    />
                                </div>

                                <div>
                                    <h6 className="text-info text-uppercase fw-bold mb-3">2. Select Avatar</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {AVATARS.map((av) => (
                                            <Button
                                                key={av}
                                                variant={avatar === av ? 'info' : 'outline-secondary'}
                                                className={`p-2 d-flex align-items-center justify-center fs-4 ${avatar === av ? 'shadow-sm' : ''}`}
                                                onClick={() => updateProfile('avatar', av)}
                                                style={{ width: '45px', height: '45px', borderStyle: 'dashed' }}
                                            >
                                                {av}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </Col>

                            <Col md={6} className="d-flex flex-column justify-content-between">
                                <div className="mb-4">
                                    <h6 className="text-info text-uppercase fw-bold mb-3">3. Functional Role</h6>
                                    <Row className="g-3">
                                        <Col xs={6}>
                                            <Card
                                                className={`p-3 text-center transition-all cursor-pointer border-2 ${role === 'player' ? 'bg-primary bg-opacity-10 border-primary' : 'bg-transparent border-secondary opacity-50'}`}
                                                onClick={() => updateProfile('role', 'player')}
                                            >
                                                <div className="fs-1 mb-2">⚡</div>
                                                <div className="fw-bold text-light">OPERATIVE</div>
                                                <div className="text-[10px] text-muted text-uppercase">Input Unit</div>
                                            </Card>
                                        </Col>
                                        <Col xs={6}>
                                            <Card
                                                className={`p-3 text-center transition-all cursor-pointer border-2 ${role === 'operator' ? 'bg-danger bg-opacity-10 border-danger' : 'bg-transparent border-secondary opacity-50'}`}
                                                onClick={() => updateProfile('role', 'operator')}
                                            >
                                                <div className="fs-1 mb-2">👨‍💻</div>
                                                <div className="fw-bold text-light">HACKER</div>
                                                <div className="text-[10px] text-muted text-uppercase">Controller</div>
                                            </Card>
                                        </Col>
                                    </Row>
                                </div>

                                <AnimatePresence mode='wait'>
                                    {role === 'player' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="mb-4"
                                        >
                                            <h6 className="text-info text-uppercase fw-bold mb-3">4. Unit Assignment</h6>
                                            <div className="d-flex flex-column gap-2">
                                                {roomInfo?.teams ? (
                                                    Object.values(roomInfo.teams).map((team) => {
                                                        const isFull = team.player_count >= roomInfo.max_players_per_team;
                                                        const isSelected = selectedTeamId === team.id;

                                                        return (
                                                            <Card
                                                                key={team.id}
                                                                className={`p-2 transition-all cursor-pointer border-2 shadow-sm ${isSelected ? 'bg-info bg-opacity-20 border-info' : 'bg-transparent border-secondary opacity-75'} ${isFull ? 'opacity-25 grayscale cursor-not-allowed' : ''}`}
                                                                onClick={() => !isFull && setSelectedTeamId(team.id)}
                                                            >
                                                                <div className="d-flex justify-content-between align-items-center px-2">
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <div className={`rounded-circle ${isSelected ? 'bg-info' : 'bg-secondary'}`} style={{ width: '8px', height: '8px' }}></div>
                                                                        <span className={`fw-bold ${isSelected ? 'text-info' : 'text-light'}`}>{team.name}</span>
                                                                    </div>
                                                                    <div className="small font-monospace">
                                                                        {team.player_count} / {roomInfo.max_players_per_team}
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="p-3 border border-secondary border-dashed rounded bg-black bg-opacity-20 text-center">
                                                        <div className="text-muted x-small uppercase animate-pulse">
                                                            Scanning for active units...
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-2 text-center">
                                                <small className="text-muted x-small uppercase tracking-widest">
                                                    Manual team selection enabled
                                                </small>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <Button
                                    size="lg"
                                    variant="info"
                                    disabled={!name}
                                    onClick={joinGame}
                                    className="py-3 mt-3 fw-black tracking-widest text-uppercase shadow-lg border-2"
                                >
                                    {name ? '⚡ INITIALIZE UPLINK ⚡' : 'INITIALIZE UPLINK'}
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
                <div className="text-center mt-4">
                    <Link
                        to="/instructions"
                        className="text-info text-decoration-none fw-bold tracking-widest uppercase small opacity-50 hover-opacity-100 transition-all"
                    >
                        [ VIEW_CORE_LOGIC_PROTOCOLS ]
                    </Link>
                    <div className="mt-3">
                        <Button
                            variant="outline-warning"
                            onClick={() => setShowSurvey(true)}
                            className="px-4 me-2"
                        >
                            📋 Encuesta de Satisfacción
                        </Button>
                        <Button
                            variant="outline-info"
                            onClick={() => setShowAiAssistant(true)}
                            className="px-4"
                        >
                            🤖 Hablar con IA
                        </Button>
                    </div>
                </div>
                <SurveyModal show={showSurvey} onClose={() => setShowSurvey(false)} />
                <AiAssistantModal show={showAiAssistant} onClose={() => setShowAiAssistant(false)} />
                <GameInstructions
                    isOpen={showInstructions}
                    onClose={() => setShowInstructions(false)}
                    showButton={false}
                />
            </motion.div>
        </Container>
    );
};

export default Lobby;
