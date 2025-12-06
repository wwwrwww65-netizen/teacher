import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import LessonPage from './pages/LessonPage';
import QuizPage from './pages/QuizPage';
import SettingsPage from './pages/SettingsPage';
import PrivateRoute from './components/PrivateRoute';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-100 text-gray-900">
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/lessons/:id" element={<PrivateRoute><LessonPage /></PrivateRoute>} />
                    <Route path="/quizzes/:id" element={<PrivateRoute><QuizPage /></PrivateRoute>} />
                    <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
