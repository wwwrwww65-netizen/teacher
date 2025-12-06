import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (userData) => api.post('/auth/register', userData);
export const getLessons = () => api.get('/lessons');
export const getLessonById = (id) => api.get(`/lessons/${id}`);
export const generateLesson = (data) => api.post('/lessons/generate', data);
export const generateQuiz = (lessonId) => api.post('/quizzes/generate', { lessonId });

export default api;
