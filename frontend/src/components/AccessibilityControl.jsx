import React, { useState, useEffect, useRef } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useSocket } from '../context/SocketContext';
import { useGameStore } from '../store/gameStore';

const AccessibilityControl = () => {
    const { socket } = useSocket();
    const { setDraftProfile, gameState } = useGameStore();

    const [isListening, setIsListening] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Refs for race-condition free handling
    const audioChunksRef = useRef([]);
    const mediaRecorderRef = useRef(null);
    const isPressedRef = useRef(false);
    const lastNarratedRoundRef = useRef(-1);
    const lastNotGatesRef = useRef({});

    useEffect(() => {
        if (!socket) return;

        socket.on('voice_response', (data) => {
            console.log("Voice Response:", data);
            setProcessing(false);
            if (data.audio) {
                const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
                audio.play().catch(e => console.error("Audio play error:", e));
            }
        });

        return () => {
            socket.off('voice_response');
        };
    }, [socket, setDraftProfile]);

    // Auto-narration on game state changes
    useEffect(() => {
        if (!socket || !gameState || !isActive) return;

        const myPlayer = Object.values(gameState.teams || {})
            .flatMap(team => Object.values(team.players || {}))
            .find(p => p.sid === socket.id);

        if (!myPlayer) return;

        // Narrate round start
        if (gameState.state === 'PLAYING' && gameState.round_number !== lastNarratedRoundRef.current) {
            lastNarratedRoundRef.current = gameState.round_number;

            for (const team of Object.values(gameState.teams || {})) {
                if (team.players[socket.id]) {
                    // Build teammate info
                    const teammates = Object.values(team.players).filter(p => p.sid !== socket.id);
                    const teammateInfo = teammates.map(p => `${p.name} tiene carta ${p.card_value}`).join(', ');

                    const narration = `Ronda ${gameState.round_number} iniciada. Tu puerta es ${team.current_gate}. Tu carta tiene valor ${myPlayer.card_value}${teammates.length > 0 ? `. Tus compañeros: ${teammateInfo}` : ''}.`;
                    socket.emit('voice_input', {
                        audio: null,
                        text: narration,
                        context: { view: 'IN_GAME', state: gameState },
                        isAutoNarration: true
                    });
                    break;
                }
            }
        }

        // Detect NOT gate changes
        const currentNotGates = {};
        for (const team of Object.values(gameState.teams || {})) {
            for (const [pid, player] of Object.entries(team.players || {})) {
                currentNotGates[pid] = player.has_not_gate || false;
            }
        }

        for (const [pid, hasNot] of Object.entries(currentNotGates)) {
            const wasNot = lastNotGatesRef.current[pid] || false;
            if (hasNot && !wasNot) {
                const player = Object.values(gameState.teams || {})
                    .flatMap(t => Object.values(t.players || {}))
                    .find(p => p.sid === pid);

                if (player) {
                    const isMe = pid === socket.id;
                    const narration = isMe
                        ? "¡Alerta! Tu carta ha sido invertida por una puerta NOT de un rival."
                        : `Tu compañero ${player.name} ha sido saboteado con una puerta NOT.`;

                    socket.emit('voice_input', {
                        audio: null,
                        text: narration,
                        context: { view: 'IN_GAME', state: gameState },
                        isAutoNarration: true
                    });
                }
            }
        }

        lastNotGatesRef.current = currentNotGates;
    }, [gameState, socket, isActive]);

    const startListening = async () => {
        isPressedRef.current = true;
        setIsListening(true);
        audioChunksRef.current = []; // Clear previous chunks

        try {
            // Check strictly for navigator.mediaDevices
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Browser API not supported or blocked (check HTTPS/Localhost)");
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // If user released button during the await
            if (!isPressedRef.current) {
                stream.getTracks().forEach(track => track.stop());
                setIsListening(false);
                return;
            }

            // Prefer webm
            const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                // Combine chunks
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

                // VALIDATION: Ignore if too short (< 0.5s) or empty
                if (audioBlob.size > 2000) {
                    sendAudio(audioBlob);
                } else {
                    console.warn("Audio recording too short, discarding.");
                }

                // Cleanup
                audioChunksRef.current = [];
            };

            recorder.start();
        } catch (err) {
            console.error("Mic access failed:", err);
            alert(`Microphone Error: ${err.message}. Ensure permission is granted.`);
            setIsListening(false);
            isPressedRef.current = false;
        }
    };

    const stopListening = () => {
        isPressedRef.current = false;
        setIsListening(false);

        // Add a small delay to ensure we capture the end of utterance if clicked quickly
        setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
                setProcessing(true);

                // Stop all tracks to release mic
                if (mediaRecorderRef.current.stream) {
                    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                }
                mediaRecorderRef.current = null;
            }
        }, 300); // 300ms buffer
    };

    const sendAudio = (blob) => {
        if (!socket) return;
        const context = gameState ? "IN_GAME" : "LOBBY";
        socket.emit('voice_input', {
            audio: blob,
            context: { view: context, state: gameState }
        });
    };

    // ... UI RENDER (Same as before) ...
    if (!isActive) {
        return (
            <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
                <Button
                    variant="outline-info"
                    size="sm"
                    onClick={() => setIsActive(true)}
                    className="rounded-pill px-3 shadow-lg bg-black text-info border-info"
                    style={{ fontFamily: 'monospace' }}
                >
                    👁️ HACKER_MODE
                </Button>
            </div>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 9999,
                width: '300px'
            }}
            className="card border-info bg-black text-info shadow-lg p-3"
        >
            <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small fw-bold tracking-widest">[ VOICE_UPLINK ]</span>
                <Button variant="link" size="sm" className="text-muted p-0" onClick={() => setIsActive(false)}>X</Button>
            </div>

            <div className="text-center">
                {processing ? (
                    <div className="my-3 text-warning">
                        <Spinner animation="grow" size="sm" /> PROCESSING...
                    </div>
                ) : (
                    <Button
                        variant={isListening ? "danger" : "info"}
                        className="w-100 py-3 fw-bold rounded-0"
                        onMouseDown={startListening}
                        onMouseUp={stopListening}
                        onTouchStart={startListening}
                        onTouchEnd={stopListening}
                    >
                        {isListening ? "🎤 LISTENING..." : "HOLD TO SPEAK"}
                    </Button>
                )}
            </div>
            <small className="d-block text-center mt-2 text-muted" style={{ fontSize: '10px' }}>
                System: {processing ? 'Thinking...' : 'Ready'}
            </small>
        </div>
    );
};

export default AccessibilityControl;
