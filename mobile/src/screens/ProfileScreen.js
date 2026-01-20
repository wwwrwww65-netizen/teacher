import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Dimensions, 
    Alert,
    Animated 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../config/theme';

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [stats, setStats] = useState({
        totalSessions: 0,
        completedLessons: 0,
        totalPoints: 0,
        streak: 0,
        achievements: 0
    });

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        loadUserData();
        
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
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const loadUserData = async () => {
        try {
            // Load basic user data
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                setUser(JSON.parse(userData));
            }

            // Load nora_memory for detailed stats
            const memoryData = await AsyncStorage.getItem('nora_memory');
            if (memoryData) {
                const parsed = JSON.parse(memoryData);
                setUserProfile(parsed.userProfile || {});
                
                // Calculate stats
                setStats({
                    totalSessions: parsed.userProfile?.totalSessions || 0,
                    completedLessons: parsed.userProfile?.completedLessons || 0,
                    totalPoints: (parsed.userProfile?.totalSessions || 0) * 10,
                    streak: calculateStreak(parsed.userProfile?.lastSessionDate),
                    achievements: calculateAchievements(parsed.userProfile)
                });
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const calculateStreak = (lastSessionDate) => {
        if (!lastSessionDate) return 0;
        const lastDate = new Date(lastSessionDate);
        const today = new Date();
        const diffTime = Math.abs(today - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 1 ? 1 : 0; // Simple streak logic
    };

    const calculateAchievements = (profile) => {
        let count = 0;
        if (profile?.totalSessions >= 5) count++;
        if (profile?.totalSessions >= 10) count++;
        if (profile?.completedLessons >= 5) count++;
        if (profile?.completedLessons >= 10) count++;
        return count;
    };

    const handleLogout = async () => {
        Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
            { text: 'إلغاء', style: 'cancel' },
            {
                text: 'نعم',
                onPress: async () => {
                    await AsyncStorage.removeItem('user');
                    navigation.replace('StudentSetup');
                }
            }
        ]);
    };

    // Dynamic stickers based on achievements
    const getStickers = () => {
        const allStickers = [
            { id: 1, icon: '🦁', name: 'الأسد الشجاع', unlocked: true, requirement: 'البداية' },
            { id: 2, icon: '🚀', name: 'رائد الفضاء', unlocked: stats.totalSessions >= 5, requirement: '5 جلسات' },
            { id: 3, icon: '🎨', name: 'الفنان الصغير', unlocked: stats.completedLessons >= 3, requirement: '3 دروس' },
            { id: 4, icon: '👑', name: 'ملك الحروف', unlocked: stats.completedLessons >= 10, requirement: '10 دروس' },
            { id: 5, icon: '🌟', name: 'النجم الساطع', unlocked: stats.totalSessions >= 10, requirement: '10 جلسات' },
            { id: 6, icon: '🏆', name: 'البطل الخارق', unlocked: stats.totalPoints >= 100, requirement: '100 نقطة' },
            { id: 7, icon: '📚', name: 'عاشق القراءة', unlocked: stats.completedLessons >= 5, requirement: '5 دروس' },
            { id: 8, icon: '🎯', name: 'المثابر', unlocked: stats.streak >= 3, requirement: '3 أيام متتالية' },
            { id: 9, icon: '💎', name: 'الجوهرة النادرة', unlocked: stats.achievements >= 5, requirement: '5 إنجازات' },
        ];
        return allStickers;
    };

    const getLevelProgress = () => {
        if (!user) return 0;
        return ((user.points || 0) % 100) / 100;
    };

    const getNextLevelPoints = () => {
        if (!user) return 100;
        return 100 - ((user.points || 0) % 100);
    };

    const renderStickerGrid = () => {
        const stickers = getStickers();
        return (
            <View style={styles.stickerGrid}>
                {stickers.map((sticker, index) => (
                    <Animated.View
                        key={sticker.id}
                        style={{
                            opacity: fadeAnim,
                            transform: [{
                                scale: scaleAnim.interpolate({
                                    inputRange: [0.8, 1],
                                    outputRange: [0.8, 1]
                                })
                            }]
                        }}
                    >
                        <TouchableOpacity
                            style={[
                                styles.stickerCard,
                                !sticker.unlocked && styles.lockedSticker
                            ]}
                            activeOpacity={0.9}
                            onPress={() => {
                                if (!sticker.unlocked) {
                                    Alert.alert(
                                        sticker.name,
                                        `🔒 للحصول على هذا الملصق: ${sticker.requirement}`,
                                        [{ text: 'حسناً' }]
                                    );
                                }
                            }}
                        >
                            <LinearGradient
                                colors={
                                    sticker.unlocked 
                                        ? ['#FFD700', '#FFA500'] 
                                        : ['#CCCCCC', '#999999']
                                }
                                style={styles.stickerGradient}
                            >
                                <Text style={styles.stickerIcon}>
                                    {sticker.unlocked ? sticker.icon : '🔒'}
                                </Text>
                                {sticker.unlocked && (
                                    <View style={styles.stickerShine} />
                                )}
                            </LinearGradient>
                            <Text 
                                style={[
                                    styles.stickerName,
                                    !sticker.unlocked && styles.lockedText
                                ]} 
                                numberOfLines={2}
                            >
                                {sticker.name}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
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
                
                <Text style={styles.headerTitle}>غرفتي 🏠</Text>
                
                <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsButton}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                        style={styles.headerButton}
                    >
                        <Text style={styles.settingsIcon}>⚙️</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Hero Card - Avatar & Level */}
                <Animated.View 
                    style={[
                        styles.heroCard,
                        { 
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                        style={styles.heroGradient}
                    >
                        {/* Avatar */}
                        <View style={styles.avatarContainer}>
                            <LinearGradient
                                colors={['#FFD700', '#FFA500']}
                                style={styles.avatarRing}
                            >
                                <View style={styles.avatarInner}>
                                    <Text style={styles.avatarEmoji}>{user?.avatar || '🦁'}</Text>
                                </View>
                            </LinearGradient>
                            
                            {/* Level Badge */}
                            <View style={styles.levelBadge}>
                                <LinearGradient
                                    colors={['#FF6B6B', '#EE5A6F']}
                                    style={styles.levelGradient}
                                >
                                    <Text style={styles.levelText}>المستوى {user?.level || 1}</Text>
                                </LinearGradient>
                            </View>
                        </View>

                        {/* Name */}
                        <Text style={styles.heroName}>{userProfile?.name || user?.name || 'البطل'}</Text>
                        <Text style={styles.heroGrade}>{userProfile?.grade || 'KG1'}</Text>

                        {/* Progress Bar */}
                        <View style={styles.progressSection}>
                            <View style={styles.progressBar}>
                                <Animated.View 
                                    style={[
                                        styles.progressFill,
                                        { width: `${getLevelProgress() * 100}%` }
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressText}>
                                {getNextLevelPoints()} نقطة للمستوى التالي
                            </Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Stats Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 إحصائياتي</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <LinearGradient
                                colors={['#4ECDC4', '#44A08D']}
                                style={styles.statGradient}
                            >
                                <Text style={styles.statIcon}>🎯</Text>
                                <Text style={styles.statValue}>{stats.totalSessions}</Text>
                                <Text style={styles.statLabel}>جلسة</Text>
                            </LinearGradient>
                        </View>

                        <View style={styles.statCard}>
                            <LinearGradient
                                colors={['#FFD93D', '#F6C90E']}
                                style={styles.statGradient}
                            >
                                <Text style={styles.statIcon}>📚</Text>
                                <Text style={styles.statValue}>{stats.completedLessons}</Text>
                                <Text style={styles.statLabel}>درس مكتمل</Text>
                            </LinearGradient>
                        </View>

                        <View style={styles.statCard}>
                            <LinearGradient
                                colors={['#FF6B6B', '#EE5A6F']}
                                style={styles.statGradient}
                            >
                                <Text style={styles.statIcon}>⭐</Text>
                                <Text style={styles.statValue}>{user?.points || 0}</Text>
                                <Text style={styles.statLabel}>نقطة</Text>
                            </LinearGradient>
                        </View>

                        <View style={styles.statCard}>
                            <LinearGradient
                                colors={['#A8E6CF', '#7FCDBB']}
                                style={styles.statGradient}
                            >
                                <Text style={styles.statIcon}>🔥</Text>
                                <Text style={styles.statValue}>{stats.streak}</Text>
                                <Text style={styles.statLabel}>يوم متتالي</Text>
                            </LinearGradient>
                        </View>
                    </View>
                </View>

                {/* Achievements/Stickers */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🏆 مجموعة الملصقات</Text>
                        <View style={styles.achievementBadge}>
                            <Text style={styles.achievementText}>
                                {getStickers().filter(s => s.unlocked).length}/{getStickers().length}
                            </Text>
                        </View>
                    </View>
                    {renderStickerGrid()}
                </View>

                {/* Bottom Spacing */}
                <View style={{ height: 40 }} />
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
    settingsIcon: {
        fontSize: 20,
        color: '#FFFFFF',
    },
    logoutIcon: {
        fontSize: 20,
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
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    heroCard: {
        marginBottom: 24,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    heroGradient: {
        padding: 24,
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    avatarRing: {
        width: 140,
        height: 140,
        borderRadius: 70,
        padding: 6,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
    },
    avatarInner: {
        width: '100%',
        height: '100%',
        borderRadius: 64,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarEmoji: {
        fontSize: 64,
    },
    levelBadge: {
        position: 'absolute',
        bottom: -8,
        alignSelf: 'center',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    levelGradient: {
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    levelText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    heroName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    heroGrade: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 20,
    },
    progressSection: {
        width: '100%',
    },
    progressBar: {
        height: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
    },
    progressText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    achievementBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    achievementText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        width: (width - 52) / 2,
        aspectRatio: 1.3,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    statGradient: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    statLabel: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 4,
    },
    stickerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    stickerCard: {
        width: (width - 64) / 3,
        aspectRatio: 0.9,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    lockedSticker: {
        opacity: 0.6,
    },
    stickerGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        position: 'relative',
    },
    stickerIcon: {
        fontSize: 48,
        marginBottom: 4,
    },
    stickerShine: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    stickerName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 4,
        paddingHorizontal: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    lockedText: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
});

export default ProfileScreen;
