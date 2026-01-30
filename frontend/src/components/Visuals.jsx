import React from 'react';
import { motion } from 'framer-motion';

export const LogicGate = ({ active, type = "AND", inputs = 2 }) => {
    // Generate input pin positions dynamically
    const inputYPositions = Array.from({ length: inputs }, (_, i) => {
        if (inputs === 1) return [50];
        const step = 60 / (inputs - 1);
        return 20 + i * step;
    });

    return (
        <div className="position-relative d-flex align-items-center justify-content-center w-100 h-100" style={{ minHeight: '150px' }}>
            {/* Gate Shape (AND) */}
            <svg viewBox="0 0 100 100" className="w-100 h-100 overflow-visible" style={{ filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.5))' }}>
                {/* Inputs Pins */}
                {inputYPositions.map((y, idx) => (
                    <line key={idx} x1="-10" y1={y} x2="20" y2={y} stroke="#475569" strokeWidth="3" />
                ))}

                <motion.path
                    d="M 20 10 L 50 10 C 75 10 90 30 90 50 C 90 70 75 90 50 90 L 20 90 Z"
                    fill={active ? "#10b981" : "#1e293b"}
                    stroke={active ? "#34d399" : "#475569"}
                    strokeWidth="3"
                    animate={{
                        fill: active ? "#10b981" : "#1e293b",
                        filter: active ? "drop-shadow(0 0 10px #10b981)" : "drop-shadow(0 0 0px transparent)"
                    }}
                />

                {/* Output line */}
                <line x1="90" y1="50" x2="110" y2="50" stroke={active ? "#34d399" : "#475569"} strokeWidth="3" />

                <text x="45" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {type}
                </text>
            </svg>
        </div>
    );
};

export const Wire = ({ active }) => {
    return (
        <div className="flex-fill bg-secondary position-relative overflow-hidden rounded-pill mx-2" style={{ height: '4px' }}>
            <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: active ? "0%" : "-100%" }}
                transition={{ duration: 0.2 }}
                className="position-absolute inset-0 bg-info shadow-sm"
                style={{ top: 0, left: 0, right: 0, bottom: 0, boxShadow: '0 0 15px var(--bs-info)' }}
            />
            {active && (
                <motion.div
                    animate={{ x: ["0%", "200%"] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="position-absolute h-100 w-50 bg-white opacity-50"
                    style={{ top: 0, left: 0, background: 'linear-gradient(90deg, transparent, white, transparent)' }}
                />
            )}
        </div>
    )
}
