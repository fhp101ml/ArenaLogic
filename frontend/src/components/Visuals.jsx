import React from 'react';
import { motion } from 'framer-motion';

const GatePaths = {
    AND: (active) => (
        <motion.path
            d="M 25 20 L 50 20 C 75 20 85 50 85 50 C 85 50 75 80 50 80 L 25 80 Z"
            fill={active ? "#10b981" : "#1e293b"}
            stroke={active ? "#34d399" : "#475569"}
            strokeWidth="3"
            animate={{ fill: active ? "#10b981" : "#1e293b", filter: active ? "drop-shadow(0 0 10px #10b981)" : "none" }}
        />
    ),
    NAND: (active) => (
        <>
            <motion.path
                d="M 25 20 L 50 20 C 75 20 85 50 85 50 C 85 50 75 80 50 80 L 25 80 Z"
                fill={active ? "#10b981" : "#1e293b"}
                stroke={active ? "#34d399" : "#475569"}
                strokeWidth="3"
                animate={{ fill: active ? "#10b981" : "#1e293b", filter: active ? "drop-shadow(0 0 10px #10b981)" : "none" }}
            />
            <circle cx="91" cy="50" r="6" fill="#1e293b" stroke={active ? "#34d399" : "#475569"} strokeWidth="3" />
        </>
    ),
    OR: (active) => (
        <motion.path
            d="M 25 20 C 40 20 50 40 50 50 C 50 60 40 80 25 80 C 55 80 85 60 90 50 C 85 40 55 20 25 20 Z"
            fill={active ? "#10b981" : "#1e293b"}
            stroke={active ? "#34d399" : "#475569"}
            strokeWidth="3"
            animate={{ fill: active ? "#10b981" : "#1e293b", filter: active ? "drop-shadow(0 0 10px #10b981)" : "none" }}
        />
    ),
    NOR: (active) => (
        <>
            <motion.path
                d="M 25 20 C 40 20 50 40 50 50 C 50 60 40 80 25 80 C 55 80 85 60 90 50 C 85 40 55 20 25 20 Z"
                fill={active ? "#10b981" : "#1e293b"}
                stroke={active ? "#34d399" : "#475569"}
                strokeWidth="3"
                animate={{ fill: active ? "#10b981" : "#1e293b", filter: active ? "drop-shadow(0 0 10px #10b981)" : "none" }}
            />
            <circle cx="96" cy="50" r="6" fill="#1e293b" stroke={active ? "#34d399" : "#475569"} strokeWidth="3" />
        </>
    ),
    XOR: (active) => (
        <>
            <path d="M 15 20 C 30 20 40 40 40 50 C 40 60 30 80 15 80" stroke={active ? "#34d399" : "#475569"} strokeWidth="3" fill="none" />
            <motion.path
                d="M 28 20 C 43 20 53 40 53 50 C 53 60 43 80 28 80 C 58 80 88 60 93 50 C 88 40 58 20 28 20 Z"
                fill={active ? "#10b981" : "#1e293b"}
                stroke={active ? "#34d399" : "#475569"}
                strokeWidth="3"
                animate={{ fill: active ? "#10b981" : "#1e293b", filter: active ? "drop-shadow(0 0 10px #10b981)" : "none" }}
            />
        </>
    ),
    XNOR: (active) => (
        <>
            <path d="M 15 20 C 30 20 40 40 40 50 C 40 60 30 80 15 80" stroke={active ? "#34d399" : "#475569"} strokeWidth="3" fill="none" />
            <motion.path
                d="M 28 20 C 43 20 53 40 53 50 C 53 60 43 80 28 80 C 58 80 88 60 93 50 C 88 40 58 20 28 20 Z"
                fill={active ? "#10b981" : "#1e293b"}
                stroke={active ? "#34d399" : "#475569"}
                strokeWidth="3"
                animate={{ fill: active ? "#10b981" : "#1e293b", filter: active ? "drop-shadow(0 0 10px #10b981)" : "none" }}
            />
            <circle cx="99" cy="50" r="6" fill="#1e293b" stroke={active ? "#34d399" : "#475569"} strokeWidth="3" />
        </>
    ),
    NOT: (active) => (
        <>
            <motion.path
                d="M 30 20 L 30 80 L 85 50 Z"
                fill={active ? "#10b981" : "#1e293b"}
                stroke={active ? "#34d399" : "#475569"}
                strokeWidth="3"
                animate={{ fill: active ? "#10b981" : "#1e293b", filter: active ? "drop-shadow(0 0 10px #10b981)" : "none" }}
            />
            <circle cx="91" cy="50" r="6" fill="#1e293b" stroke={active ? "#34d399" : "#475569"} strokeWidth="3" />
        </>
    )
};

export const LogicGate = ({ active, type = "AND", inputValues = [null, null, null] }) => {
    // Generate pin positions based on slots count
    const numSlots = inputValues.length;
    const inputYPositions = inputValues.map((_, i) => {
        if (numSlots === 1) return 50;
        const totalPadding = 25; // More condensed
        const availableSpace = 100 - (totalPadding * 2);
        const step = availableSpace / (numSlots - 1);
        return totalPadding + (i * step);
    });

    const isXorType = type === 'XOR' || type === 'XNOR';
    const pinEndX = isXorType ? 28 : 25; // Pins go deeper for OR/AND/NOT/NAND/NOR, but XOR has a gap.
    // For standard gates (AND, NAND, OR, NOR), back starts at 25.
    // For XOR/XNOR, back curve starts at 28, but input curved line is at 15. Pins should touch 15.
    const connectionX = isXorType ? 15 : 25;

    // Output line start
    const outputStartX = (type === 'NAND' || type === 'NOT') ? 97 : (type === 'NOR' ? 102 : (type === 'XNOR' ? 105 : 90));
    // Correcting output X based on shape:
    // AND: 85 -> 90 is OK.
    // OR/XOR: tip at 90/93.
    // Inverters add +6 (radius) -> so ~96-99.

    return (
        <div className="position-relative d-flex align-items-center justify-content-center w-100 h-100" style={{ minHeight: '150px' }}>
            <svg viewBox="0 0 120 100" className="w-100 h-100 overflow-visible" style={{ filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.3))' }}>
                {/* Inputs Pins */}
                {inputYPositions.map((y, idx) => {
                    const val = inputValues[idx];
                    let stroke = "#475569"; // Default
                    let strokeWidth = "2";
                    let isDashed = val === null;

                    if (val === 1) {
                        stroke = "#34d399";
                        strokeWidth = "3";
                    } else if (val === 0) {
                        stroke = "#64748b";
                        strokeWidth = "3";
                    }

                    return (
                        <line
                            key={idx}
                            x1="-10" y1={y}
                            x2={connectionX} y2={y}
                            stroke={stroke}
                            strokeWidth={strokeWidth}
                            strokeDasharray={isDashed ? "4 2" : "0"}
                            className="transition-all duration-300"
                        />
                    );
                })}

                {/* The Gate Shape */}
                {GatePaths[type] ? GatePaths[type](active) : GatePaths['AND'](active)}

                {/* Output line */}
                <line x1={type.includes('NOR') || type.includes('XNOR') ? 102 : (type.includes('NAND') || type === 'NOT' ? 97 : 90)} y1="50" x2="120" y2="50" stroke={active ? "#34d399" : "#475569"} strokeWidth="3" />

                <text x="60" y="55" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" style={{ pointerEvents: 'none', userSelect: 'none', textShadow: '0 2px 4px black' }}>
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
