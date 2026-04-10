import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Row, Col, Card, Badge } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';

const AiAssistantModal = ({ show, onClose }) => {
    const { socket, isConnected } = useSocket();
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'create'
    const [characters, setCharacters] = useState([]);
    const [selectedChar, setSelectedChar] = useState('superhero');
    const [messages, setMessages] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // New Character Form State
    const [newCharName, setNewCharName] = useState('');
    const [newCharDesc, setNewCharDesc] = useState('');
    const [newCharVoice, setNewCharVoice] = useState('es-ES-AlvaroNeural');
    const [editingKey, setEditingKey] = useState(null); // Key of the character being edited
    const [createLoading, setCreateLoading] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioPlayerRef = useRef(null);
    const scrollRef = useRef(null);

    // Initial load: get characters
    useEffect(() => {
        if (show && socket && isConnected) {
            socket.emit('get_assistant_characters', {});

            const handleCharacters = (data) => {
                setCharacters(data);
                if (data.length > 0 && !selectedChar) {
                    setSelectedChar(data[0].id);
                }
            };

            const handleResponse = (data) => {
                setIsThinking(false);
                if (data.text) {
                    // Check if moderated
                    const content = data.moderated ? `⚠️ ${data.text}` : data.text;
                    setMessages(prev => [...prev, { role: 'assistant', content: content }]);
                }
                if (data.audio) {
                    playAudio(data.audio);
                }
            };

            const handleCharacterAdded = (data) => {
                setCreateLoading(false);
                setActiveTab('chat');
                setSelectedChar(data.key);
                setNewCharName('');
                setNewCharDesc('');
                alert(`¡Personaje "${data.name}" creado con éxito!`);
            };

            const handleCharacterUpdated = (data) => {
                setCreateLoading(false);
                setActiveTab('chat');
                setEditingKey(null);
                setNewCharName('');
                setNewCharDesc('');
                alert(`¡Personaje "${data.name}" actualizado!`);
            };

            const handleAssistantError = (data) => {
                setCreateLoading(false);
                alert(data.message || "Hubo un error");
            };

            socket.on('assistant_characters', handleCharacters);
            socket.on('assistant_response', handleResponse);
            socket.on('character_added', handleCharacterAdded);
            socket.on('character_updated', handleCharacterUpdated);
            socket.on('assistant_error', handleAssistantError);

            return () => {
                socket.off('assistant_characters', handleCharacters);
                socket.off('assistant_response', handleResponse);
                socket.off('character_added', handleCharacterAdded);
                socket.off('character_updated', handleCharacterUpdated);
                socket.off('assistant_error', handleAssistantError);
            };
        }
    }, [show, socket, isConnected]);

    // Auto-scroll chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const playAudio = (base64Audio) => {
        setIsSpeaking(true);
        const audioBlob = b64toBlob(base64Audio, 'audio/mpeg');
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioPlayerRef.current) {
            audioPlayerRef.current.src = audioUrl;
            audioPlayerRef.current.play();
            audioPlayerRef.current.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
            };
        }
    };

    const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: contentType });
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                sendAudioToServer(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("No se pudo acceder al micrófono.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendAudioToServer = (blob) => {
        if (!socket) return;
        setIsThinking(true);
        const reader = new FileReader();
        reader.readAsArrayBuffer(blob);
        reader.onloadend = () => {
            const buffer = reader.result;
            socket.emit('assistant_chat', {
                character: selectedChar,
                audio: buffer
            });
        };
    };

    // Animation variants for the logo
    const logoVariants = {
        idle: {
            scale: 1,
            rotate: 0,
            filter: 'drop-shadow(0 0 15px rgba(0, 255, 255, 0.4))'
        },
        listening: {
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
            filter: [
                'drop-shadow(0 0 20px rgba(0, 255, 0, 0.6))',
                'drop-shadow(0 0 40px rgba(0, 255, 0, 0.9))',
                'drop-shadow(0 0 20px rgba(0, 255, 0, 0.6))'
            ],
            transition: { repeat: Infinity, duration: 1.5 }
        },
        thinking: {
            rotate: 360,
            scale: 0.85,
            filter: 'drop-shadow(0 0 30px rgba(255, 0, 255, 0.7))',
            transition: { repeat: Infinity, duration: 2, ease: "linear" }
        },
        speaking: {
            scale: [1, 1.15, 0.95, 1.1, 1],
            rotate: [0, 2, -2, 1, 0],
            filter: [
                'drop-shadow(0 0 15px rgba(0, 150, 255, 0.6))',
                'drop-shadow(0 0 45px rgba(255, 255, 0, 0.9))',
                'drop-shadow(0 0 15px rgba(255, 0, 255, 0.6))',
                'drop-shadow(0 0 45px rgba(0, 255, 255, 0.9))'
            ],
            transition: {
                repeat: Infinity,
                duration: 0.8,
                filter: { duration: 2, repeat: Infinity }
            }
        }
    };

    const getCurrentState = () => {
        if (isRecording) return 'listening';
        if (isThinking) return 'thinking';
        if (isSpeaking) return 'speaking';
        return 'idle';
    };

    const handleCreateChar = (e) => {
        e.preventDefault();
        if (!newCharName || !newCharDesc) return;

        setCreateLoading(true);
        if (editingKey) {
            socket.emit('edit_assistant_character', {
                key: editingKey,
                name: newCharName,
                description: newCharDesc,
                voice: newCharVoice
            });
        } else {
            socket.emit('add_assistant_character', {
                name: newCharName,
                description: newCharDesc,
                voice: newCharVoice
            });
        }
    };

    const handleEditClick = (char) => {
        setEditingKey(char.id);
        setNewCharName(char.name);
        setNewCharDesc(char.description || "");
        setNewCharVoice(char.voice || 'es-ES-AlvaroNeural');
        setActiveTab('create');
    };

    const openCreateTab = () => {
        setEditingKey(null);
        setNewCharName('');
        setNewCharDesc('');
        setNewCharVoice('es-ES-AlvaroNeural');
        setActiveTab('create');
    };

    const VOICES = [
        { id: 'es-ES-AlvaroNeural', name: 'Álvaro (España)' },
        { id: 'es-ES-ElviraNeural', name: 'Elvira (España)' },
        { id: 'es-MX-JorgeNeural', name: 'Jorge (México)' },
        { id: 'es-MX-DaliaNeural', name: 'Dalia (México)' },
        { id: 'en-US-GuyNeural', name: 'Guy (English)' },
        { id: 'en-US-JennyNeural', name: 'Jenny (English)' }
    ];

    return (
        <Modal show={show} onHide={onClose} centered size="lg" className="ai-assistant-modal">
            <Modal.Header closeButton style={{ background: '#0a0a0a', borderBottom: '1px solid #333' }}>
                <Modal.Title className="d-flex align-items-center gap-3 w-100">
                    <span style={{ color: '#00ccff', fontWeight: 'bold' }}>🤖 Asistente de IA</span>
                    <div className="ms-auto me-4 d-flex gap-2">
                        <Button
                            size="sm"
                            variant={activeTab === 'chat' ? 'info' : 'outline-secondary'}
                            onClick={() => setActiveTab('chat')}
                        >
                            Chat
                        </Button>
                        <Button
                            size="sm"
                            variant={activeTab === 'create' ? 'warning' : 'outline-secondary'}
                            onClick={openCreateTab}
                        >
                            {editingKey ? '✏️ Editando...' : '+ Crear Guía'}
                        </Button>
                    </div>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ background: '#050505', color: '#eee', minHeight: '500px' }}>
                {activeTab === 'chat' ? (
                    <Row className="h-100">
                        {/* Left side: Character Selection and Logo */}
                        <Col md={5} className="d-flex flex-column align-items-center justify-content-center border-end border-secondary p-4">
                            <div className="text-center mb-4">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        variants={logoVariants}
                                        animate={getCurrentState()}
                                        style={{ width: '180px', height: '180px', borderRadius: '50%', overflow: 'hidden' }}
                                    >
                                        <img
                                            src={isSpeaking ? "/assets/ai-logo.png" : "/assets/ai-logo-premium.png"}
                                            alt="AI Logo"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => { e.target.src = "/assets/ai-logo.png" }}
                                        />
                                    </motion.div>
                                </AnimatePresence>
                                <div className="mt-3">
                                    <Badge bg={isRecording ? 'danger' : isSpeaking ? 'info' : 'secondary'} className="px-3 py-2">
                                        {isRecording ? 'Escuchando...' : isThinking ? 'Procesando...' : isSpeaking ? 'Hablando...' : 'Listo'}
                                    </Badge>
                                </div>
                            </div>

                            <Form.Group className="w-100 mt-2">
                                <Form.Label className="small text-muted">Selecciona tu guía:</Form.Label>
                                <div className="d-flex flex-column gap-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                    {characters.map(char => (
                                        <div key={char.id} className="d-flex gap-1 align-items-center">
                                            <Button
                                                variant={selectedChar === char.id ? "outline-info" : "outline-secondary"}
                                                className={`text-start py-1 flex-grow-1 ${selectedChar === char.id ? 'bg-dark' : ''}`}
                                                onClick={() => setSelectedChar(char.id)}
                                                size="sm"
                                            >
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span>
                                                        {char.id === 'superhero' ? '🦸 ' : char.id === 'astronaut' ? '👨‍🚀 ' : '✨ '}
                                                        {char.name}
                                                    </span>
                                                    {selectedChar === char.id && <motion.span layoutId="activeChar">📍</motion.span>}
                                                </div>
                                            </Button>
                                            <Button
                                                variant="dark"
                                                size="sm"
                                                className="p-1 px-2 border-secondary"
                                                onClick={() => handleEditClick(char)}
                                                title="Editar"
                                            >
                                                ✏️
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </Form.Group>
                        </Col>

                        {/* Right side: Chat History and Controls */}
                        <Col md={7} className="d-flex flex-column p-0">
                            <div
                                ref={scrollRef}
                                className="flex-grow-1 p-3"
                                style={{ maxHeight: '400px', overflowY: 'auto', background: 'rgba(255,255,255,0.02)' }}
                            >
                                <div className="d-flex flex-column gap-3">
                                    {messages.length === 0 && (
                                        <div className="text-center text-muted mt-5 py-5 italic">
                                            Explícame tus dudas o cuéntame qué necesitas...
                                        </div>
                                    )}
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                                            <div
                                                style={{
                                                    maxWidth: '85%',
                                                    padding: '10px 15px',
                                                    borderRadius: '15px',
                                                    background: msg.role === 'user' ? '#004a6e' : '#222',
                                                    border: msg.role === 'user' ? '1px solid #006699' : '1px solid #444',
                                                    color: '#fff',
                                                    fontSize: '0.95rem'
                                                }}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isThinking && (
                                        <div className="d-flex justify-content-start">
                                            <div className="bg-dark p-2 px-3 rounded-pill border border-secondary text-muted small">
                                                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity }}>...</motion.span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-3 border-top border-secondary bg-dark d-flex align-items-center gap-3">
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className="flex-grow-1"
                                >
                                    <Button
                                        variant={isRecording ? "danger" : "primary"}
                                        className="w-100 py-3 rounded-pill fw-bold"
                                        onMouseDown={startRecording}
                                        onMouseUp={stopRecording}
                                        onTouchStart={startRecording}
                                        onTouchEnd={stopRecording}
                                    >
                                        {isRecording ? '🎙️ SUELTA PARA ENVIAR' : '🎤 MANTÉN PARA HABLAR'}
                                    </Button>
                                </motion.div>
                            </div>
                        </Col>
                    </Row>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4"
                    >
                        <h4 className="text-warning mb-4">✨ Crear nuevo Guía de ArenaLogic</h4>
                        <Form onSubmit={handleCreateChar}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-info">Nombre del Personaje</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Ej: Sabio de los Bits, Pirata Lógico..."
                                    value={newCharName}
                                    onChange={(e) => setNewCharName(e.target.value)}
                                    className="bg-dark border-secondary text-white"
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="text-info">Personalidad y Comportamiento</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    placeholder="Define cómo debe hablar y actuar. Ej: Eres un pirata que ama las matemáticas y siempre termina sus frases con '¡Arrr!'. Ayuda a los niños a entender las puertas AND y OR..."
                                    value={newCharDesc}
                                    onChange={(e) => setNewCharDesc(e.target.value)}
                                    className="bg-dark border-secondary text-white"
                                    required
                                />
                                <Form.Text className="text-muted">
                                    Nota: Todas las interacciones están moderadas para público infantil.
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="text-info">Voz del Guía</Form.Label>
                                <Form.Select
                                    value={newCharVoice}
                                    onChange={(e) => setNewCharVoice(e.target.value)}
                                    className="bg-dark border-secondary text-white"
                                >
                                    {VOICES.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <div className="d-flex gap-3 justify-content-end">
                                <Button variant="outline-secondary" onClick={() => setActiveTab('chat')}>
                                    Cancelar
                                </Button>
                                <Button
                                    variant="warning"
                                    type="submit"
                                    disabled={createLoading || !newCharName || !newCharDesc}
                                    className="px-4 fw-bold"
                                >
                                    {createLoading ? 'Guardando...' : '🚀 Crear Personaje'}
                                </Button>
                            </div>
                        </Form>
                    </motion.div>
                )}
            </Modal.Body>
            <audio ref={audioPlayerRef} style={{ display: 'none' }} />
        </Modal>
    );
};

export default AiAssistantModal;
