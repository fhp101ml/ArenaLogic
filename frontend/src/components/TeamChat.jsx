import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, InputGroup } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';

const TeamChat = ({ socket, room, teamId, myName }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isOpen, setIsOpen] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (data) => {
            setMessages(prev => [...prev, data]);
        };

        socket.on('chat_message', handleMessage);

        return () => {
            socket.off('chat_message', handleMessage);
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        socket.emit('chat_message', {
            room_id: room,
            message: newMessage
        });
        setNewMessage('');
    };

    return (
        <div className="position-fixed end-0 p-3 z-[1000]" style={{ maxWidth: '350px', width: '100%', top: '50%', transform: 'translateY(-50%)' }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="mb-2"
                    >
                        <Card bg="dark" border="info" className="shadow-lg border-2 bg-opacity-90 backdrop-blur">
                            <Card.Header className="py-2 d-flex justify-content-between align-items-center bg-info bg-opacity-10 border-info border-opacity-25">
                                <small className="fw-bold text-info tracking-widest uppercase">
                                    💬 SECURE_LINK
                                </small>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 text-muted hover-text-white text-decoration-none"
                                    onClick={() => setIsOpen(false)}
                                >
                                    ▼
                                </Button>
                            </Card.Header>
                            <Card.Body className="p-2 overflow-auto custom-scrollbar" style={{ height: '250px' }}>
                                <div className="d-flex flex-column gap-2">
                                    {messages.length === 0 && (
                                        <div className="text-center text-muted small py-4 opacity-50">
                                            <i>Encrypted channel established.</i>
                                        </div>
                                    )}
                                    {messages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`d-flex flex-column ${msg.is_me ? 'align-items-end' : 'align-items-start'}`}
                                        >
                                            <div
                                                className={`rounded p-2 small ${msg.is_me ? 'bg-info bg-opacity-25 text-white border border-info border-opacity-50' : 'bg-secondary bg-opacity-40 text-white border border-secondary border-opacity-50'}`}
                                                style={{ maxWidth: '85%' }}
                                            >
                                                {!msg.is_me && <div className="fw-bold x-small text-info mb-1">{msg.sender}</div>}
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </Card.Body>
                            <Card.Footer className="p-2 bg-transparent border-top border-secondary border-opacity-25">
                                <Form onSubmit={sendMessage}>
                                    <InputGroup size="sm">
                                        <Form.Control
                                            placeholder="Type message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            className="bg-black border-secondary text-light focus-ring-info"
                                            style={{ fontSize: '0.85rem' }}
                                        />
                                        <Button variant="outline-info" type="submit">
                                            SEND
                                        </Button>
                                    </InputGroup>
                                </Form>
                            </Card.Footer>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-end"
                >
                    <Button
                        variant="info"
                        onClick={() => setIsOpen(true)}
                        className="rounded-circle shadow-lg d-flex align-items-center justify-content-center p-3 border-2"
                        style={{ width: '50px', height: '50px' }}
                    >
                        💬
                        {messages.length > 0 && (
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-dark">
                                {messages.length}
                            </span>
                        )}
                    </Button>
                </motion.div>
            )}
        </div>
    );
};

export default TeamChat;
