import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../components/Card';
import { theme } from '../config/theme';
import { lessons } from '../data/lessons';
import SubscriptionModal from '../components/SubscriptionModal';
import { subscriptionService } from '../services/SubscriptionService';

const HomeScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    
    // 🎨 Animated Background - Multiple layers
    const animatedValue1 = useRef(new Animated.Value(0)).current;
    const animatedValue2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        console.log('🏠 HomeScreen Mounted');
        loadUser();
        checkSubscription();

        // 🌈 Start gradient animations (different speeds)
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue1, {
                    toValue: 1,
                    duration: 4000, // ⚡ أسرع
                    useNativeDriver: false,
                }),
                Animated.timing(animatedValue1, {
                    toValue: 0,
                    duration: 4000,
                    useNativeDriver: false,
                }),
            ])
        ).start();

        // Layer 2 - slower
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue2, {
                    toValue: 1,
                    duration: 6000,
                    useNativeDriver: false,
                }),
                Animated.timing(animatedValue2, {
                    toValue: 0,
                    duration: 6000,
                    useNativeDriver: false,
                }),
            ])
        ).start();

        subscriptionService.onSubscriptionChange = (status) => {
            setIsSubscribed(status);
            if (status) {
                setShowSubscriptionModal(false);
            }
        };

        return () => {
            subscriptionService.onSubscriptionChange = null;
        };
    }, []);

    const checkSubscription = async () => {
        const subscribed = await subscriptionService.checkSubscriptionStatus();
        setIsSubscribed(subscribed);
    };

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

    // 🎨 Animated colors - more contrast
    const backgroundColor1 = animatedValue1.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['#0f0c29', '#302b63', '#0f0c29'] // Deep purple to blue
    });

    const backgroundColor2 = animatedValue2.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['#24243e', '#0f0c29', '#24243e'] // Overlay layer
    });

    return (
        <View style={{ flex: 1 }}>
            {/* 🌈 Animated Background - Layer 1 */}
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: backgroundColor1 }]} />
            
            {/* 🌈 Animated Background - Layer 2 (overlay) */}
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: backgroundColor2, opacity: 0.5 }]} />

            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            <SubscriptionModal 
                visible={showSubscriptionModal} 
                onClose={() => setShowSubscriptionModal(false)} 
            />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>مرحباً، {user?.name || 'طالب'}! 👋</Text>
                    <Text style={styles.subtitle}>جاهز للتعلم اليوم؟</Text>
                </View>
                
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                    {!isSubscribed && (
                        <TouchableOpacity 
                            style={styles.premiumButton}
                            onPress={() => setShowSubscriptionModal(true)}
                        >
                            <Text style={styles.premiumButtonText}>💎 اشترك</Text>
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                        style={styles.avatar}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Text style={styles.avatarText}>{user?.avatar || '👤'}</Text>
                    </TouchableOpacity>
                </View>
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
                contentContainerStyle={{ paddingBottom: 50 }}
            >
                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ابدأ التعلم</Text>
                    <View style={styles.quickActions}>

                        {/* New Lessons Button */}
                        <TouchableOpacity
                            style={[styles.quickAction, { backgroundColor: theme.colors.primary }]}
                            onPress={() => navigation.navigate('Curriculum')}
                        >
                            <Text style={styles.quickActionIcon}>📚</Text>
                            <Text style={styles.quickActionText}>الدروس</Text>
                        </TouchableOpacity>

                        {/* Renamed Adventure Map Button */}
                        <TouchableOpacity
                            style={[styles.quickAction, { backgroundColor: '#FFB74D' }]} // Orange for adventure
                            onPress={() => navigation.navigate('Lessons')}
                        >
                            <Text style={styles.quickActionIcon}>🗺️</Text>
                            <Text style={styles.quickActionText}>الخريطة</Text>
                        </TouchableOpacity>

                        {/* Teacher Button (Classroom) - kept for free talk? or maybe secondary? */}
                        <TouchableOpacity
                            style={[styles.quickAction, { backgroundColor: theme.colors.secondary }]}
                            onPress={() => navigation.navigate('Classroom')}
                        >
                            <Text style={styles.quickActionIcon}>🤖</Text>
                            <Text style={styles.quickActionText}>المعلم</Text>
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
                    ))
                }
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 50,
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // 🌑 أغمق للوضوح
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    greeting: {
        fontSize: theme.fontSize.xl,
        fontWeight: 'bold',
        color: '#FFFFFF', // ⚪ أبيض
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 5,
    },
    subtitle: {
        fontSize: theme.fontSize.md,
        color: 'rgba(255, 255, 255, 0.95)',
        marginTop: theme.spacing.xs,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.25)', // ❄️ ثلجي
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5
    },
    avatarText: {
        fontSize: 24,
    },
    progressCard: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // 🌑 أغمق للوضوح
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 10
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    levelText: {
        fontSize: theme.fontSize.lg,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(135, 206, 235, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    pointsText: {
        fontSize: theme.fontSize.sm,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: theme.spacing.xs,
    },
    trophy: {
        fontSize: 40,
    },
    progressBar: {
        height: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FFD700', // 🌟 ذهبي
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    progressText: {
        fontSize: theme.fontSize.xs,
        color: 'rgba(255, 255, 255, 0.9)',
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
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        textShadowColor: 'rgba(135, 206, 235, 0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    quickAction: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // 🌑 أغمق للوضوح
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 15,
        elevation: 8
    },
    quickActionIcon: {
        fontSize: 40,
        marginBottom: theme.spacing.sm,
    },
    quickActionText: {
        color: '#FFFFFF',
        fontSize: theme.fontSize.sm,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    lessonCard: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        backgroundColor: 'rgba(0, 0, 0, 0.45)', // 🌑 أغمق للوضوح
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 15,
        padding: 15,
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 6
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
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: theme.spacing.xs,
    },
    lessonDescription: {
        fontSize: theme.fontSize.sm,
        color: 'rgba(255, 255, 255, 0.85)',
        marginBottom: theme.spacing.sm,
    },
    lessonMeta: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    lessonDuration: {
        fontSize: theme.fontSize.xs,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    lessonLevel: {
        fontSize: theme.fontSize.xs,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    premiumButton: {
        backgroundColor: 'rgba(255, 215, 0, 0.3)', // 🌟 ذهبي شفاف
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 2,
        borderColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    premiumButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
        textShadowColor: 'rgba(255, 215, 0, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 5,
    },
});

export default HomeScreen;
