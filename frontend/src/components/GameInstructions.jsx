import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GameInstructions = ({ isOpen: externalIsOpen, onClose, showButton = true }) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);

    // Use external control if provided, otherwise use internal state
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            setInternalIsOpen(false);
        }
    };
    const handleOpen = () => setInternalIsOpen(true);

    return (
        <>
            {/* Floating Help Button - only show if showButton is true */}
            {showButton && (
                <button
                    onClick={handleOpen}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-110 flex items-center justify-center text-2xl group"
                    title="Game Instructions"
                >
                    <span className="group-hover:rotate-12 transition-transform">❓</span>
                </button>
            )}

            {/* Instructions Modal - FULL SCREEN OVERLAY */}
            <AnimatePresence>
                {isOpen && (
                    <div
                        className="fixed inset-0 z-[5000]"
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5000 }}
                    >
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: '#000',
                                zIndex: 5000
                            }}
                        />

                        {/* Modal Content - CENTERED */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '2rem',
                                zIndex: 5001
                            }}
                        >
                            <div
                                style={{
                                    background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                                    border: '3px solid #22d3ee',
                                    borderRadius: '1.5rem',
                                    boxShadow: '0 0 60px rgba(34, 211, 238, 0.4), 0 0 120px rgba(34, 211, 238, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                                    maxWidth: '800px',
                                    width: '100%',
                                    maxHeight: '90vh',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                {/* Header - PREMIUM DESIGN */}
                                <div
                                    style={{
                                        background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #164e63 100%)',
                                        padding: '1.5rem 2rem',
                                        borderBottom: '2px solid rgba(34, 211, 238, 0.5)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Animated scan line effect */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: '-100%',
                                        width: '200%',
                                        height: '100%',
                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                                        animation: 'scan 3s linear infinite'
                                    }} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                                        <div>
                                            <h2 style={{
                                                fontSize: '2rem',
                                                fontWeight: 900,
                                                background: 'linear-gradient(135deg, #67e8f9, #22d3ee, #06b6d4)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                textShadow: '0 0 30px rgba(34, 211, 238, 0.5)',
                                                marginBottom: '0.25rem'
                                            }}>
                                                🎮 GAME PROTOCOLS
                                            </h2>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                                                CORE_LOGIC_MANUAL_v2.0
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleClose}
                                            style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                                border: '2px solid #fca5a5',
                                                color: 'white',
                                                fontSize: '1.25rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                {/* Content - SCROLLABLE */}
                                <div style={{
                                    padding: '2rem',
                                    overflowY: 'auto',
                                    flex: 1,
                                    background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)'
                                }}>
                                    {/* 🎯 Objetivo */}
                                    <section style={{ marginBottom: '2rem' }}>
                                        <h3 style={{
                                            fontSize: '1.25rem',
                                            fontWeight: 700,
                                            color: '#22d3ee',
                                            marginBottom: '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            textShadow: '0 0 10px rgba(34, 211, 238, 0.5)'
                                        }}>
                                            🎯 OBJETIVO
                                        </h3>
                                        <p style={{ color: '#cbd5e1', lineHeight: 1.7 }}>
                                            Coordina con tu equipo para manipular la unidad lógica y superar las secuencias de seguridad.
                                            Dependiendo del <strong style={{ color: '#fbbf24' }}>HACK MODE</strong>, deberéis predecir el resultado o forzar la apertura del sistema.
                                        </p>
                                    </section>

                                    {/* 🕹️ Modos de Juego */}
                                    <section style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                        gap: '1rem',
                                        marginBottom: '2rem'
                                    }}>
                                        <div style={{
                                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1))',
                                            padding: '1.5rem',
                                            borderRadius: '1rem',
                                            border: '2px solid rgba(59, 130, 246, 0.4)',
                                            boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)'
                                        }}>
                                            <h4 style={{ fontWeight: 900, color: '#60a5fa', marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>
                                                🔮 MODE: PREDICT
                                            </h4>
                                            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6 }}>
                                                Analizad vuestras cartas y los <strong style={{ color: '#f97316' }}>NOT</strong> activos.
                                                Todos debéis votar (0 o 1) lo que creáis que será la salida final de la puerta.
                                                <strong style={{ color: '#22d3ee' }}> El voto del equipo debe coincidir con la realidad para ganar.</strong>
                                            </p>
                                        </div>
                                        <div style={{
                                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))',
                                            padding: '1.5rem',
                                            borderRadius: '1rem',
                                            border: '2px solid rgba(16, 185, 129, 0.4)',
                                            boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
                                        }}>
                                            <h4 style={{ fontWeight: 900, color: '#34d399', marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>
                                                🚀 MODE: FORCE OPEN
                                            </h4>
                                            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6 }}>
                                                Manipulad vuestras entradas usando puertas <strong style={{ color: '#f97316' }}>NOT</strong> para forzar que la salida de la puerta sea <strong style={{ color: '#22d3ee' }}>1</strong> (OPEN).
                                                Todos debéis pulsar <strong>CONFIRM</strong> antes de intentar el <strong>OVERRIDE</strong>.
                                            </p>
                                        </div>
                                    </section>

                                    {/* ⚡ Referencia de Puertas Lógicas */}
                                    <section style={{
                                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
                                        padding: '1.5rem',
                                        borderRadius: '1rem',
                                        border: '1px solid rgba(34, 211, 238, 0.3)',
                                        marginBottom: '2rem'
                                    }}>
                                        <h3 style={{
                                            fontSize: '0.875rem',
                                            fontWeight: 900,
                                            color: '#22d3ee',
                                            marginBottom: '1rem',
                                            letterSpacing: '0.15em',
                                            textTransform: 'uppercase',
                                            borderBottom: '1px solid rgba(34, 211, 238, 0.2)',
                                            paddingBottom: '0.5rem',
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span>📚 REFERENCIA DE PUERTAS</span>
                                            <span style={{ fontSize: '0.625rem', color: '#64748b' }}>FORMATO: A | B = RESULTADO</span>
                                        </h3>

                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                            gap: '0.75rem'
                                        }}>
                                            {[
                                                { name: 'AND (Y)', desc: '1 y 1 = 1', sub: 'Solo 1 si todo es 1', xp: '+2', color: '#22d3ee' },
                                                { name: 'OR (O)', desc: '0 o 1 = 1', sub: '1 si hay algún 1', xp: '+1', color: '#22d3ee' },
                                                { name: 'XOR', desc: '1 ≠ 0 = 1', sub: '1 solo si distintos', xp: '+3', color: '#22d3ee' },
                                                { name: 'NAND', desc: '¬AND', sub: 'Inverso de AND', xp: '+2', color: '#f87171' },
                                                { name: 'NOR', desc: '¬OR', sub: 'Inverso de OR', xp: '+3', color: '#f87171' },
                                                { name: 'NOT', desc: '0→1 | 1→0', sub: 'Invierte valor', xp: '-', color: '#fb923c' },
                                            ].map(gate => (
                                                <div key={gate.name} style={{
                                                    background: 'rgba(0,0,0,0.4)',
                                                    padding: '0.75rem',
                                                    borderRadius: '0.5rem',
                                                    border: '1px solid rgba(100, 116, 139, 0.3)'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                        <span style={{ fontWeight: 700, color: gate.color, fontSize: '0.75rem' }}>{gate.name}</span>
                                                        <span style={{ color: '#34d399', fontSize: '0.625rem' }}>{gate.xp} XP</span>
                                                    </div>
                                                    <p style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>{gate.desc}</p>
                                                    <p style={{ color: '#64748b', fontSize: '0.625rem', fontStyle: 'italic' }}>{gate.sub}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* ⚠️ Protocolos */}
                                    <section style={{
                                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(185, 28, 28, 0.05))',
                                        padding: '1.5rem',
                                        borderRadius: '1rem',
                                        border: '1px solid rgba(239, 68, 68, 0.3)'
                                    }}>
                                        <h3 style={{ fontSize: '0.875rem', fontWeight: 900, color: '#f87171', marginBottom: '1rem', letterSpacing: '0.15em' }}>
                                            ⚠️ PROTOCOLOS DE SEGURIDAD
                                        </h3>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                <span style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    background: 'rgba(34, 211, 238, 0.1)',
                                                    borderRadius: '0.5rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>🕵️</span>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.875rem' }}>VOTACIÓN PRIVADA</div>
                                                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No puedes ver el voto exacto de tus compañeros hasta el final. ¡Comunicación verbal clave!</div>
                                                </div>
                                            </li>
                                            <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                <span style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    background: 'rgba(251, 146, 60, 0.1)',
                                                    borderRadius: '0.5rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>👥</span>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.875rem' }}>PARTICIPACIÓN TOTAL</div>
                                                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Si alguien no vota antes del tiempo, la ronda se marca como <strong style={{ color: '#f87171' }}>FAILED</strong>.</div>
                                                </div>
                                            </li>
                                        </ul>
                                    </section>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes scan {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(50%); }
                }
            `}</style>
        </>
    );
};

export default GameInstructions;
