import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    StatusBar
} from 'react-native';
// import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../components/Card';
import { theme } from '../config/theme';
import { lessons } from '../data/lessons';

const HomeScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    };

    const getLevelProgress = () => {
        if (!user) return 0;
        return (user.points % 100) / 100;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>مرحباً، {user?.name || 'طالب'}! 👋</Text>
                    <Text style={styles.subtitle}>جاهز للتعلم اليوم؟</Text>
                </View>
                <TouchableOpacity
                    style={styles.avatar}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={styles.avatarText}>{user?.avatar || '👤'}</Text>
                </TouchableOpacity>
            </View>

            {/* Progress Card */}
            <Card style={styles.progressCard}>
                <View style={styles.progressHeader}>
                    <View>
                        <Text style={styles.levelText}>المستوى {user?.level || 1}</Text>
                        <Text style={styles.pointsText}>{user?.points || 0} نقطة</Text>
                    </View>
                    <Text style={styles.trophy}>🏆</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${getLevelProgress() * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>
                    {100 - (user?.points || 0) % 100} نقطة للمستوى التالي
                </Text>
            </Card>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ابدأ التعلم</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={[styles.quickAction, { backgroundColor: theme.colors.primary }]}
                            onPress={() => navigation.navigate('Lessons')}
                        >
                            <Text style={styles.quickActionIcon}>📚</Text>
                            <Text style={styles.quickActionText}>الدروس</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickAction, { backgroundColor: theme.colors.secondary }]}
                            onPress={() => navigation.navigate('Classroom')}
                        >
                            <Text style={styles.quickActionIcon}>🤖</Text>
                            <Text style={styles.quickActionText}>المعلم</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickAction, { backgroundColor: theme.colors.accent }]}
                            aria-label="اختبار"
                            onPress={() => navigation.navigate('Quiz', { quizId: '1' })}
                        >
                            <Text style={styles.quickActionIcon}>🎯</Text>
                            <Text style={styles.quickActionText}>اختبار</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Featured Lessons */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>الدروس المميزة</Text>
                    {lessons.slice(0, 3).map((lesson) => (
                        <Card
                            key={lesson.id}
                            style={styles.lessonCard}
                            onPress={() => navigation.navigate('LessonDetail', { lesson })}
                        >
                            <View style={styles.lessonContent}>
                                <Text style={styles.lessonIcon}>{lesson.icon}</Text>
                                <View style={styles.lessonInfo}>
                                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                                    <Text style={styles.lessonDescription}>{lesson.description}</Text>
                                    <View style={styles.lessonMeta}>
                                        <Text style={styles.lessonDuration}>⏱️ {lesson.duration}</Text>
                                        <Text style={styles.lessonLevel}>
                                            {lesson.level === 'beginner' ? '🟢 مبتدئ' : '🟡 متوسط'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </Card>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    greeting: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: theme.borderRadius.round,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 24,
    },
    progressCard: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    levelText: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    pointsText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    trophy: {
        fontSize: 40,
    },
    progressBar: {
        height: 8,
        backgroundColor: theme.colors.border,
        borderRadius: theme.borderRadius.round,
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
    },
    progressText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    quickAction: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.md,
    },
    quickActionIcon: {
        fontSize: 40,
        marginBottom: theme.spacing.sm,
    },
    quickActionText: {
        color: theme.colors.textLight,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
    },
    lessonCard: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    lessonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lessonIcon: {
        fontSize: 50,
        marginRight: theme.spacing.md,
    },
    lessonInfo: {
        flex: 1,
    },
    lessonTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    lessonDescription: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    lessonMeta: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    lessonDuration: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
    },
    lessonLevel: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
    },
});

export default HomeScreen;
