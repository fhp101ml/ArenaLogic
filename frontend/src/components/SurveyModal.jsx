import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useSocket } from '../context/SocketContext';
import { useGameStore } from '../store/gameStore';

const StarRating = ({ value, onChange, maxStars = 10 }) => {
    const [hovered, setHovered] = useState(0);

    return (
        <div className="d-flex gap-0 align-items-center">
            {[...Array(maxStars)].map((_, i) => (
                <span
                    key={i}
                    onClick={() => onChange(i + 1)}
                    onMouseEnter={() => setHovered(i + 1)}
                    onMouseLeave={() => setHovered(0)}
                    style={{
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        padding: '2px 4px',
                        display: 'inline-block',
                        userSelect: 'none'
                    }}
                    role="button"
                    aria-label={`Rate ${i + 1} of ${maxStars}`}
                >
                    {(hovered > i || value > i) ? '⭐' : '☆'}
                </span>
            ))}
            <span className="ms-2 text-muted small fw-bold">
                {value > 0 ? `${value}/10` : ''}
            </span>
        </div>
    );
};

const SurveyModal = ({ show, onClose }) => {
    const { socket } = useSocket();
    const { draftProfile } = useGameStore();

    const [questions, setQuestions] = useState([]);
    const [ratings, setRatings] = useState({});
    const [notes, setNotes] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch questions when modal opens
    useEffect(() => {
        if (show && socket) {
            socket.emit('get_survey', {});

            const handleSurveyData = (data) => {
                setQuestions(data.questions || []);
            };

            const handleSurveySubmitted = (data) => {
                setLoading(false);
                if (data.success) {
                    setSubmitted(true);
                }
            };

            // Listen for voice-driven updates
            const handleSurveyUpdate = (data) => {
                if (data.ratings) {
                    setRatings(data.ratings);
                }
                if (data.notes !== undefined) {
                    setNotes(data.notes);
                }
            };

            socket.on('survey_data', handleSurveyData);
            socket.on('survey_submitted', handleSurveySubmitted);
            socket.on('survey_update', handleSurveyUpdate);

            return () => {
                socket.off('survey_data', handleSurveyData);
                socket.off('survey_submitted', handleSurveySubmitted);
                socket.off('survey_update', handleSurveyUpdate);
            };
        }
    }, [show, socket]);

    const handleRatingChange = (questionId, value) => {
        setRatings(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = () => {
        if (!socket) return;

        setLoading(true);
        socket.emit('submit_survey', {
            player_name: draftProfile?.name || 'Anonymous',
            ratings,
            notes
        });
    };

    const handleClose = () => {
        setSubmitted(false);
        setRatings({});
        setNotes('');
        onClose();
    };

    const allRated = questions.length > 0 &&
        questions.every(q => ratings[q.id] && ratings[q.id] > 0);

    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>📋 Encuesta de Satisfacción</Modal.Title>
            </Modal.Header>
            <Modal.Body className="py-4">
                {submitted ? (
                    <div className="text-center py-5">
                        <div style={{ fontSize: '4rem' }}>🎉</div>
                        <h4 className="mt-3">¡Gracias por tu feedback!</h4>
                        <p className="text-muted">
                            Tu opinión nos ayuda a mejorar el juego.
                        </p>
                        <Button variant="primary" onClick={handleClose} className="mt-3">
                            Cerrar
                        </Button>
                    </div>
                ) : (
                    <>
                        <p className="text-muted mb-4">
                            Valora cada aspecto del 1 al 10 usando las estrellas ⭐
                        </p>

                        {questions.map((question, idx) => (
                            <Form.Group key={question.id} className="mb-3">
                                <Form.Label className="fw-bold mb-1">
                                    {idx + 1}. {question.text}
                                </Form.Label>
                                <StarRating
                                    value={ratings[question.id] || 0}
                                    onChange={(val) => handleRatingChange(question.id, val)}
                                />
                            </Form.Group>
                        ))}

                        <Form.Group className="mt-4">
                            <Form.Label className="fw-bold">📝 Comentarios adicionales (opcional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Escribe aquí tus sugerencias, ideas o comentarios..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </Form.Group>
                    </>
                )}
            </Modal.Body>
            {!submitted && (
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleSubmit}
                        disabled={!allRated || loading}
                    >
                        {loading ? 'Enviando...' : '✅ Enviar Encuesta'}
                    </Button>
                </Modal.Footer>
            )}
        </Modal>
    );
};

export default SurveyModal;
