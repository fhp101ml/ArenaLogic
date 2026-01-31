import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GameInstructions = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Help Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-110 flex items-center justify-center text-2xl group"
                title="Game Instructions"
            >
                <span className="group-hover:rotate-12 transition-transform">❓</span>
            </button>

            {/* Instructions Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/95 z-50"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="bg-slate-950 border-2 border-cyan-500/50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
                                {/* Header */}
                                <div className="sticky top-0 bg-gradient-to-r from-cyan-900 to-blue-900 p-6 border-b-2 border-cyan-500/30">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                            🎮 GAME INSTRUCTIONS
                                        </h2>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors flex items-center justify-center text-xl"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-6">
                                    {/* 🎯 Objetivo */}
                                    <section>
                                        <h3 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
                                            🎯 OBJETIVO
                                        </h3>
                                        <p className="text-slate-300 leading-relaxed">
                                            Coordina con tu equipo para manipular la unidad lógica y superar las secuencias de seguridad.
                                            Dependiendo del <strong>HACK MODE</strong>, deberéis predecir el resultado o forzar la apertura del sistema.
                                        </p>
                                    </section>

                                    {/* 🕹️ Modos de Juego */}
                                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30">
                                            <h4 className="font-black text-blue-400 mb-2 uppercase tracking-tighter">🔮 MODE: PREDICT</h4>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                Analizad vuestras cartas y los <strong>NOT</strong> activos.
                                                Todos debéis votar (0 o 1) lo que creáis que será la salida final de la puerta.
                                                <strong> El voto del equipo debe coincidir con la realidad para ganar.</strong>
                                            </p>
                                        </div>
                                        <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30">
                                            <h4 className="font-black text-emerald-400 mb-2 uppercase tracking-tighter">🚀 MODE: FORCE OPEN</h4>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                Manipulad vuestras entradas usando puertas <strong>NOT</strong> para forzar que la salida de la puerta sea <strong>1</strong> (OPEN).
                                                Todos debéis pulsar <strong>CONFIRM</strong> antes de intentar el <strong>OVERRIDE</strong>.
                                            </p>
                                        </div>
                                    </section>

                                    {/* ⚡ Referencia de Puertas Lógicas */}
                                    <section className="bg-slate-900/40 p-5 rounded-xl border border-cyan-500/30">
                                        <h3 className="text-sm font-black text-cyan-400 mb-4 uppercase tracking-[0.2em] border-b border-cyan-500/10 pb-2 flex justify-between items-center">
                                            <span>📚 REFERENCIA DE PUERTAS</span>
                                            <span className="text-[10px] text-slate-500">FORMATO: A | B = RESULTADO</span>
                                        </h3>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px]">
                                            <div className="p-2 bg-black/40 rounded border border-slate-800">
                                                <div className="font-bold text-cyan-400 mb-1 flex justify-between">
                                                    <span>AND (Y)</span>
                                                    <span className="text-emerald-500 x-small">+2 XP</span>
                                                </div>
                                                <p className="text-slate-300">1 y 1 = 1</p>
                                                <p className="text-slate-300 italic">Solo 1 si todo es 1</p>
                                            </div>
                                            <div className="p-2 bg-black/40 rounded border border-slate-800">
                                                <div className="font-bold text-cyan-400 mb-1 flex justify-between">
                                                    <span>OR (O)</span>
                                                    <span className="text-emerald-500 x-small">+1 XP</span>
                                                </div>
                                                <p className="text-slate-300">0 o 1 = 1 | 1 o 1 = 1</p>
                                                <p className="text-slate-300 italic">1 si hay algún 1</p>
                                            </div>
                                            <div className="p-2 bg-black/40 rounded border border-slate-800">
                                                <div className="font-bold text-cyan-400 mb-1 flex justify-between">
                                                    <span>XOR</span>
                                                    <span className="text-emerald-500 x-small">+3 XP</span>
                                                </div>
                                                <p className="text-slate-300">1 o 0 = 1 | 1 o 1 = 0</p>
                                                <p className="text-slate-300 italic">1 solo si son distintos</p>
                                            </div>
                                            <div className="p-2 bg-black/40 rounded border border-slate-800">
                                                <div className="font-bold text-red-400 mb-1 flex justify-between">
                                                    <span>NAND</span>
                                                    <span className="text-emerald-500 x-small">+2 XP</span>
                                                </div>
                                                <p className="text-slate-300 italic">Inverso de AND</p>
                                            </div>
                                            <div className="p-2 bg-black/40 rounded border border-slate-800">
                                                <div className="font-bold text-red-400 mb-1 flex justify-between">
                                                    <span>NOR</span>
                                                    <span className="text-emerald-500 x-small">+3 XP</span>
                                                </div>
                                                <p className="text-slate-300 italic">Inverso de OR</p>
                                            </div>
                                            <div className="p-2 bg-cyan-900/20 rounded border border-cyan-500/30">
                                                <div className="font-bold text-orange-400 mb-1">NOT (Inversor)</div>
                                                <p className="text-slate-300 italic">Invierte el valor: 0→1 | 1→0</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* ⚠️ Protocolos de Seguridad */}
                                    <section className="bg-slate-900/50 p-4 rounded-xl border border-red-500/20">
                                        <h3 className="text-sm font-black text-red-400 mb-4 uppercase tracking-[0.2em] border-b border-red-500/10 pb-2">
                                            ⚠️ PROTOCOLOS DE SEGURIDAD
                                        </h3>
                                        <ul className="space-y-4">
                                            <li className="flex gap-4">
                                                <div className="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center flex-shrink-0 text-cyan-400">🕵️</div>
                                                <div>
                                                    <div className="font-bold text-slate-200 text-sm italic">VOTACIÓN PRIVADA</div>
                                                    <div className="text-xs text-slate-400">No puedes ver el voto exacto de tus compañeros hasta el final. ¡La comunicación verbal es vital!</div>
                                                </div>
                                            </li>
                                            <li className="flex gap-4">
                                                <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center flex-shrink-0 text-orange-400">👥</div>
                                                <div>
                                                    <div className="font-bold text-slate-200 text-sm">PARTICIPACIÓN TOTAL</div>
                                                    <div className="text-xs text-slate-400">Si un solo miembro no vota antes de acabar el tiempo, la ronda se marca como <strong>FAILED</strong> automáticamente.</div>
                                                </div>
                                            </li>
                                        </ul>
                                    </section>

                                    {/* 💡 Estrategia */}
                                    <section>
                                        <h3 className="text-xl font-bold text-purple-400 mb-3 flex items-center gap-2">
                                            💡 ESTRATEGIA
                                        </h3>
                                        <ul className="space-y-2 text-xs text-slate-400">
                                            <li className="flex gap-2">
                                                <span className="text-purple-400">•</span>
                                                <span>Puedes rectificar tu voto o confirmación pulsando el botón otra vez mientras el tiempo corre.</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-purple-400">•</span>
                                                <span>Si el rival os sabotea el éxito se anula; debéis reaccionar y volver a votar.</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-purple-400">•</span>
                                                <span>En <strong>FORCE OPEN</strong>, repartíos quién activa los NOT para ser más rápidos.</span>
                                            </li>
                                        </ul>
                                    </section>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default GameInstructions;
