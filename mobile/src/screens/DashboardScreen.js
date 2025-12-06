import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLessons, generateLesson } from '../services/api';

export default function DashboardScreen({ navigation }) {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState(null);
    const [newLesson, setNewLesson] = useState({
        subject: '',
        level: 'beginner',
        language: 'Arabic',
    });

    useEffect(() => {
        loadUser();
        fetchLessons();
    }, []);

    const loadUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    };

    const fetchLessons = async () => {
        try {
            const { data } = await getLessons();
            setLessons(data);
        } catch (error) {
            Alert.alert('خطأ', 'فشل تحميل الدروس');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleGenerateLesson = async () => {
        if (!newLesson.subject) {
            Alert.alert('خطأ', 'الرجاء إدخال الموضوع');
            return;
        }

        setGenerating(true);
        try {
            const { data } = await generateLesson(newLesson);
            navigation.navigate('Lesson', { lessonId: data.id });
            setNewLesson({ subject: '', level: 'beginner', language: 'Arabic' });
        } catch (error) {
            Alert.alert('خطأ', 'فشل إنشاء الدرس');
        } finally {
            setGenerating(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        navigation.replace('Login');
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>المدرس الصغير</Text>
                    <Text style={styles.headerSubtitle}>مرحباً، {user?.username}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>خروج</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => {
                        setRefreshing(true);
                        fetchLessons();
                    }} />
                }
            >
                {/* Create Lesson Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>إنشاء درس جديد</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="الموضوع (مثال: الرياضيات)"
                        value={newLesson.subject}
                        onChangeText={(text) => setNewLesson({ ...newLesson, subject: text })}
                    />

                    <View style={styles.levelContainer}>
                        {['beginner', 'intermediate', 'advanced'].map((level) => (
                            <TouchableOpacity
                                key={level}
                                style={[
                                    styles.levelButton,
                                    newLesson.level === level && styles.levelButtonActive,
                                ]}
                                onPress={() => setNewLesson({ ...newLesson, level })}
                            >
                                <Text
                                    style={[
                                        styles.levelText,
                                        newLesson.level === level && styles.levelTextActive,
                                    ]}
                                >
                                    {level === 'beginner' ? 'مبتدئ' : level === 'intermediate' ? 'متوسط' : 'متقدم'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.generateButton, generating && styles.buttonDisabled]}
                        onPress={handleGenerateLesson}
                        disabled={generating}
                    >
                        <Text style={styles.generateButtonText}>
                            {generating ? 'جاري الإنشاء...' : 'إنشاء الدرس'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Lessons */}
                <Text style={styles.sectionTitle}>الدروس الأخيرة</Text>
                {lessons.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>لا توجد دروس بعد</Text>
                        <Text style={styles.emptySubtext}>ابدأ بإنشاء درسك الأول!</Text>
                    </View>
                ) : (
                    lessons.map((lesson) => (
                        <TouchableOpacity
                            key={lesson.id}
                            style={styles.lessonCard}
                            onPress={() => navigation.navigate('Lesson', { lessonId: lesson.id })}
                        >
                            <Text style={styles.lessonTitle}>{lesson.subject}</Text>
                            <Text style={styles.lessonMeta}>
                                {lesson.level === 'beginner' ? 'مبتدئ' : lesson.level === 'intermediate' ? 'متوسط' : 'متقدم'} • {new Date(lesson.created_at).toLocaleDateString('ar')}
                            </Text>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#2563EB',
        padding: 20,
        paddingTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#BFDBFE',
        marginTop: 4,
    },
    logoutButton: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    logoutText: {
        color: 'white',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 15,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#1E293B',
    },
    input: {
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    levelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    levelButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginHorizontal: 3,
        alignItems: 'center',
    },
    levelButtonActive: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF',
    },
    levelText: {
        fontSize: 14,
        color: '#64748B',
    },
    levelTextActive: {
        color: '#2563EB',
        fontWeight: 'bold',
    },
    generateButton: {
        backgroundColor: '#10B981',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#94A3B8',
    },
    generateButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#1E293B',
    },
    lessonCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    lessonTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 5,
    },
    lessonMeta: {
        fontSize: 14,
        color: '#64748B',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        color: '#64748B',
        marginBottom: 5,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#94A3B8',
    },
});
