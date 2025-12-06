import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLessons, generateLesson } from '../services/api';

const Dashboard = () => {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newLesson, setNewLesson] = useState({ subject: '', level: 'beginner', language: 'Arabic' });
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchLessons();
    }, []);

    const fetchLessons = async () => {
        try {
            const { data } = await getLessons();
            setLessons(data);
        } catch (error) {
            console.error('Error fetching lessons', error);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await generateLesson(newLesson);
            setLoading(false);
            navigate(`/lessons/${data.id}`);
        } catch (error) {
            setLoading(false);
            console.error('Error generating lesson', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md hidden md:block">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-blue-600">Tiny Teacher</h1>
                    <p className="text-sm text-gray-500">Welcome, {user?.username}</p>
                </div>
                <nav className="mt-6">
                    <Link to="/dashboard" className="block px-6 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600">Dashboard</Link>
                    <Link to="/settings" className="block px-6 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600">Settings</Link>
                    <button onClick={handleLogout} className="block w-full text-left px-6 py-2 text-red-600 hover:bg-red-50">Logout</button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
                    <button onClick={handleLogout} className="md:hidden text-red-600">Logout</button>
                </div>

                {/* Generate Lesson Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h3 className="text-xl font-semibold mb-4">Create New Lesson</h3>
                    <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Subject (e.g. Math, History)"
                            value={newLesson.subject}
                            onChange={(e) => setNewLesson({ ...newLesson, subject: e.target.value })}
                            className="px-4 py-2 border rounded"
                            required
                        />
                        <select
                            value={newLesson.level}
                            onChange={(e) => setNewLesson({ ...newLesson, level: e.target.value })}
                            className="px-4 py-2 border rounded"
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                        <select
                            value={newLesson.language}
                            onChange={(e) => setNewLesson({ ...newLesson, language: e.target.value })}
                            className="px-4 py-2 border rounded"
                        >
                            <option value="Arabic">Arabic</option>
                            <option value="English">English</option>
                        </select>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Generating...' : 'Generate Lesson'}
                        </button>
                    </form>
                </div>

                {/* Recent Lessons */}
                <h3 className="text-xl font-semibold mb-4">Recent Lessons</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lessons.map((lesson) => (
                        <div key={lesson.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                            <h4 className="text-lg font-bold mb-2">{lesson.subject}</h4>
                            <p className="text-sm text-gray-500 mb-4">{lesson.level} - {new Date(lesson.created_at).toLocaleDateString()}</p>
                            <Link to={`/lessons/${lesson.id}`} className="text-blue-600 hover:underline">View Lesson</Link>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
