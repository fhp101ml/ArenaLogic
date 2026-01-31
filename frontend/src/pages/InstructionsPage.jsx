import React from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';

const InstructionsPage = () => {
    const goBack = () => {
        window.history.back();
    };

    return (
        <div className="min-vh-100 py-5 bg-dark text-white overflow-auto font-sans">
            <Container>
                {/* Navigation */}
                <Button
                    variant="outline-info"
                    onClick={goBack}
                    className="mb-4 px-4 py-2 fw-bold border-2 transition-all d-flex align-items-center gap-2"
                >
                    ← Back to Game
                </Button>

                {/* Main Instruction Card */}
                <Card bg="dark" border="info" className="shadow-lg border-2 bg-opacity-10 backdrop-blur overflow-hidden">
                    <Card.Header className="bg-info bg-opacity-10 py-5 text-center border-bottom border-info border-opacity-25">
                        <h1 className="display-4 fw-black mb-0 text-info tracking-tighter uppercase">
                            🎮 Game Instructions
                        </h1>
                        <p className="lead text-info opacity-75 mt-2 fw-bold tracking-widest">LOGIC_ARENA_PROTOCOL_v2.0</p>
                    </Card.Header>

                    <Card.Body className="p-4 p-md-5">
                        {/* Objetivo Section */}
                        <section className="mb-5">
                            <h2 className="h3 fw-black text-info border-start border-4 border-info ps-3 mb-4 uppercase">
                                🎯 Objetivo
                            </h2>
                            <p className="fs-5 opacity-75">
                                Coordina con tu equipo para manipular la unidad lógica y superar las secuencias de seguridad.
                                Dependiendo del <Badge bg="info" text="dark">HACK MODE</Badge>, deberéis predecir el resultado o forzar la apertura del sistema.
                            </p>
                        </section>

                        {/* Modos de Juego */}
                        <Row className="mb-5 g-4">
                            <Col md={6}>
                                <Card bg="primary" className="bg-opacity-10 border-primary h-100">
                                    <Card.Body>
                                        <h3 className="h4 fw-black text-primary mb-3 uppercase">🔮 Mode: Predict</h3>
                                        <p className="small opacity-75 mb-0">
                                            Analizad vuestras cartas y los <strong>NOT</strong> activos en vuestro equipo.
                                            Votad el resultado final esperado (0 o 1).
                                            <strong> El consenso debe coincidir con la realidad para el éxito.</strong>
                                        </p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card bg="success" className="bg-opacity-10 border-success h-100">
                                    <Card.Body>
                                        <h3 className="h4 fw-black text-success mb-3 uppercase">🚀 Mode: Force Open</h3>
                                        <p className="small opacity-75 mb-0">
                                            Manipulad vuestros canales usando puertas <strong>NOT</strong> para forzar que la salida final sea <strong>1</strong> (OPEN).
                                            Pulsad <strong>CONFIRM</strong> para habilitar el <strong>OVERRIDE</strong>.
                                        </p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Logic Gate Reference */}
                        <section className="mb-5">
                            <div className="d-flex justify-content-between align-items-end mb-4 border-bottom border-secondary pb-2">
                                <h2 className="h4 fw-black text-info mb-0 uppercase tracking-widest">
                                    📚 Referencia de Puertas
                                </h2>
                                <small className="text-muted fw-bold">TRUTH_TABLE_REF</small>
                            </div>

                            <Row className="g-3">
                                {[
                                    { name: 'AND (Y)', sym: '&&', desc: '1 y 1 → 1', sub: 'Solo activa si AMBOS son 1.', color: 'info', xp: '+2 XP' },
                                    { name: 'OR (O)', sym: '||', desc: 'Si hay algún 1 → 1', sub: 'Activa si al menos uno es 1.', color: 'info', xp: '+1 XP' },
                                    { name: 'XOR', sym: '!=', desc: 'Diferentes (0,1) → 1', sub: 'Solo activa si son distintos.', color: 'info', xp: '+3 XP' },
                                    { name: 'NAND', sym: '!&', desc: 'Inverso de AND', sub: '1 y 1 → 0, resto → 1', color: 'warning', xp: '+2 XP' },
                                    { name: 'NOR', sym: '!|', desc: 'Inverso de OR', sub: '0 o 0 → 1, resto → 0', color: 'warning', xp: '+3 XP' },
                                    { name: 'NOT', sym: '!', desc: 'Inversor (0→1 | 1→0)', sub: 'Invierte el valor del canal.', color: 'danger' }
                                ].map(gate => (
                                    <Col lg={4} md={6} key={gate.name}>
                                        <Card bg="black" border={gate.color} className="bg-opacity-50 border-opacity-25 h-100 hover-info transition-all">
                                            <Card.Body className="p-3 text-center">
                                                <div className={`h5 fw-bold text-${gate.color} mb-2 d-flex justify-content-between align-items-center`}>
                                                    <span>{gate.name}</span>
                                                    <div className="d-flex gap-2">
                                                        {gate.xp && <span className="x-small text-emerald-400 fw-black">{gate.xp}</span>}
                                                        <Badge bg={gate.color} text="dark" className="fs-6">{gate.sym}</Badge>
                                                    </div>
                                                </div>
                                                <div className="fw-black fs-5 text-white mb-1">{gate.desc}</div>
                                                <small className="opacity-75 italic">{gate.sub}</small>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </section>

                        {/* Security Protocols */}
                        <Card bg="danger" className="bg-opacity-10 border-danger border-opacity-25 mb-5 overflow-hidden">
                            <Card.Header className="bg-danger bg-opacity-10 py-3 border-bottom border-danger border-opacity-25">
                                <h2 className="h5 mb-0 fw-black text-danger uppercase tracking-widest text-center">
                                    ⚠️ Protocolos de Seguridad
                                </h2>
                            </Card.Header>
                            <Card.Body className="p-4">
                                <Row className="gy-4">
                                    <Col md={6}>
                                        <div className="d-flex gap-3">
                                            <div className="fs-1 text-info">🕵️</div>
                                            <div>
                                                <div className="fw-bold text-light h5">VOTACIÓN PRIVADA</div>
                                                <p className="small opacity-75 mb-0">Votos individuales ocultos. Solo aparece el estado "LISTO". Se requiere coordinación táctica verbal.</p>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="d-flex gap-3">
                                            <div className="fs-1 text-warning">👥</div>
                                            <div>
                                                <div className="fw-bold text-light h5">PARTICIPACIÓN TOTAL</div>
                                                <p className="small opacity-75 mb-0">La inacción de un solo miembro resulta en un <span className="text-danger fw-black">FAILED</span> inmediato. No hay segundas oportunidades.</p>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Strategy Tips */}
                        <section>
                            <h2 className="h4 fw-black text-warning mb-4 uppercase tracking-widest border-start border-4 border-warning ps-3">
                                💡 Estrategia Avanzada
                            </h2>
                            <ul className="list-unstyled space-y-3 fs-5 opacity-75">
                                <li className="mb-2">🔹 Puedes <span className="text-warning fw-bold">CANCELAR</span> tu acción si detectas sabotaje enemigo antes del fin de secuencia.</li>
                                <li className="mb-2">🔹 En <span className="text-success fw-bold">FORCE OPEN</span>, designad roles para invertir bits específicos de forma eficiente.</li>
                                <li className="mb-2">🔹 En los últimos <span className="text-danger fw-bold">5 SEGUNDOS</span>, los sistemas de sabotaje se bloquean. Actúa rápido.</li>
                            </ul>
                        </section>
                    </Card.Body>
                </Card>
            </Container>

            <style dangerouslySetInnerHTML={{
                __html: `
                .hover-info:hover { border-color: rgba(13, 202, 240, 0.5) !important; background: rgba(0,0,0,0.8) !important; }
                .space-y-3 > li { margin-bottom: 1rem; }
            `}} />
        </div>
    );
};

export default InstructionsPage;
