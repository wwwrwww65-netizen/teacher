import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const QuizPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const { data } = await api.get(`/quizzes/${id}`);
                setQuiz(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching quiz", error);
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [id]);

    const handleOptionChange = (questionIndex, option) => {
        setAnswers({ ...answers, [questionIndex]: option });
    };

    const handleSubmit = () => {
        let calculatedScore = 0;
        // Handle structure variation: AI might return { questions: [...] } or just [...]
        // The backend stores it as JSONB, so it depends on what the AI returned and how we parsed it.
        // In quizController, we parsed it. Let's assume the AI returns { questions: [...] } as per prompt.
        // But sometimes it might just be the array.
        const questionsData = quiz.questions.questions || quiz.questions;

        if (!Array.isArray(questionsData)) {
            console.error("Unexpected quiz format", quiz.questions);
            return;
        }

        questionsData.forEach((q, index) => {
            if (answers[index] === q.correctAnswer) {
                calculatedScore += 1;
            }
        });

        const finalScore = (calculatedScore / questionsData.length) * 100;
        setScore(finalScore);
    };

    if (loading) return <div className="p-8 text-center">Loading quiz...</div>;
    if (!quiz) return <div className="p-8 text-center">Quiz not found</div>;

    const questions = quiz.questions.questions || quiz.questions;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-3xl mx-auto bg-white rounded shadow p-8">
                <h1 className="text-2xl font-bold mb-6">Quiz</h1>

                {score !== null ? (
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-blue-600 mb-4">Your Score: {score.toFixed(0)}%</h2>
                        <p className="mb-6">Great job!</p>
                        <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900">Back to Dashboard</button>
                    </div>
                ) : (
                    <>
                        {questions && questions.map((q, index) => (
                            <div key={index} className="mb-6 border-b pb-6 last:border-0">
                                <p className="font-semibold text-lg mb-4">{index + 1}. {q.question}</p>
                                <div className="space-y-2">
                                    {q.options.map((option, optIndex) => (
                                        <label key={optIndex} className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`question-${index}`}
                                                value={option}
                                                onChange={() => handleOptionChange(index, option)}
                                                checked={answers[index] === option}
                                                className="form-radio text-blue-600"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={handleSubmit}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
                        >
                            Submit Answers
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default QuizPage;
