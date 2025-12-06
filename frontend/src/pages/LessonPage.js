import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getLessonById, generateQuiz } from '../services/api';

const LessonPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const { data } = await getLessonById(id);
                setLesson(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching lesson', error);
                setLoading(false);
            }
        };
        fetchLesson();
    }, [id]);

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = nativeEvent;
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.closePath();
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    const handleCreateQuiz = async () => {
        try {
            const { data } = await generateQuiz(id);
            navigate(`/quizzes/${data.id}`);
        } catch (error) {
            console.error("Error creating quiz", error);
        }
    }

    if (loading) return <div className="p-8 text-center">Loading lesson...</div>;
    if (!lesson) return <div className="p-8 text-center">Lesson not found</div>;

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-white shadow p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">{lesson.subject} - {lesson.level}</h1>
                <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900">Back to Dashboard</button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Lesson Content */}
                <div className="w-1/2 p-8 overflow-y-auto border-r bg-white">
                    <div className="prose max-w-none">
                        <ReactMarkdown>{lesson.content}</ReactMarkdown>
                    </div>
                    <div className="mt-8">
                        <button
                            onClick={handleCreateQuiz}
                            className="px-6 py-3 bg-purple-600 text-white rounded shadow hover:bg-purple-700"
                        >
                            Start Quiz
                        </button>
                    </div>
                </div>

                {/* Interactive Whiteboard */}
                <div className="w-1/2 p-4 bg-gray-100 flex flex-col">
                    <div className="mb-2 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Scratchpad</h3>
                        <button onClick={clearCanvas} className="text-sm text-red-500 hover:underline">Clear</button>
                    </div>
                    <div className="flex-1 bg-white border rounded shadow cursor-crosshair relative">
                        <canvas
                            ref={canvasRef}
                            width={600}
                            height={800} // Fixed size for simplicity, ideally responsive
                            className="w-full h-full"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LessonPage;
