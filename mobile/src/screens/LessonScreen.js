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
import Markdown from 'react-native-markdown-display';
import { getLessonById, generateQuiz } from '../services/api';

export default function LessonScreen({ route, navigation }) {
    const { lessonId } = route.params;
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLesson();
    }, []);

    const fetchLesson = async () => {
        try {
            const { data } = await getLessonById(lessonId);
            setLesson(data);
        } catch (error) {
            Alert.alert('خطأ', 'فشل تحميل الدرس');
        } finally {
            setLoading(false);
        }
    };

    const handleStartQuiz = async () => {
        try {
            const { data } = await generateQuiz(lessonId);
            navigation.navigate('Quiz', { quizId: data.id });
        } catch (error) {
            Alert.alert('خطأ', 'فشل إنشاء الاختبار');
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!lesson) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>الدرس غير موجود</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← رجوع</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{lesson.subject}</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>
                        {lesson.level === 'beginner' ? 'مبتدئ' : lesson.level === 'intermediate' ? 'متوسط' : 'متقدم'}
                    </Text>
                </View>

                <View style={styles.markdownContainer}>
                    <Markdown style={markdownStyles}>{lesson.content}</Markdown>
                </View>

                <TouchableOpacity style={styles.quizButton} onPress={handleStartQuiz}>
                    <Text style={styles.quizButtonText}>ابدأ الاختبار</Text>
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
    backButton: {
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
    levelBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 15,
    },
    levelText: {
        color: '#2563EB',
        fontSize: 14,
        fontWeight: 'bold',
    },
    markdownContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    quizButton: {
        backgroundColor: '#7C3AED',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 30,
    },
    quizButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 16,
        color: '#64748B',
    },
});

const markdownStyles = {
    body: {
        fontSize: 16,
        lineHeight: 24,
        color: '#1E293B',
    },
    heading1: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#1E293B',
    },
    heading2: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 15,
        color: '#1E293B',
    },
    paragraph: {
        marginBottom: 10,
    },
    code_inline: {
        backgroundColor: '#F1F5F9',
        padding: 2,
        borderRadius: 4,
    },
    code_block: {
        backgroundColor: '#F1F5F9',
        padding: 10,
        borderRadius: 8,
        marginVertical: 10,
    },
};
