import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import LogicCard from './LogicCard';
import { LogicGate } from './Visuals';
import GameInstructions from './GameInstructions';
import HackerDashboard from './HackerDashboard';
import { getGateInfo } from '../utils/gateHelpers';
import TeamChat from './TeamChat';
import { Container, Row, Col, Card, Button, ProgressBar, Badge, Navbar, Nav, OverlayTrigger, Tooltip } from 'react-bootstrap';

const GameArena = () => {
    const { socket } = useSocket();
    const { gameState, player } = useGameStore();
    const [timeLeft, setTimeLeft] = useState(0);
    const [voteValue, setVoteValue] = useState(null);

    // Reliable Timer Logic
    useEffect(() => {
        if (gameState?.state === 'PLAYING' && gameState?.timer > 0) {
            // Set the target end time relative to now
            const endTime = Date.now() + (gameState.timer * 1000);

            const timerInterval = setInterval(() => {
                const now = Date.now();
                const diff = Math.ceil((endTime - now) / 1000);

                if (diff <= 0) {
                    setTimeLeft(0);
                    clearInterval(timerInterval);
                } else {
                    setTimeLeft(diff);
                }
            }, 500); // Update twice a second for smoothness

            // Initial set
            setTimeLeft(Math.ceil(gameState.timer));

            return () => clearInterval(timerInterval);
        } else {
            setTimeLeft(0);
        }
    }, [gameState?.state]); // Only re-run when game state changes (PLAYING/not PLAYING)

    // Sync local input with socket
    const castVote = (val) => {
        if (!socket || player.role === 'operator') return;
        setVoteValue(val);
        socket.emit('player_input', { vote: val });
    };



    const toggleNotGate = (targetSid) => {
        if (!socket) return;
        socket.emit('apply_not', { target_sid: targetSid, room_id: gameState.id });
    };

    const startRound = (duration) => {
        if (!socket || player.role !== 'operator') return;
        socket.emit('start_round', { room_id: gameState.id, duration });
    };

    const kickPlayer = (targetSid) => {
        if (!socket || player.role !== 'operator') return;
        socket.emit('kick_player', { target_sid: targetSid, room_id: gameState.id });
    };

    const setGameMode = (mode) => {
        if (!socket || player.role !== 'operator') return;
        socket.emit('set_game_mode', { room_id: gameState.id, mode });
    };

    const setTargetGate = (gate) => {
        if (!socket || player.role !== 'operator') return;
        socket.emit('set_target_gate', { room_id: gameState.id, gate });
    };

    const setTargetGates = (gates) => {
        if (!socket || player.role !== 'operator') return;
        socket.emit('set_target_gate', { room_id: gameState.id, gates });
    };

    const resetScores = () => {
        if (!socket || player.role !== 'operator') return;
        socket.emit('reset_scores', { room_id: gameState.id });
    };

    const setLogicMode = (mode) => {
        if (!socket || player.role !== 'operator') return;
        socket.emit('set_logic_mode', { room_id: gameState.id, mode });
    };

    const setMaxPlayers = (count) => {
        if (!socket || player.role !== 'operator') return;
        socket.emit('set_max_players', { room_id: gameState.id, count });
    };

    const setNotLockout = (seconds) => {
        if (!socket || player.role !== 'operator') return;
        socket.emit('set_not_lockout', { room_id: gameState.id, seconds });
    };

    if (!gameState) return <div className="text-white flex items-center justify-center h-screen bg-black">Initializing Uplink...</div>;

    const toggleChat = (teamId) => {
        if (!socket || player.role !== 'operator') return;
        socket.emit('toggle_chat', { room_id: gameState.id, team_id: teamId });
    };

    if (player.role === 'operator') {
        return <HackerDashboard
            gameState={gameState}
            onStartRound={startRound}
            onToggleNot={toggleNotGate}
            onKickPlayer={kickPlayer}
            onSetGameMode={setGameMode}
            onSetTargetGate={setTargetGate}
            onSetTargetGates={setTargetGates}
            onSetLogicMode={setLogicMode}
            onSetMaxPlayers={setMaxPlayers}
            onSetNotLockout={setNotLockout}
            onResetScores={resetScores}
            onToggleChat={toggleChat}
        />;
    }

    const myTeam = Object.values(gameState.teams).find(t => t.players[socket.id]);
    const otherTeams = Object.values(gameState.teams).filter(t => !t.players[socket.id]);

    if (!myTeam) return <div className="text-red-500">CRITICAL ERROR: UNIT NOT FOUND</div>;

    // --- PREPARE 3 SLOTS FOR ALIGNMENT ---
    const maxSlots = gameState.max_players_per_team || 3;
    const playersArray = Object.values(myTeam.players).sort((a, b) => (a.sid || '').localeCompare(b.sid || ''));
    const playerSlots = Array(maxSlots).fill(null);
    playersArray.forEach((p, i) => { if (i < maxSlots) playerSlots[i] = p; });

    const pinValues = playerSlots.map(p => {
        if (!p) return null;
        let val = Number(p.card_value);
        if (isNaN(val)) val = 0;
        if (p.has_not_gate) val = val === 1 ? 0 : 1;
        return val;
    });

    const currentInputs = pinValues.filter(v => v !== null);

    const calculateGateOutput = (gateType, inputs) => {
        if (!inputs || inputs.length === 0) return 0;
        switch (gateType) {
            case 'AND': return inputs.every(i => i === 1) ? 1 : 0;
            case 'OR': return inputs.some(i => i === 1) ? 1 : 0;
            case 'NOT': return inputs[0] === 0 ? 1 : 0;
            case 'NAND': return !(inputs.every(i => i === 1)) ? 1 : 0;
            case 'NOR': return !(inputs.some(i => i === 1)) ? 1 : 0;
            case 'XOR': return (inputs.reduce((a, b) => a + b, 0) % 2 !== 0) ? 1 : 0;
            case 'XNOR': return (inputs.reduce((a, b) => a + b, 0) % 2 === 0) ? 1 : 0;
            default: return 0;
        }
    };

    const realOutput = myTeam ? calculateGateOutput(myTeam.current_gate, currentInputs) : 0;

    const isWaiting = gameState.state !== 'PLAYING' && gameState.state !== 'FINISHED';
    const isPlaying = gameState.state === 'PLAYING';

    // --- VOTING STATUS ---
    const totalPlayers = myTeam ? Object.keys(myTeam.players).length : 0;
    const votes = myTeam ? Object.values(myTeam.players).map(p => p.vote_value).filter(v => v !== null) : [];
    const everyoneVoted = votes.length === totalPlayers;
    const allAgree = votes.length > 0 && votes.every(v => v === votes[0]);
    const showMismatch = !allAgree && votes.length > 1;
    const teamConsensus = (everyoneVoted && allAgree) ? votes[0] : null;

    // --- VISUALIZATION HELPERS ---
    const showGateReality = gameState.state === 'FINISHED';
    const gateIsActive = showGateReality && realOutput === 1;
    const gateGlowClass = gateIsActive ? 'bg-emerald-500/20' : (showGateReality ? 'bg-red-500/10' : 'bg-cyan-900/10');

    const outputHeaderText = gateIsActive
        ? 'GATE OPEN (1)'
        : (showGateReality ? 'GATE CLOSED (0)' : 'ANALYZING...');

    const outputHeaderClass = gateIsActive
        ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]'
        : (showGateReality ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'text-slate-600/50 animate-pulse');

    return (
        <div className="min-vh-100 bg-dark text-white overflow-hidden font-sans">
            {/* Ambient Background - Keeping the cool visuals but containerized */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
            </div>

            {/* Header / HUD with Bootstrap Navbar */}
            <Navbar bg="black" variant="dark" expand="lg" className="border-bottom border-secondary bg-opacity-50 backdrop-blur z-2">
                <Container fluid className="px-4">
                    <Navbar.Brand className="d-flex align-items-center gap-3">
                        <div className={`rounded-circle shadow-sm ${isPlaying ? 'bg-info animate-pulse' : 'bg-warning'}`} style={{ width: '12px', height: '12px' }}></div>
                        <div>
                            <div className="h4 fw-black mb-0 tracking-widest text-info">LOGIC ARENA</div>
                            <div className="small fw-bold text-success text-uppercase">
                                MISSION: {(gameState.logic_mode || 'predict') === 'predict' ? 'PREDICT OUTPUT' : 'FORCE OPEN (1)'}
                            </div>
                        </div>
                    </Navbar.Brand>

                    <Nav className="mx-auto d-none d-lg-flex align-items-center gap-4">
                        {myTeam.current_gate && (() => {
                            const gateInfo = getGateInfo(myTeam.current_gate);
                            return (
                                <Card bg="dark" border={gateInfo.color.replace('text-', 'border-')} className="text-center px-4 py-2 border-2 bg-opacity-25">
                                    <div className={`h2 fw-black mb-0 ${gateInfo.color}`}>{gateInfo.symbol}</div>
                                    <div className="small fw-bold text-uppercase opacity-75">{gateInfo.name} Gate</div>
                                </Card>
                            );
                        })()}

                        <div className="text-center px-4">
                            <h2 className={`font-monospace fw-black mb-0 ${timeLeft <= 5 ? 'text-danger animate-pulse fs-1' : timeLeft <= 10 ? 'text-warning fs-2' : 'text-light fs-3'}`}>
                                {timeLeft}s
                            </h2>
                            {timeLeft <= 5 && timeLeft > 0 && <Badge bg="danger" className="text-uppercase">Hurry!</Badge>}
                        </div>

                        <Card bg="dark" border="success" className="text-center px-4 py-2 bg-opacity-25">
                            <div className="h3 fw-black mb-0 text-success">{myTeam.score}</div>
                            <div className="small fw-bold text-uppercase text-success opacity-75">Score</div>
                        </Card>
                    </Nav>

                    <div className="d-flex align-items-center gap-3">
                        <Badge bg="secondary" className="p-2 font-monospace">SECURE_LINK: {gameState.id}</Badge>
                    </div>
                </Container>
            </Navbar>

            {/* Round Summary Overlay */}
            <AnimatePresence>
                {(gameState.state === 'FINISHED' || (gameState.state === 'LOBBY' && gameState.round_number > 0)) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                    >
                        <Card border="info" className="w-full max-w-lg shadow-2xl overflow-hidden border-2" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                            <Card.Header className="bg-info text-black py-3 text-center">
                                <h2 className="display-6 fw-black mb-0 tracking-tighter">DATASTREAM_SUMMARY</h2>
                                <small className="fw-bold tracking-widest opacity-75">ROUND #{gameState.round_number} ANALYSIS COMPLETE</small>
                            </Card.Header>
                            <Card.Body className="p-4 p-md-5">
                                <div className="space-y-4 mb-4">
                                    {Object.values(gameState.teams).sort((a, b) => b.score - a.score).map((team, idx) => (
                                        <div key={team.id} className="p-4 rounded-xl border border-secondary bg-zinc-900 shadow-inner">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-zinc-800 rounded-lg p-2 text-info fw-black">{idx + 1}</div>
                                                    <div>
                                                        <h4 className={`mb-0 fw-black ${team.id === 'A' ? 'text-success' : 'text-warning'}`}>
                                                            {team.name}
                                                        </h4>
                                                        <div className="x-small text-muted tracking-widest uppercase">Unit Score Accumulus</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="h3 mb-0 fw-black text-white">{team.score}</div>
                                                    <div className={`x-small fw-bold ${team.last_round_result === 'success' ? 'text-success' : 'text-danger'}`}>
                                                        {team.last_round_result === 'success' ? 'ACQUIRED' : 'DENIED'}
                                                    </div>
                                                </div>
                                            </div>

                                            <Row className="g-2 text-center small py-3 border-y border-zinc-800 my-2">
                                                <Col>
                                                    <div className="text-muted uppercase x-small mb-1">Base</div>
                                                    <div className="text-white fw-bold">+{team.round_stats?.base || 0}</div>
                                                </Col>
                                                <Col>
                                                    <div className="text-muted uppercase x-small mb-1">Bonus</div>
                                                    <div className="text-emerald-400 fw-bold">+{team.round_stats?.bonus || 0}</div>
                                                </Col>
                                                <Col>
                                                    <div className="text-muted uppercase x-small mb-1">Penalty</div>
                                                    <div className="text-rose-500 fw-bold">-{team.round_stats?.penalty || 0}</div>
                                                </Col>
                                            </Row>

                                            {team.was_sabotaged && (
                                                <div className="mt-2 text-center">
                                                    <Badge bg="warning" text="dark" className="p-2 animate-pulse w-full tracking-widest x-small fw-bold">
                                                        ⚠️ SABOTAGE NEUTRALIZED (+0.5 XP)
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-center">
                                    <div className="text-muted small italic animate-pulse">Waiting for Operator to initiate next sequence...</div>
                                </div>
                            </Card.Body>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Stage - Bootstrap GRID LAYOUT */}
            <main className="flex-grow-1 d-flex align-items-center py-4 z-1">
                <Container>
                    <Row className="align-items-center gy-4">
                        {/* COL 1: TEAM INPUTS */}
                        <Col lg={4} className="order-3 order-lg-1">
                            <Card bg="dark" border="secondary" className="bg-opacity-25 backdrop-blur h-100">
                                <Card.Header className="bg-transparent border-secondary py-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <small className="fw-black text-info tracking-widest uppercase">Team Inputs</small>
                                        <Badge bg="secondary" pill className="opacity-50">IN</Badge>
                                    </div>
                                </Card.Header>
                                <Card.Body className="p-3" style={{ height: '300px' }}>
                                    <div className="d-flex flex-column h-100 justify-content-between">
                                        {playerSlots.map((p, idx) => {
                                            if (!p) return (
                                                <div key={`empty-${idx}`} className="p-3 border border-secondary border-dashed rounded opacity-25 text-center text-muted small" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    EMPTY_SLOT_{idx + 1}
                                                </div>
                                            );

                                            const isMe = p.sid === socket.id;
                                            return (
                                                <Card
                                                    key={p.sid}
                                                    bg="black"
                                                    border={p.has_not_gate ? "danger" : "secondary"}
                                                    className={`bg-opacity-50 border-opacity-25 transition-all ${p.has_not_gate ? 'shadow-sm' : ''}`}
                                                    style={{ height: '80px' }}
                                                >
                                                    <Card.Body className="p-2 d-flex align-items-center">
                                                        <Row className="align-items-center g-0 w-100">
                                                            <Col xs="auto" className="text-center" style={{ width: '45px' }}>
                                                                <div className="fs-4 mb-0">{p.avatar}</div>
                                                                <div className={`fw-bold text-uppercase ${isMe ? 'text-info' : 'text-muted'}`} style={{ fontSize: '7px' }}>
                                                                    {isMe ? 'YOU' : p.name.split(' ')[0]}
                                                                </div>
                                                            </Col>

                                                            <Col className="px-2">
                                                                <Button
                                                                    onClick={() => isMe && isPlaying && timeLeft > (gameState.not_lockout_time || 5) && toggleNotGate(p.sid)}
                                                                    disabled={!isMe || !isPlaying || timeLeft <= (gameState.not_lockout_time || 5)}
                                                                    variant={p.has_not_gate ? "danger" : (isMe && isPlaying && timeLeft > (gameState.not_lockout_time || 5) ? "outline-info" : "outline-secondary")}
                                                                    size="sm"
                                                                    className={`w-100 py-1 border-2 transition-all ${p.has_not_gate ? 'animate-pulse shadow-sm' : ''} ${isMe && isPlaying && timeLeft > (gameState.not_lockout_time || 5) ? '' : 'opacity-50'}`}
                                                                    style={{ fontSize: '9px' }}
                                                                >
                                                                    {p.has_not_gate ? 'NOT_ACTIVE' : (timeLeft <= (gameState.not_lockout_time || 5) ? 'LOCKED' : 'TOGGLE_NOT')}
                                                                </Button>
                                                            </Col>

                                                            <Col xs="auto" className="text-center" style={{ width: '60px' }}>
                                                                <LogicCard
                                                                    value={p.card_value}
                                                                    hasNotGate={false}
                                                                    isWaiting={isWaiting}
                                                                    size="sm"
                                                                />
                                                                <div className={`mt-2 fw-black tracking-widest ${p.vote_value !== null ? 'text-info drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-muted opacity-50'}`} style={{ fontSize: '12px' }}>
                                                                    {p.vote_value !== null ? (
                                                                        <span className="badge bg-info text-dark border border-white shadow-lg animate-pulse" style={{ fontSize: '10px' }}>
                                                                            {isMe ? `VOTE: ${p.vote_value}` : 'READY'}
                                                                        </span>
                                                                    ) : 'WAITING'}
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </Card.Body>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* COL 2: CENTRAL GATE */}
                        <Col lg={4} className="text-center position-relative order-1 order-lg-2">
                            <div className="position-absolute translate-middle top-50 start-50 w-100 h-100 bg-info opacity-10 rounded-circle blur-5 z-0" style={{ filter: 'blur(100px)' }}></div>
                            <div className="z-1 position-relative">
                                <LogicGate
                                    active={gateIsActive}
                                    type={myTeam.current_gate || 'AND'}
                                    inputValues={pinValues}
                                />
                                <div className="mt-4">
                                    <Badge bg="dark" className="p-2 border border-secondary text-info fw-black tracking-widest text-uppercase">
                                        Logic Processing Unit
                                    </Badge>
                                </div>
                            </div>
                        </Col>

                        {/* COL 3: OUTPUT & CONTROLS */}
                        <Col lg={4} className="order-2 order-lg-3">
                            <Card bg="dark" border={myTeam.solved_current_round ? "success" : "secondary"} className="bg-opacity-25 backdrop-blur h-100 border-2">
                                <Card.Body className="p-4 d-flex flex-column align-items-center justify-content-center text-center">
                                    <div className="w-100 border-bottom border-secondary pb-2 mb-4">
                                        <small className="fw-black text-muted tracking-widest uppercase">Gate Output</small>
                                        <div className={`h5 fw-bold mt-1 ${outputHeaderClass}`}>{outputHeaderText}</div>
                                    </div>

                                    <div className="display-1 fw-black text-light font-monospace mb-4">
                                        {gameState.state === 'FINISHED' ? realOutput : (teamConsensus !== null ? teamConsensus : '-')}
                                    </div>

                                    <div className="w-100 px-3">
                                        {isPlaying ? (
                                            gameState.logic_mode === 'open' ? (
                                                <div className="d-grid gap-3 w-100">
                                                    <Button
                                                        variant={voteValue === 1 ? "info" : "outline-secondary"}
                                                        onClick={() => castVote(voteValue === 1 ? null : 1)}
                                                        className={`py-3 fw-black text-uppercase border-2 ${voteValue === 1 ? 'shadow-sm' : ''}`}
                                                    >
                                                        {voteValue === 1 ? '✅ Confirmed' : '🔘 Confirm Setup'}
                                                    </Button>
                                                    <Button
                                                        variant={everyoneVoted ? "success" : "secondary"}
                                                        disabled={!everyoneVoted}
                                                        onClick={() => socket.emit('attempt_open', { room_id: gameState.id })}
                                                        className="py-4 fw-black text-uppercase border-2 shadow-lg tracking-widest"
                                                    >
                                                        🚀 Attempt Override
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Row className="g-2 w-100">
                                                    <Col xs={6}>
                                                        <Button
                                                            variant={voteValue === 0 ? "light" : "outline-secondary"}
                                                            onClick={() => castVote(voteValue === 0 ? null : 0)}
                                                            className={`w-100 py-3 fw-black border-2 transition-all ${voteValue === 0 ? 'shadow-[0_0_20px_rgba(255,255,255,0.6)] scale-105' : 'opacity-75'}`}
                                                            style={voteValue === 0 ? { boxShadow: '0 0 15px rgba(255,255,255,0.7)' } : {}}
                                                        >
                                                            <div className="d-flex align-items-center justify-content-center gap-2">
                                                                <div className={`rounded-circle ${voteValue === 0 ? 'bg-dark' : 'bg-secondary'}`} style={{ width: '15px', height: '15px' }}></div>
                                                                <span className="fs-5">VOTE 0</span>
                                                            </div>
                                                        </Button>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <Button
                                                            variant={voteValue === 1 ? "info" : "outline-info"}
                                                            onClick={() => castVote(voteValue === 1 ? null : 1)}
                                                            className={`w-100 py-3 fw-black border-2 transition-all ${voteValue === 1 ? 'shadow-[0_0_20px_rgba(6,182,212,0.8)] scale-105' : 'opacity-75'}`}
                                                            style={voteValue === 1 ? { boxShadow: '0 0 15px rgba(6,182,212,0.7)' } : {}}
                                                        >
                                                            <div className="d-flex align-items-center justify-content-center gap-2">
                                                                <div className={`rounded-circle ${voteValue === 1 ? 'bg-white' : 'bg-info'}`} style={{ width: '15px', height: '15px' }}></div>
                                                                <span className="fs-5 text-shadow">VOTE 1</span>
                                                            </div>
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            )
                                        ) : (
                                            <div className="py-3">
                                                {gameState.state === 'FINISHED' ? (
                                                    <Badge bg="secondary" pill className="text-uppercase tracking-widest p-2">Sequence Ended</Badge>
                                                ) : myTeam.solved_current_round ? (
                                                    <Badge bg="success" pill className="text-uppercase tracking-widest p-2">Access Granted</Badge>
                                                ) : (
                                                    <div className="text-muted small animate-pulse">Waiting for commands...</div>
                                                )}
                                            </div>
                                        )}

                                        {isPlaying && (
                                            <div className="mt-3 small fw-bold text-uppercase opacity-75">
                                                <div style={{ fontSize: '12px' }}>
                                                    {votes.length < totalPlayers ? (
                                                        <span className="text-info fw-black animate-pulse-glow">Awaiting team ({votes.length}/{totalPlayers})</span>
                                                    ) : showMismatch ? (
                                                        <span className="text-warning animate-bounce">⚠️ Voting Mismatch</span>
                                                    ) : teamConsensus !== null ? (
                                                        <span className="text-success">Consensus Synchronized</span>
                                                    ) : (
                                                        <span className="text-muted">Analyzing Signals</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {gameState.state === 'FINISHED' && (
                                        <div className="mt-4">
                                            <Badge bg={myTeam.solved_current_round ? "success" : "danger"} className="fs-5 p-3 text-uppercase tracking-widest shadow">
                                                {myTeam.solved_current_round ? 'Verified' : 'Failed'}
                                            </Badge>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* RIVAL SIGNALS SECTION */}
                    {isPlaying && otherTeams.length > 0 && (
                        <Row className="mt-5 justify-content-center">
                            <Col lg={10}>
                                <Card bg="dark" border="warning" className="bg-opacity-10 border-opacity-25">
                                    <Card.Body className="p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="text-warning text-uppercase fw-black mb-0 tracking-widest">Rival Hazard Detection</h6>
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={<Tooltip>Apply NOT gates to sabotate rivals. Costs 1 point. Requires &gt;4 score and &gt;5s.</Tooltip>}
                                            >
                                                <Badge bg="warning" text="dark" pill style={{ cursor: 'help' }}>INFO</Badge>
                                            </OverlayTrigger>
                                        </div>
                                        <Row className="g-3">
                                            {otherTeams.map(team => {
                                                const canApplyNot = myTeam.score > 4 && timeLeft > 5;
                                                return (
                                                    <Col md={6} key={team.id}>
                                                        <div className="p-3 bg-black bg-opacity-50 rounded border border-secondary border-opacity-25">
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <span className="fw-bold">{team.name}</span>
                                                                <Badge bg={team.solved_current_round ? "success" : "secondary"}>
                                                                    {team.solved_current_round ? 'SOLVED' : 'COMPUTING'}
                                                                </Badge>
                                                            </div>
                                                            <div className="d-flex flex-wrap gap-2 pt-2 border-top border-secondary border-opacity-25">
                                                                {Object.entries(team.players).map(([sid, p]) => {
                                                                    const canApplyNot = myTeam.score > 0 && timeLeft > (gameState.not_lockout_time || 5);
                                                                    return (
                                                                        <Button
                                                                            key={sid}
                                                                            size="sm"
                                                                            variant={p.has_not_gate ? "danger" : (canApplyNot ? "outline-warning" : "outline-secondary")}
                                                                            disabled={!canApplyNot}
                                                                            onClick={() => toggleNotGate(sid)}
                                                                            className={`flex-fill fs-xs py-1 transition-all ${p.has_not_gate ? 'animate-pulse shadow-sm' : ''}`}
                                                                        >
                                                                            {p.avatar} {timeLeft <= (gameState.not_lockout_time || 5) ? 'LOCKED' : (p.has_not_gate ? 'ACTIVE' : 'SABOTAGE')}
                                                                        </Button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </Col>
                                                );
                                            })}
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </Container>
            </main>
            {/* Chat Overlay */}
            {
                myTeam && myTeam.chat_enabled && (
                    <TeamChat
                        socket={socket}
                        room={gameState.id}
                        teamId={myTeam.id}
                        myName={player.name}
                    />
                )
            }
            <GameInstructions />


        </div >
    );
};

export default GameArena;
