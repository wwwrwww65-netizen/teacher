import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { getQuizById } from '../services/api';

export default function QuizScreen({ route, navigation }) {
    const quizId = route.params?.quizId;
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuiz();
    }, []);

    const fetchQuiz = async () => {
        try {
            const { data } = await getQuizById(quizId);
            setQuiz(data);
        } catch (error) {
            Alert.alert('خطأ', 'فشل تحميل الاختبار');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAnswer = (questionIndex, option) => {
        setAnswers({ ...answers, [questionIndex]: option });
    };

    const handleSubmit = () => {
        const questions = quiz.questions.questions || quiz.questions;
        let calculatedScore = 0;

        questions.forEach((q, index) => {
            if (answers[index] === q.correctAnswer) {
                calculatedScore += 1;
            }
        });

        const finalScore = (calculatedScore / questions.length) * 100;
        setScore(finalScore);
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!quiz) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>الاختبار غير موجود</Text>
            </View>
        );
    }

    const questions = quiz.questions.questions || quiz.questions;

    if (score !== null) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>النتيجة</Text>
                </View>
                <View style={styles.resultContainer}>
                    <Text style={styles.scoreTitle}>نتيجتك</Text>
                    <Text style={styles.scoreValue}>{score.toFixed(0)}%</Text>
                    <Text style={styles.scoreMessage}>
                        {score >= 80 ? 'ممتاز! 🎉' : score >= 60 ? 'جيد جداً! 👏' : 'حاول مرة أخرى 💪'}
                    </Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.navigate('Dashboard')}
                    >
                        <Text style={styles.backButtonText}>العودة للوحة التحكم</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.headerBackButton}>← رجوع</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>الاختبار</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.content}>
                {questions.map((q, index) => (
                    <View key={index} style={styles.questionCard}>
                        <Text style={styles.questionNumber}>السؤال {index + 1}</Text>
                        <Text style={styles.questionText}>{q.question}</Text>

                        <View style={styles.optionsContainer}>
                            {q.options.map((option, optIndex) => (
                                <TouchableOpacity
                                    key={optIndex}
                                    style={[
                                        styles.optionButton,
                                        answers[index] === option && styles.optionButtonSelected,
                                    ]}
                                    onPress={() => handleSelectAnswer(index, option)}
                                >
                                    <View style={styles.radioOuter}>
                                        {answers[index] === option && <View style={styles.radioInner} />}
                                    </View>
                                    <Text
                                        style={[
                                            styles.optionText,
                                            answers[index] === option && styles.optionTextSelected,
                                        ]}
                                    >
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        Object.keys(answers).length !== questions.length && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={Object.keys(answers).length !== questions.length}
                >
                    <Text style={styles.submitButtonText}>إرسال الإجابات</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: 'white',
        padding: 15,
        paddingTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerBackButton: {
        fontSize: 16,
        color: '#2563EB',
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    content: {
        flex: 1,
        padding: 15,
    },
    questionCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    questionNumber: {
        fontSize: 14,
        color: '#2563EB',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    questionText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 15,
    },
    optionsContainer: {
        gap: 10,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    optionButtonSelected: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF',
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#2563EB',
    },
    optionText: {
        fontSize: 16,
        color: '#64748B',
        flex: 1,
    },
    optionTextSelected: {
        color: '#2563EB',
        fontWeight: 'bold',
    },
    submitButton: {
        backgroundColor: '#2563EB',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 20,
    },
    submitButtonDisabled: {
        backgroundColor: '#94A3B8',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    scoreTitle: {
        fontSize: 24,
        color: '#64748B',
        marginBottom: 10,
    },
    scoreValue: {
        fontSize: 72,
        fontWeight: 'bold',
        color: '#2563EB',
        marginBottom: 10,
    },
    scoreMessage: {
        fontSize: 24,
        marginBottom: 40,
    },
    backButton: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12,
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 16,
        color: '#64748B',
    },
});
