// Gate descriptions and visual helpers

export const GATE_INFO = {
    AND: {
        name: 'AND',
        description: 'All players must be 1',
        symbol: '∧',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        difficulty: 'Medium-Hard',
        points: 2
    },
    OR: {
        name: 'OR',
        description: 'At least one player must be 1',
        symbol: '∨',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        difficulty: 'Easy',
        points: 1
    },
    XOR: {
        name: 'XOR',
        description: 'Exactly one player must be 1',
        symbol: '⊕',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20',
        difficulty: 'Hard',
        points: 3
    },
    XNOR: {
        name: 'XNOR',
        description: 'All players must be the same',
        symbol: '⊙',
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/20',
        difficulty: 'Hard',
        points: 3
    },
    NAND: {
        name: 'NAND',
        description: 'At least one player must be 0',
        symbol: '⊼',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        difficulty: 'Medium-Hard',
        points: 2
    }
};

export const getGateInfo = (gateType) => {
    return GATE_INFO[gateType] || GATE_INFO.AND;
};
