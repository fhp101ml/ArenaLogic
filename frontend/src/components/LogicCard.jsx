import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LogicCard = ({ value, hasNotGate, isWaiting }) => {
    // Determine which image to show
    const getCardImage = () => {
        if (isWaiting) return '/cards/card_locked.png';
        if (value === 0) return '/cards/card_0.png';
        if (value === 1) return '/cards/card_1.png';
        return '/cards/card_locked.png';
    };

    return (
        <div className="position-relative" style={{ width: '4rem', height: '5.5rem', perspective: '1000px' }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={isWaiting ? 'locked' : value}
                    initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                    transition={{ duration: 0.3 }}
                    className="position-relative w-100 h-100"
                >
                    {/* Card Image */}
                    <img
                        src={getCardImage()}
                        alt={isWaiting ? 'Locked' : `Card ${value}`}
                        className="w-100 h-100 object-fit-cover rounded shadow-lg"
                    />

                    {/* NOT Gate Overlay */}
                    {hasNotGate && !isWaiting && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="position-absolute translate-middle-y translate-middle-x top-0 start-100 bg-danger rounded-circle d-flex align-items-center justify-content-center text-white fw-black shadow border border-4 border-white z-index-20"
                            style={{ width: '2.5rem', height: '2.5rem', fontSize: '0.6rem' }}
                        >
                            NOT
                        </motion.div>
                    )}

                    {/* Glow effect when active */}
                    {!isWaiting && (
                        <div className={`position-absolute inset-0 rounded shadow-sm pointer-events-none ${value === 1
                            ? 'shadow-info'
                            : 'shadow-secondary'
                            }`} style={{ top: 0, left: 0, right: 0, bottom: 0 }} />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default LogicCard;
