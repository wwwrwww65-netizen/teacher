console.log('🗺️ LessonsScreen Module Loaded');
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Alert,
    Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../config/theme';

const { width, height } = Dimensions.get('window');

// 🗺️ قالب المراحل - خريطة المغامرات
const LEVELS_TEMPLATE = [
    { 
        id: 1, 
        type: 'game', 
        title: 'صياد الحروف', 
        target: 'أ', 
        icon: '🎯', 
        x: width * 0.5, 
        y: 100,
        color: ['#FF6B6B', '#EE5A6F']
    },
    { 
        id: 2, 
        type: 'game', 
        title: 'فقع البالونات', 
        target: 'ب', 
        icon: '🎈', 
        x: width * 0.3, 
        y: 250,
        color: ['#4ECDC4', '#44A08D']
    },
    { 
        id: 3, 
        type: 'game', 
        title: 'حرف التاء', 
        target: 'ت', 
        icon: '🌟', 
        x: width * 0.7, 
        y: 400,
        color: ['#FFD93D', '#F6C90E']
    },
    { 
        id: 4, 
        type: 'game', 
        title: 'قلعة الثاء', 
        target: 'ث', 
        icon: '🏰', 
        x: width * 0.4, 
        y: 550,
        color: ['#A8E6CF', '#7FCDBB']
    },
    { 
        id: 5, 
        type: 'game', 
        title: 'كنز الجيم', 
        target: 'ج', 
        icon: '💎', 
        x: width * 0.6, 
        y: 700,
        color: ['#667eea', '#764ba2']
    },
    { 
        id: 6, 
        type: 'game', 
        title: 'جبل الحاء', 
        target: 'ح', 
        icon: '⛰️', 
        x: width * 0.3, 
        y: 850,
        color: ['#FF8A80', '#FF5252']
    },
    { 
        id: 7, 
        type: 'game', 
        title: 'بحر الخاء', 
        target: 'خ', 
        icon: '🌊', 
        x: width * 0.7, 
        y: 1000,
        color: ['#80D8FF', '#40C4FF']
    },
];

const LessonsScreen = ({ navigation }) => {
    console.log('🗺️ LessonsScreen Rendering...');
    
    const [levels, setLevels] = useState([]);
    const [selectedLevel, setSelectedLevel] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const pulseAnims = useRef(LEVELS_TEMPLATE.map(() => new Animated.Value(1))).current;

    // ✅ Reload progress every time screen comes into focus
    useFocusEffect(
        useCallback(() => {
            console.log('🗺️ LessonsScreen Focused - Reloading Progress');
            loadProgress();
        }, [])
    );

    useEffect(() => {
        if (levels.length > 0) {
            startAnimations();
        }
    }, [levels]);

    const loadProgress = async () => {
        try {
            // تحميل بيانات التقدم من AsyncStorage
            const memoryData = await AsyncStorage.getItem('nora_memory');
            let completedLessons = [];
            
            if (memoryData) {
                const parsed = JSON.parse(memoryData);
                completedLessons = parsed.completedLessons || [];
            }

            // دمج البيانات الحقيقية مع القالب
            const updatedLevels = LEVELS_TEMPLATE.map((level, index) => {
                const lessonData = completedLessons.find(l => l.levelId === level.id);
                const isCompleted = !!lessonData;
                const previousCompleted = index === 0 || completedLessons.some(l => l.levelId === LEVELS_TEMPLATE[index - 1].id);
                
                return {
                    ...level,
                    locked: index > 0 && !previousCompleted, // المرحلة الأولى دائماً مفتوحة
                    completed: isCompleted,
                    stars: lessonData?.stars || 0,
                };
            });

            setLevels(updatedLevels);
            console.log('✅ Progress loaded:', updatedLevels);
        } catch (error) {
            console.error('Error loading progress:', error);
            // في حالة الخطأ، استخدم البيانات الافتراضية
            const defaultLevels = LEVELS_TEMPLATE.map((level, index) => ({
                ...level,
                locked: index > 0, // كل المراحل مقفلة ما عدا الأولى
                completed: false,
                stars: 0,
            }));
            setLevels(defaultLevels);
        }
    };

    const startAnimations = () => {
        
        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animations for unlocked levels
        levels.forEach((level, index) => {
            if (!level.locked) {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(pulseAnims[index], {
                            toValue: 1.1,
                            duration: 1000 + (index * 200),
                            useNativeDriver: true,
                        }),
                        Animated.timing(pulseAnims[index], {
                            toValue: 1,
                            duration: 1000 + (index * 200),
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
            }
        });
    };

    const handleLevelPress = (level) => {
        console.log('📍 Level Pressed:', level.id, 'Locked:', level.locked);
        
        if (level.locked) {
            console.log('🔒 Level is locked');
            Alert.alert(
                '🔒 مرحلة مقفلة',
                'أكمل المراحل السابقة لفتح هذه المرحلة!',
                [{ text: 'حسناً', style: 'default' }]
            );
            return;
        }

        setSelectedLevel(level);
        
        // Navigate after a short delay to show selection
        setTimeout(() => {
            if (level.type === 'game') {
                console.log('🎮 Navigating to MiniGame with params:', {
                    targetLetter: level.target,
                    level: level.id
                });
                navigation.navigate('MiniGame', {
                    targetLetter: level.target,
                    distractors: ['س', 'ش', 'ص', 'ع'],
                    level: level.id
                });
            }
            setSelectedLevel(null);
        }, 300);
    };

    // رسم المسارات بين المراحل
    const renderPaths = () => {
        return (
            <Svg height={1200} width={width} style={styles.pathsLayer} pointerEvents="none">
                <Defs>
                    <SvgLinearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
                        <Stop offset="100%" stopColor="#FFA500" stopOpacity="0.8" />
                    </SvgLinearGradient>
                    <SvgLinearGradient id="lockedPathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#CCCCCC" stopOpacity="0.5" />
                        <Stop offset="100%" stopColor="#999999" stopOpacity="0.5" />
                    </SvgLinearGradient>
                </Defs>
                
                {levels.map((level, index) => {
                    if (index === levels.length - 1) return null;
                    const next = levels[index + 1];
                    
                    // حساب منحنى بسيط للمسار
                    const midX = (level.x + next.x) / 2;
                    const midY = (level.y + next.y) / 2;
                    const controlX = midX + (Math.random() - 0.5) * 50;
                    const controlY = midY - 50;
                    
                    const pathData = `M ${level.x} ${level.y} Q ${controlX} ${controlY} ${next.x} ${next.y}`;
                    
                    return (
                        <Path
                            key={`path-${index}`}
                            d={pathData}
                            stroke={level.locked ? "url(#lockedPathGradient)" : "url(#pathGradient)"}
                            strokeWidth="6"
                            strokeDasharray={level.locked ? "10, 5" : "0"}
                            strokeLinecap="round"
                            fill="none"
                        />
                    );
                })}
            </Svg>
        );
    };

    // رسم المرحلة
    const renderLevel = (level, index) => {
        const isSelected = selectedLevel?.id === level.id;
        
        return (
            <Animated.View
                key={level.id}
                style={[
                    styles.levelContainer,
                    {
                        left: level.x - 50,
                        top: level.y - 50,
                        opacity: fadeAnim,
                        transform: [
                            { scale: pulseAnims[index] },
                            { translateY: slideAnim }
                        ],
                    },
                ]}
            >
                <TouchableOpacity
                    onPress={() => handleLevelPress(level)}
                    activeOpacity={0.9}
                    disabled={level.locked}
                >
                    {/* الهالة المتوهجة */}
                    {!level.locked && (
                        <View style={styles.glowContainer}>
                            <LinearGradient
                                colors={[...level.color, 'transparent']}
                                style={styles.glow}
                            />
                        </View>
                    )}
                    
                    {/* المرحلة نفسها */}
                    <View style={[styles.levelNode, isSelected && styles.levelNodeSelected]}>
                        <LinearGradient
                            colors={level.locked ? ['#CCCCCC', '#999999'] : level.color}
                            style={styles.levelGradient}
                        >
                            <Text style={styles.levelIcon}>{level.locked ? '🔒' : level.icon}</Text>
                            
                            {/* رقم المرحلة */}
                            <View style={styles.levelNumber}>
                                <Text style={styles.levelNumberText}>{level.id}</Text>
                            </View>
                        </LinearGradient>
                    </View>
                    
                    {/* عنوان المرحلة */}
                    <View style={styles.levelTitleContainer}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                            style={styles.levelTitleGradient}
                        >
                            <Text style={styles.levelTitle} numberOfLines={1}>
                                {level.title}
                            </Text>
                        </LinearGradient>
                    </View>
                    
                    {/* النجوم */}
                    {!level.locked && level.completed && (
                        <View style={styles.starsContainer}>
                            {[1, 2, 3].map((star) => (
                                <Text key={star} style={styles.star}>
                                    {star <= level.stars ? '⭐' : '☆'}
                                </Text>
                            ))}
                        </View>
                    )}
                    
                    {/* شارة "جديد" */}
                    {!level.locked && !level.completed && (
                        <View style={styles.newBadge}>
                            <LinearGradient
                                colors={['#FF6B6B', '#EE5A6F']}
                                style={styles.newBadgeGradient}
                            >
                                <Text style={styles.newBadgeText}>جديد!</Text>
                            </LinearGradient>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            {/* خلفية متدرجة */}
            <LinearGradient
                colors={['#667eea', '#764ba2', '#f093fb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                        style={styles.headerButton}
                    >
                        <Text style={styles.backIcon}>←</Text>
                    </LinearGradient>
                </TouchableOpacity>
                
                <Text style={styles.headerTitle}>🗺️ خريطة المغامرات</Text>
                
                <View style={{ width: 44 }} />
            </View>

            {/* Progress Bar */}
            <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                    style={styles.progressGradient}
                >
                    <View style={styles.progressInfo}>
                        <Text style={styles.progressLabel}>التقدم الكلي</Text>
                        <Text style={styles.progressValue}>
                            {levels.filter(l => l.completed).length} / {levels.length}
                        </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBar}>
                            <Animated.View 
                                style={[
                                    styles.progressFill,
                                    { 
                                        width: `${levels.length > 0 ? (levels.filter(l => l.completed).length / levels.length) * 100 : 0}%` 
                                    }
                                ]} 
                            />
                        </View>
                    </View>
                </LinearGradient>
            </Animated.View>

            {/* Map Container */}
            <ScrollView 
                contentContainerStyle={styles.mapContainer}
                showsVerticalScrollIndicator={false}
            >
                {renderPaths()}
                {levels.map((level, index) => renderLevel(level, index))}
                
                {/* Extra space at bottom */}
                <View style={{ height: 200 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    progressContainer: {
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    progressGradient: {
        padding: 16,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
    },
    progressValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    progressBarContainer: {
        width: '100%',
    },
    progressBar: {
        height: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FFD700',
        borderRadius: 10,
    },
    mapContainer: {
        minHeight: 1200,
        paddingVertical: 20,
        position: 'relative',
    },
    pathsLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
    },
    levelContainer: {
        position: 'absolute',
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    glowContainer: {
        position: 'absolute',
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
        opacity: 0.4,
    },
    levelNode: {
        width: 90,
        height: 90,
        borderRadius: 45,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    levelNodeSelected: {
        shadowColor: '#FFD700',
        shadowOpacity: 0.8,
        shadowRadius: 16,
        elevation: 12,
    },
    levelGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        borderRadius: 45,
    },
    levelIcon: {
        fontSize: 40,
    },
    levelNumber: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelNumberText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    levelTitleContainer: {
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    levelTitleGradient: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    levelTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        marginTop: 4,
        gap: 2,
    },
    star: {
        fontSize: 14,
    },
    newBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 6,
    },
    newBadgeGradient: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    newBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});

export default LessonsScreen;
