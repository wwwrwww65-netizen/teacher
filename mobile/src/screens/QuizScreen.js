import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    Animated,
    Dimensions
} from 'react-native';
import { getQuizById } from '../services/api'; // Assuming this exists or mocked
import SmartBackground from '../components/SmartBackground';
import { theme } from '../config/theme';

const { width } = Dimensions.get('window');

// Mock Data for UI Dev
const MOCK_QUIZ = {
    title: 'اختبار الحروف',
    questions: [
        {
            question: 'أي من هذه الكلمات تبدأ بحرف الألف؟',
            options: ['أسد', 'بطة', 'تفاحة'],
            correctAnswer: 'أسد'
        },
        {
            question: 'ما هو هذا الحرف؟ (ب)',
            options: ['باء', 'تاء', 'ألف'],
            correctAnswer: 'باء'
        },
        {
            question: 'أين النقطة في حرف الباء؟',
            options: ['فوق', 'تحت', 'وسط'],
            correctAnswer: 'تحت'
        }
    ]
};

export default function QuizScreen({ route, navigation }) {
    const quizId = route.params?.quizId; // Pass real ID later
    const [quiz, setQuiz] = useState(MOCK_QUIZ); // Use MOCK for improved UI demo
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState('playing'); // playing, finished

    // Animation for feedback
    const [answerStatus, setAnswerStatus] = useState(null); // 'correct', 'wrong', null

    const handleAnswer = (option) => {
        if (answerStatus) return; // Prevent double tap

        const currentQ = quiz.questions[currentQuestionIndex];
        const isCorrect = option === currentQ.correctAnswer;

        if (isCorrect) {
            setAnswerStatus('correct');
            setScore(s => s + 1);
            // Play sound?
        } else {
            setAnswerStatus('wrong');
            // Play sound?
        }

        setTimeout(() => {
            setAnswerStatus(null);
            if (currentQuestionIndex < quiz.questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                setGameState('finished');
            }
        }, 1000);
    };

    if (gameState === 'finished') {
        const percentage = Math.round((score / quiz.questions.length) * 100);
        return (
            <SmartBackground type="sky">
                <View style={styles.resultContainer}>
                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>انتهى الاختبار! 🎉</Text>
                        <Text style={styles.scoreBig}>{percentage}%</Text>
                        <Text style={styles.scoreMessage}>
                            {percentage >= 80 ? 'أنت عبقري! 🌟' : 'حاول مرة أخرى لتصبح أفضل! 💪'}
                        </Text>
                        <TouchableOpacity style={styles.bigButton} onPress={() => navigation.goBack()}>
                            <Text style={styles.bigButtonText}>خروج</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SmartBackground>
        );
    }

    const currentQ = quiz.questions[currentQuestionIndex];

    return (
        <SmartBackground type="room">
            {/* Game Show Header */}
            <View style={styles.header}>
                <View style={styles.scorePill}>
                    <Text style={styles.scoreLabel}>النقاط: {score}</Text>
                </View>
                <View style={styles.progressPill}>
                    <Text style={styles.progressText}>{currentQuestionIndex + 1} / {quiz.questions.length}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.gameContent}>
                {/* Question Board */}
                <View style={styles.questionBoard}>
                    <Text style={styles.questionText}>{currentQ.question}</Text>
                </View>

                {/* Options Grid */}
                <View style={styles.optionsContainer}>
                    {currentQ.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionButton,
                                answerStatus === 'correct' && option === currentQ.correctAnswer && styles.correctBtn,
                                answerStatus === 'wrong' && option !== currentQ.correctAnswer && styles.disabledBtn, // Fade others
                            ]}
                            onPress={() => handleAnswer(option)}
                            disabled={!!answerStatus}
                        >
                            <Text style={styles.optionText}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Visual Feedback */}
                {answerStatus === 'correct' && (
                    <View style={styles.feedbackOverlay}>
                        <Text style={styles.feedbackText}>✅ ممتاز!</Text>
                    </View>
                )}
                {answerStatus === 'wrong' && (
                    <View style={styles.feedbackOverlay}>
                        <Text style={[styles.feedbackText, { color: '#F44336' }]}>❌ خطأ!</Text>
                    </View>
                )}

            </ScrollView>
        </SmartBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 40
    },
    scorePill: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFF',
        elevation: 5
    },
    scoreLabel: { fontWeight: 'bold', color: '#5D4037' },
    progressPill: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20
    },
    progressText: { fontWeight: 'bold', color: '#333' },

    gameContent: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1
    },
    questionBoard: {
        backgroundColor: '#fff',
        width: '100%',
        padding: 30,
        borderRadius: 20,
        borderWidth: 4,
        borderColor: '#4CC9F0',
        marginBottom: 40,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    questionText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2D3436',
        textAlign: 'center'
    },
    optionsContainer: {
        width: '100%',
        gap: 15
    },
    optionButton: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    correctBtn: {
        borderColor: '#4CAF50',
        backgroundColor: '#E8F5E9'
    },
    disabledBtn: {
        opacity: 0.6
    },
    optionText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#555'
    },

    // Result
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    resultCard: {
        backgroundColor: 'white',
        width: '90%',
        padding: 40,
        borderRadius: 30,
        alignItems: 'center',
        elevation: 10
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20
    },
    scoreBig: {
        fontSize: 80,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 10
    },
    scoreMessage: {
        fontSize: 18,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center'
    },
    bigButton: {
        backgroundColor: theme.colors.secondary,
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        elevation: 5
    },
    bigButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white'
    },
    feedbackOverlay: {
        position: 'absolute',
        top: '50%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 20,
        elevation: 20,
        borderWidth: 2,
        borderColor: '#eee'
    },
    feedbackText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#4CAF50'
    }
});
