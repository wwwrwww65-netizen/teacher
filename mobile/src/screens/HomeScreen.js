import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    StatusBar, 
    Animated, 
    Dimensions,
    ImageBackground,
    Modal,
    TouchableWithoutFeedback,
    BackHandler,
    Alert,
    Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Card from '../components/Card';
import { theme } from '../config/theme';
import { lessons } from '../data/lessons';
import { subscriptionService } from '../services/SubscriptionService';
import GlobalAudioService from '../services/GlobalAudioService';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    
    // 🎵 Audio State
    const [showAudioSettings, setShowAudioSettings] = useState(false);
    const [volume, setVolume] = useState(GlobalAudioService.volume);
    const [isMusicMuted, setIsMusicMuted] = useState(GlobalAudioService.isMuted);
    const [isSfxEnabled, setIsSfxEnabled] = useState(GlobalAudioService.isSfxEnabled);

    const [showExitModal, setShowExitModal] = useState(false);

    // 🔙 Handle Back Press
    useEffect(() => {
        const backAction = () => {
            // Priority 1: Close Audio Settings if open
            if (showAudioSettings) {
                setShowAudioSettings(false);
                return true;
            }

            // Priority 2: Show Custom Exit Modal
            if (showExitModal) {
                 // If already showing, do nothing or let it stay
                 return true;
            }

            if (navigation.isFocused()) {
                setShowExitModal(true);
                return true; 
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, [showAudioSettings, showExitModal, navigation]);

    // 🔊 Volume Control
    const changeVolume = (change) => {
        const newVol = Math.max(0, Math.min(1, volume + change));
        setVolume(newVol);
        GlobalAudioService.setVolume(newVol);
        GlobalAudioService.playClickSound(); // Feedback
    };

    // 🎵 Toggle Music
    const toggleMusic = () => {
        GlobalAudioService.playClickSound();
        const newState = GlobalAudioService.toggleMusic();
        setIsMusicMuted(newState);
    };

    // 👆 Toggle SFX
    const toggleSfx = () => {
        const newState = GlobalAudioService.toggleSfx();
        setIsSfxEnabled(newState);
        if (newState) GlobalAudioService.playClickSound();
    };
// ... inside return ...
                            <TouchableOpacity 
                                onPress={() => {
                                    GlobalAudioService.playClickSound();
                                    setShowAudioSettings(true);
                                }} 
                                style={[styles.musicBtn, { backgroundColor: isMusicMuted ? 'rgba(255,107,107,0.4)' : 'rgba(78,205,196,0.4)' }]}
                            >
                                <Ionicons name="settings" size={20} color="#FFF" />
                            </TouchableOpacity>
// ... at end of render, before closing View ...
            {/* 🎚️ Audio Settings Modal */}
            <Modal
                visible={showAudioSettings}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAudioSettings(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowAudioSettings(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.audioModal}>
                                <LinearGradient
                                    colors={['#2c3e50', '#34495e']}
                                    style={styles.audioModalGradient}
                                >
                                    <Text style={styles.modalTitle}>🔊 إعدادات الصوت</Text>
                                    
                                    {/* Volume Slider Control */}
                                    <View style={styles.controlRow}>
                                        <Text style={styles.controlLabel}>مستوى الصوت</Text>
                                        <View style={styles.volumeControl}>
                                            <TouchableOpacity onPress={() => changeVolume(-0.1)} style={styles.volBtn}>
                                                <Ionicons name="remove" size={20} color="#FFF" />
                                            </TouchableOpacity>
                                            
                                            <View style={styles.volBarContainer}>
                                                <View style={[styles.volBarFill, { width: `${volume * 100}%` }]} />
                                            </View>
                                            
                                            <TouchableOpacity onPress={() => changeVolume(0.1)} style={styles.volBtn}>
                                                <Ionicons name="add" size={20} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Music Toggle */}
                                    <View style={styles.controlRow}>
                                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                            <Ionicons name="musical-notes" size={20} color="#4ECDC4" style={{marginRight: 8}} />
                                            <Text style={styles.controlLabel}>موسيقى الخلفية</Text>
                                        </View>
                                        <TouchableOpacity 
                                            onPress={toggleMusic}
                                            style={[styles.toggleBtn, { backgroundColor: !isMusicMuted ? '#4ECDC4' : '#555' }]}
                                        >
                                            <View style={[styles.toggleCircle, { alignSelf: !isMusicMuted ? 'flex-end' : 'flex-start' }]} />
                                        </TouchableOpacity>
                                    </View>

                                    {/* SFX Toggle */}
                                    <View style={styles.controlRow}>
                                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                            <Ionicons name="finger-print" size={20} color="#FFD93D" style={{marginRight: 8}} />
                                            <Text style={styles.controlLabel}>مؤثرات النقر</Text>
                                        </View>
                                        <TouchableOpacity 
                                            onPress={toggleSfx}
                                            style={[styles.toggleBtn, { backgroundColor: isSfxEnabled ? '#FFD93D' : '#555' }]}
                                        >
                                            <View style={[styles.toggleCircle, { alignSelf: isSfxEnabled ? 'flex-end' : 'flex-start' }]} />
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity 
                                        style={styles.closeModalBtn}
                                        onPress={() => setShowAudioSettings(false)}
                                    >
                                        <Text style={styles.closeModalText}>إغلاق</Text>
                                    </TouchableOpacity>
                                </LinearGradient>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
    
    // 🎨 Multiple animated values for complex animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        console.log('🏠 HomeScreen Mounted');
        loadUser();
        checkSubscription();

        // 🎬 Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // 🌟 Continuous pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // 🎈 Float animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -10,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        subscriptionService.onSubscriptionChange = (status) => {
            setIsSubscribed(status);
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

    return (
        <View style={styles.container}>
            {/* 🌌 Animated Gradient Background */}
            <LinearGradient
                colors={['#1a1a2e', '#16213e', '#0f3460', '#533483']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* ✨ Floating particles effect (decorative circles) */}
            <View style={StyleSheet.absoluteFill}>
                <Animated.View 
                    style={[
                        styles.particle, 
                        { 
                            top: '10%', 
                            left: '10%',
                            transform: [{ translateY: floatAnim }]
                        }
                    ]} 
                />
                <Animated.View 
                    style={[
                        styles.particle, 
                        { 
                            top: '30%', 
                            right: '15%',
                            transform: [{ 
                                translateY: floatAnim.interpolate({
                                    inputRange: [-10, 0],
                                    outputRange: [0, -10]
                                })
                            }]
                        }
                    ]} 
                />
                <Animated.View 
                    style={[
                        styles.particle, 
                        { 
                            bottom: '20%', 
                            left: '20%',
                            transform: [{ translateY: floatAnim }]
                        }
                    ]} 
                />
            </View>

            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                {/* 🎯 Header with Hero Section */}
                <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <View style={styles.greetingContainer}>
                            <Animated.Text 
                                style={[
                                    styles.greeting,
                                    { transform: [{ scale: scaleAnim }] }
                                ]}
                            >
                                مرحباً {user?.name || 'بطل'}! 👋
                            </Animated.Text>
                            <Text style={styles.subtitle}>استعد لمغامرة تعليمية رائعة</Text>
                        </View>

                        {/* Right Side: Pro + Avatar/Music Column */}
                        {/* Right Side: Pro + Avatar/Music Column */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            
                            {/* 👑 PRO Badge - Pulsing & Shining */}
                            <Animated.View 
                                style={{ 
                                    transform: [{ scale: pulseAnim }],
                                    marginRight: 10, 
                                    marginTop: 15,
                                    shadowColor: '#FFD700',
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.8,
                                    shadowRadius: 10,
                                    elevation: 10
                                }}
                            >
                                <TouchableOpacity
                                    style={[styles.premiumBadge, { minWidth: 65, borderWidth: 1, borderColor: '#FFF' }]}
                                    onPress={() => navigation.navigate('Subscription')}
                                >
                                    <LinearGradient
                                        colors={['#FFD700', '#FDB931', '#FFD700']} // Gold Shine Gradient
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.premiumGradient}
                                    >
                                        <Text style={styles.premiumText}>👑 PRO</Text>
                                        
                                        {/* ✨ Subtle Shine Overlay */}
                                        <View style={{
                                            position: 'absolute',
                                            top: -10,
                                            right: -10,
                                            width: 30,
                                            height: 50,
                                            backgroundColor: 'rgba(255,255,255,0.3)',
                                            transform: [{ rotate: '25deg' }]
                                        }} />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>

                            {/* 👤 Avatar & 🎵 Music Stack */}
                            <View style={{ alignItems: 'center', gap: 16 }}>
                                <TouchableOpacity
                                    style={styles.avatar}
                                    onPress={() => navigation.navigate('Profile')}
                                >
                                    <LinearGradient
                                        colors={['#667eea', '#764ba2']}
                                        style={styles.avatarGradient}
                                    >
                                        <Text style={styles.avatarText}>{user?.avatar || '🦁'}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    onPress={() => {
                                        GlobalAudioService.playClickSound();
                                        setShowAudioSettings(true);
                                    }} 
                                    style={[styles.musicBtn, { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(78,205,196,0.3)', borderWidth: 1 }]}
                                >
                                    <Ionicons name={isMusicMuted ? "volume-mute" : "musical-notes"} size={16} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* 🏆 Inline Stats */}
                    <View style={styles.inlineStats}>
                        <View style={styles.statBubble}>
                            <Text style={styles.statIcon}>🎯</Text>
                            <View>
                                <Text style={styles.statValue}>{user?.level || 1}</Text>
                                <Text style={styles.statLabel}>المستوى</Text>
                            </View>
                        </View>
                        
                        <View style={styles.statBubble}>
                            <Text style={styles.statIcon}>⭐</Text>
                            <View>
                                <Text style={styles.statValue}>{user?.points || 0}</Text>
                                <Text style={styles.statLabel}>نقطة</Text>
                            </View>
                        </View>
                        
                        <View style={styles.statBubble}>
                            <Text style={styles.statIcon}>🏆</Text>
                            <View>
                                <Text style={styles.statValue}>{Math.floor((user?.points || 0) / 50)}</Text>
                                <Text style={styles.statLabel}>إنجاز</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* 📊 Progress Card with Glow */}
                    <Animated.View 
                        style={[
                            styles.progressCardContainer,
                            { transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
                        ]}
                    >
                        <LinearGradient
                            colors={['#FF6B6B', '#FF8E53', '#FFA726']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.progressCard}
                        >
                            <View style={styles.progressContent}>
                                <Text style={styles.progressTitle}>تقدمك نحو المستوى التالي</Text>
                                <View style={styles.progressBarContainer}>
                                    <View style={styles.progressBar}>
                                        <Animated.View 
                                            style={[
                                                styles.progressFill, 
                                                { width: `${getLevelProgress() * 100}%` }
                                            ]} 
                                        />
                                    </View>
                                    <Text style={styles.progressPercentage}>
                                        {Math.round(getLevelProgress() * 100)}%
                                    </Text>
                                </View>
                                <Text style={styles.progressSubtext}>
                                    {100 - (user?.points || 0) % 100} نقطة متبقية 🚀
                                </Text>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* 🎮 Main Action Cards */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🌟 ابدأ التعلم الآن</Text>
                        
                        {/* Hero Card - Teacher Nora */}
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <TouchableOpacity
                                style={styles.heroCard}
                                onPress={() => navigation.navigate('Classroom')}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2', '#f093fb']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.heroGradient}
                                >
                                    <View style={styles.heroContent}>
                                        <View style={styles.heroLeft}>
                                            <Image 
                                                source={require('../assets/homee.png')} 
                                                style={{ 
                                                    width: 140, 
                                                    height: 140, 
                                                    marginRight: 5,
                                                    marginTop: -20,
                                                    marginBottom: -20,
                                                    marginLeft: -10
                                                }} 
                                                resizeMode="contain"
                                            />
                                            <View>
                                                <Text style={styles.heroTitle}>المعلمة نورا</Text>
                                                <Text style={styles.heroSubtitle}>تعلم بالذكاء الاصطناعي</Text>
                                                <View style={styles.heroBadge}>
                                                    <Text style={styles.heroBadgeText}>🔥 الأكثر شعبية</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <Text style={styles.heroArrow}>→</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Grid Cards */}
                        <View style={styles.gridCards}>
                            <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
                                <TouchableOpacity
                                    style={styles.gridCard}
                                    onPress={() => navigation.navigate('Lessons')}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={['#4ECDC4', '#44A08D']}
                                        style={styles.gridGradient}
                                    >
                                        <Text style={styles.gridIcon}>🗺️</Text>
                                        <Text style={styles.gridTitle}>خريطة المغامرات</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>

                            <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
                                <TouchableOpacity
                                    style={styles.gridCard}
                                    onPress={() => navigation.navigate('Curriculum')}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={['#FFD93D', '#F6C90E']}
                                        style={styles.gridGradient}
                                    >
                                        <Text style={styles.gridIcon}>📚</Text>
                                        <Text style={styles.gridTitle}>المنهج الدراسي</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    </View>

                    {/* 📖 Featured Lessons */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>🎯 الدروس المميزة</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Curriculum')}>
                                <Text style={styles.seeAll}>عرض الكل ←</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {lessons.slice(0, 3).map((lesson, index) => (
                            <Animated.View
                                key={lesson.id}
                                style={{
                                    opacity: fadeAnim,
                                    transform: [{
                                        translateX: slideAnim.interpolate({
                                            inputRange: [0, 50],
                                            outputRange: [0, 100]
                                        })
                                    }]
                                }}
                            >
                                <TouchableOpacity
                                    style={styles.lessonCard}
                                    onPress={() => navigation.navigate('LessonDetail', { lesson })}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={
                                            index === 0 ? ['#FF6B6B', '#EE5A6F'] :
                                            index === 1 ? ['#4ECDC4', '#44A08D'] :
                                            ['#A8E6CF', '#7FCDBB']
                                        }
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.lessonGradient}
                                    >
                                        <View style={styles.lessonIconBox}>
                                            <Text style={styles.lessonIcon}>{lesson.icon}</Text>
                                        </View>
                                        <View style={styles.lessonInfo}>
                                            <Text style={styles.lessonTitle} numberOfLines={1}>
                                                {lesson.title}
                                            </Text>
                                            <Text style={styles.lessonDescription} numberOfLines={2}>
                                                {lesson.description}
                                            </Text>
                                            <View style={styles.lessonFooter}>
                                                <View style={styles.lessonBadge}>
                                                    <Text style={styles.badgeText}>⏱️ {lesson.duration}</Text>
                                                </View>
                                                <View style={styles.lessonBadge}>
                                                    <Text style={styles.badgeText}>
                                                        {lesson.level === 'beginner' ? '🟢 مبتدئ' : '🟡 متوسط'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.lessonArrowContainer}>
                                            <Text style={styles.lessonArrow}>→</Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </View>

                    {/* 🎁 Bottom Spacing */}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </Animated.View>
            {/* 🎚️ Audio Settings Modal */}
            <Modal
                visible={showAudioSettings}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAudioSettings(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowAudioSettings(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.audioModal}>
                                <LinearGradient
                                    colors={['#2c3e50', '#34495e']}
                                    style={styles.audioModalGradient}
                                >
                                    <Text style={styles.modalTitle}>🔊 إعدادات الصوت</Text>
                                    
                                    {/* Volume Slider Control */}
                                    <View style={styles.controlRow}>
                                        <Text style={styles.controlLabel}>مستوى الصوت</Text>
                                        <View style={styles.volumeControl}>
                                            <TouchableOpacity onPress={() => changeVolume(-0.1)} style={styles.volBtn}>
                                                <Ionicons name="remove" size={20} color="#FFF" />
                                            </TouchableOpacity>
                                            
                                            <View style={styles.volBarContainer}>
                                                <View style={[styles.volBarFill, { width: `${volume * 100}%` }]} />
                                            </View>
                                            
                                            <TouchableOpacity onPress={() => changeVolume(0.1)} style={styles.volBtn}>
                                                <Ionicons name="add" size={20} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Music Toggle */}
                                    <View style={styles.controlRow}>
                                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                            <Ionicons name="musical-notes" size={20} color="#4ECDC4" style={{marginRight: 8}} />
                                            <Text style={styles.controlLabel}>موسيقى الخلفية</Text>
                                        </View>
                                        <TouchableOpacity 
                                            onPress={toggleMusic}
                                            style={[styles.toggleBtn, { backgroundColor: !isMusicMuted ? '#4ECDC4' : '#555' }]}
                                        >
                                            <View style={[styles.toggleCircle, { alignSelf: !isMusicMuted ? 'flex-end' : 'flex-start' }]} />
                                        </TouchableOpacity>
                                    </View>

                                    {/* SFX Toggle */}
                                    <View style={styles.controlRow}>
                                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                            <Ionicons name="finger-print" size={20} color="#FFD93D" style={{marginRight: 8}} />
                                            <Text style={styles.controlLabel}>مؤثرات النقر</Text>
                                        </View>
                                        <TouchableOpacity 
                                            onPress={toggleSfx}
                                            style={[styles.toggleBtn, { backgroundColor: isSfxEnabled ? '#FFD93D' : '#555' }]}
                                        >
                                            <View style={[styles.toggleCircle, { alignSelf: isSfxEnabled ? 'flex-end' : 'flex-start' }]} />
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity 
                                        style={styles.closeModalBtn}
                                        onPress={() => setShowAudioSettings(false)}
                                    >
                                        <Text style={styles.closeModalText}>إغلاق</Text>
                                    </TouchableOpacity>
                                </LinearGradient>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
            
            {/* 🚪 Custom Exit Confirmation Modal */}
            <Modal
                visible={showExitModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowExitModal(false)} // Android back button on modal
            >
                <TouchableWithoutFeedback onPress={() => setShowExitModal(false)}>
                    <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center'}}>
                        <TouchableWithoutFeedback>
                            <View style={{
                                width: '85%',
                                backgroundColor: '#FFF',
                                borderRadius: 25,
                                padding: 25,
                                alignItems: 'center',
                                elevation: 20,
                                shadowColor: '#000',
                                shadowOffset: {width: 0, height: 10},
                                shadowOpacity: 0.3,
                                shadowRadius: 20
                            }}>
                                <View style={{
                                    width: 60, height: 60, borderRadius: 30, 
                                    backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center',
                                    marginBottom: 15
                                }}>
                                    <Text style={{fontSize: 30}}>👋</Text>
                                </View>
                                
                                <Text style={{
                                    fontSize: 22, fontWeight: 'bold', color: '#333', 
                                    marginBottom: 10, textAlign: 'center',
                                    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium'
                                }}>
                                    هل تود المغادرة؟
                                </Text>
                                
                                <Text style={{
                                    fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 25, lineHeight: 22
                                }}>
                                    سنشتاق إليك! هل أنت متأكد من رغبتك في إغلاق التطبيق؟
                                </Text>

                                <View style={{flexDirection: 'row', gap: 15, width: '100%'}}>
                                    <TouchableOpacity 
                                        style={{
                                            flex: 1, paddingVertical: 12, borderRadius: 15, 
                                            backgroundColor: '#F5F5F5', alignItems: 'center'
                                        }}
                                        onPress={() => setShowExitModal(false)}
                                    >
                                        <Text style={{fontSize: 16, fontWeight: 'bold', color: '#666'}}>إلغاء</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={{
                                            flex: 1, paddingVertical: 12, borderRadius: 15, 
                                            backgroundColor: '#FF6B6B', alignItems: 'center'
                                        }}
                                        onPress={() => BackHandler.exitApp()}
                                    >
                                        <Text style={{fontSize: 16, fontWeight: 'bold', color: '#FFF'}}>نعم، خروج</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    particle: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    header: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    greetingContainer: {
        flex: 1,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.85)',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    musicBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    premiumBadge: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
    },
    premiumGradient: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    premiumText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    avatarGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 28,
    },
    inlineStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 8,
    },
    statBubble: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 16,
        padding: 12,
        gap: 8,
    },
    statIcon: {
        fontSize: 24,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 20,
    },
    progressCardContainer: {
        marginHorizontal: 20,
        marginBottom: 24,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    progressCard: {
        padding: 20,
    },
    progressContent: {},
    progressTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    progressBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    progressBar: {
        flex: 1,
        height: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
    },
    progressPercentage: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        minWidth: 45,
    },
    progressSubtext: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginHorizontal: 20,
        marginBottom: 16,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    seeAll: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
    },
    heroCard: {
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    heroGradient: {
        padding: 20,
    },
    heroContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    heroLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    heroIcon: {
        fontSize: 56,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    heroSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 8,
    },
    heroBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    heroBadgeText: {
        fontSize: 11,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    heroArrow: {
        fontSize: 32,
        color: '#FFFFFF',
    },
    gridCards: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
    },
    gridCard: {
        aspectRatio: 1.2,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    gridGradient: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    gridTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    lessonCard: {
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    lessonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    lessonIconBox: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    lessonIcon: {
        fontSize: 36,
    },
    lessonInfo: {
        flex: 1,
    },
    lessonTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    lessonDescription: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 8,
        lineHeight: 18,
    },
    lessonFooter: {
        flexDirection: 'row',
        gap: 8,
    },
    lessonBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    lessonArrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    lessonArrow: {
        fontSize: 20,
        color: '#FFFFFF',
    },
    // Audio Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    audioModal: {
        width: '100%',
        maxWidth: 350,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    audioModalGradient: {
        padding: 24,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 24,
    },
    controlRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 12,
        borderRadius: 12,
    },
    controlLabel: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '600',
    },
    volumeControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    volBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    volBarContainer: {
        width: 80,
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    volBarFill: {
        height: '100%',
        backgroundColor: '#4ECDC4',
    },
    toggleBtn: {
        width: 48,
        height: 24,
        borderRadius: 12,
        padding: 2,
        justifyContent: 'center',
    },
    toggleCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    closeModalBtn: {
        marginTop: 8,
        paddingVertical: 12,
        paddingHorizontal: 32,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
    },
    closeModalText: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: 'bold',
    }
});

export default HomeScreen;
