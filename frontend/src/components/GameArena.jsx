import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import LogicCard from './LogicCard';
import { LogicGate } from './Visuals';
import HackerDashboard from './HackerDashboard';
import { getGateInfo } from '../utils/gateHelpers';
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

    if (!gameState) return <div className="text-white flex items-center justify-center h-screen bg-black">Initializing Uplink...</div>;

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
            onResetScores={resetScores}
        />;
    }

    const myTeam = Object.values(gameState.teams).find(t => t.players[socket.id]);
    const otherTeams = Object.values(gameState.teams).filter(t => !t.players[socket.id]);

    if (!myTeam) return <div className="text-red-500">CRITICAL ERROR: UNIT NOT FOUND</div>;


    const isWaiting = gameState.state !== 'PLAYING' && gameState.state !== 'FINISHED';
    const isPlaying = gameState.state === 'PLAYING';


    // --- LOCAL LOGIC CALCULATION FOR VISUALS ---
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

    const currentInputs = myTeam ? Object.values(myTeam.players)
        .sort((a, b) => (a.sid || '').localeCompare(b.sid || ''))
        .map(p => {
            if (!p) return 0;
            let val = Number(p.card_value); // Force number type
            if (isNaN(val)) val = 0; // Fallback
            if (p.has_not_gate) val = val === 1 ? 0 : 1;
            return val;
        }) : [];

    const realOutput = myTeam ? calculateGateOutput(myTeam.current_gate, currentInputs) : 0;

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

            {/* Last Round Result Banner - Only shown when round FINISHED */}
            <AnimatePresence>
                {gameState.state === 'FINISHED' && myTeam.last_round_result && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`relative z-20 px-6 py-3 border-b-4 ${myTeam.last_round_result === 'success'
                            ? 'bg-emerald-900/40 border-emerald-500 shadow-[0_10px_30px_rgba(16,185,129,0.2)]'
                            : 'bg-red-900/40 border-red-500 shadow-[0_10px_30px_rgba(239,68,68,0.2)]'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-4">
                            <span className="text-3xl">
                                {myTeam.last_round_result === 'success' ? '🚀' : '💥'}
                            </span>
                            <div className="text-center">
                                <div className={`text-lg font-black uppercase tracking-tighter ${myTeam.last_round_result === 'success' ? 'text-emerald-400' : 'text-red-500'
                                    }`}>
                                    Last Round: {myTeam.last_round_result === 'success' ? 'SUCCESS' : 'FAILED'}
                                </div>
                                <div className="flex items-center justify-center gap-4 mt-1">
                                    <div className={`text-xs font-mono px-2 py-0.5 rounded ${myTeam.last_round_result === 'success' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
                                        {myTeam.last_round_result === 'success' ? '+2 pts' : '-2 pts'}
                                    </div>
                                    <div className="text-xs text-white uppercase font-bold tracking-widest opacity-80">
                                        {myTeam.last_round_result === 'success' ? 'Great teamwork!' : 'Access Denied / Sequence Failed'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Stage - Bootstrap GRID LAYOUT */}
            <main className="flex-grow-1 d-flex align-items-center py-4 z-1">
                <Container>
                    <Row className="align-items-center gy-4">
                        {/* COL 1: TEAM INPUTS */}
                        <Col lg={4}>
                            <Card bg="dark" border="secondary" className="bg-opacity-25 backdrop-blur h-100">
                                <Card.Header className="bg-transparent border-secondary py-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <small className="fw-black text-info tracking-widest uppercase">Team Inputs</small>
                                        <Badge bg="secondary" pill className="opacity-50">IN</Badge>
                                    </div>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <div className="d-flex flex-column gap-3">
                                        {Object.entries(myTeam.players).map(([sid, p]) => {
                                            const isMe = sid === socket.id;
                                            return (
                                                <Card
                                                    key={sid}
                                                    bg="black"
                                                    border={p.has_not_gate ? "danger" : "secondary"}
                                                    className={`bg-opacity-50 border-opacity-25 transition-all ${p.has_not_gate ? 'shadow-sm' : ''}`}
                                                >
                                                    <Card.Body className="p-2">
                                                        <Row className="align-items-center g-2">
                                                            <Col xs="auto" className="text-center" style={{ width: '60px' }}>
                                                                <div className="fs-3 mb-0">{p.avatar}</div>
                                                                <div className={`fw-bold text-uppercase ${isMe ? 'text-info' : 'text-muted'}`} style={{ fontSize: '8px' }}>
                                                                    {isMe ? 'YOU' : p.name.split(' ')[0]}
                                                                </div>
                                                            </Col>

                                                            <Col className="text-center">
                                                                <div
                                                                    className={`p-2 rounded border-2 transition-all ${isMe && isPlaying && gameState.logic_mode === 'open' ? 'cursor-pointer hover:bg-dark' : ''}`}
                                                                    onClick={() => isMe && isPlaying && gameState.logic_mode === 'open' && toggleNotGate(p.sid)}
                                                                >
                                                                    {p.has_not_gate ? (
                                                                        <Badge bg="danger" className="w-100 py-2 border-2 border-light animate-pulse shadow-sm">
                                                                            <div className="fw-black">NOT</div>
                                                                            <div className="small opacity-75">ACTIVE</div>
                                                                        </Badge>
                                                                    ) : (
                                                                        <div className="p-2 border border-secondary border-dashed rounded opacity-50">
                                                                            {isMe && isPlaying && gameState.logic_mode === 'open' ? (
                                                                                <div className="text-info small fw-bold">+ NOT</div>
                                                                            ) : (
                                                                                <div className="text-muted small">—</div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </Col>

                                                            <Col xs="auto" className="text-center" style={{ width: '80px' }}>
                                                                <LogicCard
                                                                    value={p.card_value}
                                                                    hasNotGate={false}
                                                                    isWaiting={isWaiting}
                                                                />
                                                                <div className={`mt-1 fw-bold ${p.vote_value !== null ? 'text-success' : 'text-muted'}`} style={{ fontSize: '8px' }}>
                                                                    {p.vote_value !== null ? (isMe ? `VOTE: ${p.vote_value}` : 'READY') : 'PENDING'}
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
                        <Col lg={4} className="text-center position-relative">
                            <div className="position-absolute translate-middle top-50 start-50 w-100 h-100 bg-info opacity-10 rounded-circle blur-5 z-0" style={{ filter: 'blur(100px)' }}></div>
                            <div className="z-1 position-relative">
                                <LogicGate
                                    active={gateIsActive}
                                    type={myTeam.current_gate || 'AND'}
                                    inputs={Object.keys(myTeam.players).length}
                                />
                                <div className="mt-4">
                                    <Badge bg="dark" className="p-2 border border-secondary text-info fw-black tracking-widest text-uppercase">
                                        Logic Processing Unit
                                    </Badge>
                                </div>
                            </div>
                        </Col>

                        {/* COL 3: OUTPUT & CONTROLS */}
                        <Col lg={4}>
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
                                                            className="w-100 py-3 fw-bold border-2"
                                                        >
                                                            💤 VOTE 0
                                                        </Button>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <Button
                                                            variant={voteValue === 1 ? "info" : "outline-info"}
                                                            onClick={() => castVote(voteValue === 1 ? null : 1)}
                                                            className="w-100 py-3 fw-bold border-2"
                                                        >
                                                            ⚡ VOTE 1
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
                                                <div style={{ fontSize: '9px' }}>
                                                    {votes.length < totalPlayers ? (
                                                        <span className="text-secondary">Awaiting team ({votes.length}/{totalPlayers})</span>
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
                                                                {Object.entries(team.players).map(([sid, p]) => (
                                                                    <Button
                                                                        key={sid}
                                                                        size="sm"
                                                                        variant={p.has_not_gate ? "danger" : (canApplyNot ? "outline-warning" : "outline-secondary")}
                                                                        disabled={!canApplyNot}
                                                                        onClick={() => toggleNotGate(sid)}
                                                                        className="flex-fill fs-xs py-1"
                                                                    >
                                                                        {p.avatar} {p.has_not_gate ? 'NOT' : 'SABOTAGE'}
                                                                    </Button>
                                                                ))}
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


        </div>
    );
};

export default GameArena;
