import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:5000/api'; // Android emulator localhost
// For physical device, use your computer's IP: http://192.168.x.x:5000/api

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
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
export const getQuizById = (id) => api.get(`/quizzes/${id}`);

export default api;
