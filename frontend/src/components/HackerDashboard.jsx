import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, Row, Col, Card, Button, Form, Badge, ProgressBar, InputGroup } from 'react-bootstrap';

const HackerDashboard = ({ gameState, onStartRound, onToggleNot, onKickPlayer, onSetGameMode, onSetTargetGate, onSetTargetGates, onSetLogicMode, onResetScores }) => {
    const [roundDuration, setRoundDuration] = React.useState(30);
    const [timeLeft, setTimeLeft] = React.useState(0);

    // Initialize timer when round starts
    React.useEffect(() => {
        if (gameState?.state === 'PLAYING' && gameState?.timer > 0) {
            setTimeLeft(Math.ceil(gameState.timer));
        } else if (gameState?.state !== 'PLAYING') {
            setTimeLeft(0);
        }
    }, [gameState?.state]);

    // Countdown independently every second
    React.useEffect(() => {
        if (timeLeft > 0) {
            const interval = setInterval(() => {
                setTimeLeft(prev => Math.max(0, prev - 1));
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [timeLeft]);

    return (
        <div className="min-vh-100 bg-black text-success font-monospace p-4 overflow-auto">
            <Container fluid className="max-w-7xl">
                {/* Header Section */}
                <Card bg="black" border="success" className="mb-4 border-opacity-50 shadow-lg bg-opacity-75 backdrop-blur">
                    <Card.Body className="p-4 d-flex justify-content-between align-items-end flex-wrap gap-3">
                        <div>
                            <h1 className="display-6 fw-black mb-0 tracking-tighter text-success shadow-sm">
                                <span className="text-white opacity-25">#</span> OPERATOR_TERMINAL
                            </h1>
                            <div className="d-flex align-items-center gap-2 mt-1">
                                <div className="rounded-circle bg-success animate-pulse" style={{ width: '8px', height: '8px' }}></div>
                                <small className="text-success fw-bold opacity-75">SYSTEM_STATUS: ONLINE</small>
                            </div>
                        </div>
                        <div className="text-end">
                            <Badge bg="success" text="dark" className="fs-6 font-monospace mb-2 shadow">
                                SESSION: {gameState.id}
                            </Badge>
                            {gameState.state === 'PLAYING' && (
                                <div className="display-4 fw-black text-success animate-pulse">
                                    {timeLeft}s
                                </div>
                            )}
                        </div>
                    </Card.Body>
                </Card>

                <Row className="gy-4">
                    {/* Control Panel Column */}
                    <Col lg={4}>
                        <Card bg="black" border="success" className="h-100 border-opacity-25 bg-opacity-50 shadow">
                            <Card.Header className="bg-transparent border-success border-opacity-25 py-3">
                                <h5 className="mb-0 fw-black text-success tracking-widest text-uppercase">
                                    <span className="opacity-50">&gt;</span> Round Control
                                </h5>
                            </Card.Header>
                            <Card.Body className="p-4 d-flex flex-column gap-4">
                                {/* Game Mode Selection */}
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-success opacity-75">GAME_MODE</Form.Label>
                                    <Form.Select
                                        bg="black"
                                        className="bg-black text-success border-success border-opacity-50 font-monospace"
                                        value={gameState.game_mode || 'competitive'}
                                        onChange={(e) => onSetGameMode?.(e.target.value)}
                                        disabled={gameState.state === 'PLAYING'}
                                    >
                                        <option value="competitive">COMPETITIVE</option>
                                        <option value="asymmetric">ASYMMETRIC</option>
                                        <option value="campaign">CAMPAIGN</option>
                                    </Form.Select>
                                    <Form.Text className="text-success opacity-50 x-small mt-1 d-block">
                                        Round #{gameState.round_number || 0} | {
                                            gameState.game_mode === 'competitive' ? 'Single gate challenge' :
                                                gameState.game_mode === 'asymmetric' ? 'Independent rotation' :
                                                    'Dynamic gate sequence'
                                        }
                                    </Form.Text>
                                </Form.Group>

                                {/* Mission Objective Selection */}
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-success opacity-75">OBJECTIVE_PROTOCOL</Form.Label>
                                    <Form.Select
                                        className="bg-black text-success border-success border-opacity-50 font-monospace"
                                        value={gameState.logic_mode || 'predict'}
                                        onChange={(e) => onSetLogicMode?.(e.target.value)}
                                        disabled={gameState.state === 'PLAYING'}
                                    >
                                        <option value="predict">PREDICT_OUTPUT (0|1)</option>
                                        <option value="open">FORCE_OVERRIDE (OUT=1)</option>
                                    </Form.Select>
                                    <Form.Text className="text-success opacity-50 x-small mt-1 d-block">
                                        {(gameState.logic_mode || 'predict') === 'predict'
                                            ? 'Validate final logical state.'
                                            : 'Manipulate inputs for gate penetration.'}
                                    </Form.Text>
                                </Form.Group>

                                {/* Target Gate Selection (Competitive Mode - SINGLE) */}
                                {gameState.game_mode === 'competitive' && (
                                    <Form.Group>
                                        <div className="d-flex justify-content-between mb-2">
                                            <Form.Label className="small fw-bold text-success opacity-75">TARGET_GATE</Form.Label>
                                            <Badge bg="info" text="dark" className="x-small">SINGLE</Badge>
                                        </div>
                                        <div className="d-flex flex-wrap gap-2">
                                            {['AND', 'OR', 'XOR', 'XNOR', 'NAND', 'NOR'].map(gate => {
                                                const isSelected = gameState.target_gate === gate;
                                                return (
                                                    <Button
                                                        key={gate}
                                                        size="sm"
                                                        variant={isSelected ? "info" : "outline-info"}
                                                        className={`x-small fw-black transition-all ${isSelected ? 'shadow-sm' : 'opacity-50'}`}
                                                        onClick={() => onSetTargetGate?.(gate)}
                                                        disabled={gameState.state === 'PLAYING'}
                                                    >
                                                        {gate}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                        <Form.Text className="text-success opacity-50 x-small mt-1 d-block">
                                            Select the logic gate for the next round.
                                        </Form.Text>
                                    </Form.Group>
                                )}

                                {/* Target Sequence Selection (Campaign Mode - MULTI) */}
                                {gameState.game_mode === 'campaign' && (
                                    <Form.Group>
                                        <div className="d-flex justify-content-between mb-2">
                                            <Form.Label className="small fw-bold text-success opacity-75">GATE_SEQUENCE</Form.Label>
                                            <Badge bg="success" text="dark" className="x-small">CYCLE</Badge>
                                        </div>
                                        <div className="d-flex flex-wrap gap-2">
                                            {['AND', 'OR', 'XOR', 'XNOR', 'NAND', 'NOR'].map(gate => {
                                                const isSelected = gameState.target_gates?.includes(gate);
                                                return (
                                                    <Button
                                                        key={gate}
                                                        size="sm"
                                                        variant={isSelected ? "success" : "outline-success"}
                                                        className={`x-small fw-black transition-all ${isSelected ? 'shadow-sm' : 'opacity-50'}`}
                                                        onClick={() => {
                                                            let newGates = [...(gameState.target_gates || [])];
                                                            if (isSelected) {
                                                                if (newGates.length > 1) {
                                                                    newGates = newGates.filter(g => g !== gate);
                                                                }
                                                            } else {
                                                                newGates.push(gate);
                                                            }
                                                            onSetTargetGates?.(newGates);
                                                        }}
                                                        disabled={gameState.state === 'PLAYING'}
                                                    >
                                                        {gate}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                        <Form.Text className="text-success opacity-50 x-small mt-1 d-block">
                                            Gates will rotate each round in the selected sequence.
                                        </Form.Text>
                                    </Form.Group>
                                )}

                                {/* Duration Control */}
                                <Form.Group>
                                    <div className="d-flex justify-content-between mb-2">
                                        <Form.Label className="small fw-bold text-success opacity-75">SEQUENCE_TIME</Form.Label>
                                        <span className="text-success fw-black">{roundDuration}s</span>
                                    </div>
                                    <Form.Range
                                        min={5} max={60} step={5}
                                        value={roundDuration}
                                        onChange={(e) => setRoundDuration(Number(e.target.value))}
                                        disabled={gameState.state === 'PLAYING'}
                                        className="accent-success"
                                    />
                                </Form.Group>

                                {/* Status Card */}
                                <Card bg="black" border="success" className="border-opacity-10 bg-opacity-25 mt-auto">
                                    <Card.Body className="p-3 d-flex justify-content-between align-items-center">
                                        <span className="small opacity-75 uppercase">Current State</span>
                                        <Badge bg={gameState.state === 'PLAYING' ? "success" : "danger"} text="dark" className="px-3 py-2 fw-black">
                                            {gameState.state}
                                        </Badge>
                                    </Card.Body>
                                </Card>

                                {/* Action Button */}
                                {gameState.state !== 'PLAYING' ? (
                                    <Button
                                        variant="success"
                                        size="lg"
                                        onClick={() => onStartRound(roundDuration)}
                                        className="py-3 shadow-lg fw-black tracking-widest text-uppercase border-2 border-dark"
                                    >
                                        Initiate Sequence
                                    </Button>
                                ) : (
                                    <Button variant="outline-success" disabled className="py-3 fw-bold opacity-50 border-dashed">
                                        Sequence Active...
                                    </Button>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Team Metrics Column */}
                    <Col lg={8}>
                        <Row className="gy-4">
                            {Object.values(gameState.teams).map(team => (
                                <Col md={6} key={team.id}>
                                    <Card bg="black" border={team.id === 'A' ? "success" : "info"} className="h-100 border-opacity-25 bg-opacity-50">
                                        <Card.Header className={`bg-transparent border-opacity-25 py-3 d-flex justify-content-between align-items-center ${team.id === 'A' ? 'border-success' : 'border-info'}`}>
                                            <h5 className={`mb-0 fw-black tracking-widest text-uppercase ${team.id === 'A' ? 'text-success' : 'text-info'}`}>
                                                {team.id === 'A' ? 'Alpha' : 'Beta'} Unit
                                            </h5>
                                            <Badge bg={team.solved ? "success" : "secondary"} text="dark" pill>
                                                {team.solved ? 'SOLVED' : 'ACTIVE'}
                                            </Badge>
                                        </Card.Header>
                                        <Card.Body className="p-4">
                                            <Row className="mb-4 g-3">
                                                <Col xs={6}>
                                                    <div className="p-3 bg-black border border-success border-opacity-10 rounded">
                                                        <div className="x-small text-success opacity-50 mb-1">SCORE</div>
                                                        <div className="h2 mb-0 fw-black text-white">{team.score}</div>
                                                    </div>
                                                </Col>
                                                <Col xs={6}>
                                                    <div className="p-3 bg-black border border-success border-opacity-10 rounded">
                                                        <div className="x-small text-success opacity-50 mb-1">STABILITY</div>
                                                        <div className="h4 mb-0 fw-bold">{team.solved ? '100%' : 'WAITING'}</div>
                                                    </div>
                                                </Col>
                                            </Row>

                                            <div className="d-flex flex-column gap-2">
                                                <div className="x-small text-success opacity-50 fw-bold mb-2 uppercase tracking-widest">
                                                    Manual Override / Hazards
                                                </div>
                                                {Object.entries(team.players).map(([sid, p]) => (
                                                    <Card key={sid} bg="black" className="border-success border-opacity-10 hover-border-opacity-50 transition-all">
                                                        <Card.Body className="p-2 d-flex justify-content-between align-items-center">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <span className="fs-4">{p.avatar}</span>
                                                                <div>
                                                                    <div className="small fw-bold text-white truncate" style={{ maxWidth: '80px' }}>{p.name}</div>
                                                                    <div className="x-small text-success opacity-50">ID: {sid.slice(0, 4)}</div>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-danger"
                                                                    className="p-0 border-0 x-small fw-black opacity-50 hover-opacity-100"
                                                                    onClick={() => onKickPlayer(sid)}
                                                                >
                                                                    [KICK]
                                                                </Button>
                                                            </div>
                                                            <Button
                                                                onClick={() => onToggleNot(sid)}
                                                                disabled={timeLeft > 0 && timeLeft <= 5}
                                                                variant={p.has_not_gate ? "danger" : "outline-success"}
                                                                size="sm"
                                                                className={`p-2 fw-black text-uppercase x-small border-2 ${p.has_not_gate ? 'shadow-sm animate-pulse' : ''}`}
                                                            >
                                                                {timeLeft > 0 && timeLeft <= 5 ? 'Time_Lock' : p.has_not_gate ? 'Hazard_On' : 'Apply_NOT'}
                                                            </Button>
                                                        </Card.Body>
                                                    </Card>
                                                ))}
                                            </div>
                                        </Card.Body>
                                        <Card.Footer className="bg-transparent border-top border-secondary border-opacity-10 p-3">
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                className="w-100 x-small fw-black text-uppercase opacity-50 hover-opacity-100"
                                                onClick={onResetScores}
                                                disabled={gameState.state === 'PLAYING'}
                                            >
                                                [ RESET_ALL_SCORES ]
                                            </Button>
                                        </Card.Footer>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Col>
                </Row>
            </Container>

            <style dangerouslySetInnerHTML={{
                __html: `
                .x-small { font-size: 0.65rem; }
                .accent-success::-webkit-slider-runnable-track { background: #19875422; border: 1px solid #19875455; border-radius: 10px; }
                .accent-success::-webkit-slider-thumb { background: #198754; border: 2px solid white; box-shadow: 0 0 10px #198754; }
                .hover-border-opacity-50:hover { border-color: rgba(25, 135, 84, 0.5) !important; }
                .btn-outline-success:hover { color: #000 !important; }
            `}} />
        </div>
    );
};

export default HackerDashboard;
