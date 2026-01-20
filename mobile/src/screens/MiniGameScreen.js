import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    SafeAreaView,
    Alert,
    Modal,
    Vibration,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../config/theme';
import GameAudioService from '../services/GameAudioService';
import GlobalAudioService from '../services/GlobalAudioService';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

// 🎨 ألوان البالونات النابضة بالحياة
const BALLOON_COLORS = [
    ['#FF6B6B', '#EE5A6F'],
    ['#4ECDC4', '#44A08D'],
    ['#FFD93D', '#F6C90E'],
    ['#A8E6CF', '#7FCDBB'],
    ['#667eea', '#764ba2'],
    ['#FF8A80', '#FF5252'],
];

const MiniGameScreen = ({ navigation, route }) => {
    const { targetLetter = 'أ', distractors = ['ب', 'ت', 'س'], level = 1 } = route.params || {};

    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [balloons, setBalloons] = useState([]);
    const [particles, setParticles] = useState([]);
    const [showVictory, setShowVictory] = useState(false);
    
    // 🎵 Audio Settings State
    const [isMusicMuted, setIsMusicMuted] = useState(GameAudioService.isMuted);
    const [isVibrationOn, setIsVibrationOn] = useState(GameAudioService.isVibrationEnabled);

    // Animations
    const scoreAnim = useRef(new Animated.Value(1)).current;
    const comboAnim = useRef(new Animated.Value(0)).current;
    const victoryAnim = useRef(new Animated.Value(0)).current;

    const gameLoopRef = useRef(null);
    const timerRef = useRef(null);
    const scoreRef = useRef(0); // ✅ Track actual score

    useEffect(() => {
        console.log('🎮 MiniGame Mounted. Target:', targetLetter);
        
        // 🎵 Stop App Music & Start Game Audio
        GlobalAudioService.stopAppBackgroundMusic();
        GameAudioService.init();
        
        startGame();
        return () => {
            console.log('🛑 MiniGame Unmounted');
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
            
            // 🎵 Cleanup Game Audio & Resume App Music
            GameAudioService.stopBackgroundMusic();
            GlobalAudioService.playAppBackgroundMusic();
        };
    }, []);

    const startGame = () => {
        console.log('▶️ Game Started');
        
        // 🎵 Start background music
        GameAudioService.playBackgroundMusic();
        
        // Spawn balloons
        gameLoopRef.current = setInterval(() => {
            spawnBalloon();
        }, 1200);


        // Countdown
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    clearInterval(gameLoopRef.current);
                    finishGame();
                    return 0;
                }
                
                // 🎵 Warning vibration at 10 seconds
                if (prev === 10) {
                    // 🎵 Time warning haptic
                    if (isVibrationOn) {
                        try {
                            Vibration.vibrate([0, 100, 100, 100]);
                        } catch (error) {
                            console.log('🔇 Vibration not available');
                        }
                    }
                    // 🎵 Play warning sound
                    GameAudioService.playWarning();
                }
                
                return prev - 1;
            });
        }, 1000);
    };

    const finishGame = async () => {
        const finalScore = scoreRef.current; // ✅ Use ref value
        console.log('🏁 Game Finished. Final Score:', finalScore);
        
        // حساب النجوم
        const stars = finalScore >= 15 ? 3 : finalScore >= 10 ? 2 : finalScore >= 5 ? 1 : 0;
        
        // 🎵 Victory vibration based on stars
        if (isVibrationOn) {
            try {
                if (stars === 3) {
                    // Triple star celebration!
                    Vibration.vibrate([0, 100, 50, 100, 50, 100, 100, 200]);
                } else if (stars === 2) {
                    // Double star celebration
                    Vibration.vibrate([0, 100, 100, 100]);
                } else if (stars === 1) {
                    // Single star
                    Vibration.vibrate([0, 100, 50, 100]);
                } else {
                    // Try again
                    Vibration.vibrate(200);
                }
            } catch (error) {
                console.log('🔇 Vibration not available');
            }
        }
        
        // 🎵 Play victory or defeat sound
        if (stars > 0) {
            GameAudioService.playVictory(stars);
        } else {
            GameAudioService.playDefeat();
        }
        
        // حفظ التقدم
        if (stars > 0) {
            await saveLessonProgress(level, stars);
        }

        // عرض شاشة الفوز
        setShowVictory(true);
        Animated.spring(victoryAnim, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };

    const saveLessonProgress = async (levelId, stars) => {
        try {
            const memoryData = await AsyncStorage.getItem('nora_memory');
            const parsed = memoryData ? JSON.parse(memoryData) : {};
            
            const completedLessons = parsed.completedLessons || [];
            const existingIndex = completedLessons.findIndex(l => l.levelId === levelId);
            
            const lessonData = {
                levelId,
                stars,
                completedAt: new Date().toISOString(),
            };

            if (existingIndex >= 0) {
                // تحديث النجوم إذا كانت أفضل
                if (stars > completedLessons[existingIndex].stars) {
                    completedLessons[existingIndex] = lessonData;
                }
            } else {
                completedLessons.push(lessonData);
            }

            const updatedMemory = {
                ...parsed,
                completedLessons,
            };

            await AsyncStorage.setItem('nora_memory', JSON.stringify(updatedMemory));
            console.log('✅ Progress saved:', lessonData);
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    };

    const spawnBalloon = () => {
        const id = Date.now() + Math.random();
        const isTarget = Math.random() < 0.45;
        const letter = isTarget
            ? targetLetter
            : distractors[Math.floor(Math.random() * distractors.length)];

        const startX = Math.random() * (width - 100) + 10;
        const colorIndex = Math.floor(Math.random() * BALLOON_COLORS.length);

        const newBalloon = {
            id,
            x: startX,
            y: new Animated.Value(height + 100),
            letter,
            isTarget,
            colors: BALLOON_COLORS[colorIndex],
            popped: false,
            scale: new Animated.Value(0),
        };

        setBalloons(prev => [...prev, newBalloon]);

        // Entrance animation
        Animated.spring(newBalloon.scale, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true,
        }).start();

        // Float up
        Animated.timing(newBalloon.y, {
            toValue: -200,
            duration: 5000 + Math.random() * 2000,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) {
                setBalloons(current => current.filter(b => b.id !== id));
            }
        });
    };

    const handlePop = (balloon) => {
        if (balloon.popped) return;
        console.log('💥 Balloon Popped:', balloon.letter, 'IsTarget:', balloon.isTarget);

        // Mark as popped
        setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, popped: true } : b));

        if (balloon.isTarget) {
            // صحيح! ✅
            // 🎵 Success haptic feedback - short pleasant vibration
            if (isVibrationOn) {
                try {
                    Vibration.vibrate(50);
                } catch (error) {
                    console.log('🔇 Vibration not available');
                }
            }
            
            // 🎵 Play success sound
            GameAudioService.playSuccess();
            
            setScore(prevScore => {
                const newScore = prevScore + 1;
                scoreRef.current = newScore; // ✅ Sync ref
                return newScore;
            });
            setCombo(prevCombo => prevCombo + 1);

            // Score animation
            Animated.sequence([
                Animated.timing(scoreAnim, {
                    toValue: 1.3,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scoreAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();

            // Combo animation
            setCombo(currentCombo => {
                if (currentCombo + 1 > 1) {
                    // 🎵 Combo haptic feedback - rhythmic pattern
                    if (isVibrationOn) {
                        try {
                            Vibration.vibrate([0, 30, 50, 30]);
                        } catch (error) {
                            console.log('🔇 Vibration not available');
                        }
                    }
                    
                    // 🎵 Play combo sound
                    GameAudioService.playCombo(currentCombo + 1);
                    
                    Animated.sequence([
                        Animated.timing(comboAnim, {
                            toValue: 1,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.delay(1000),
                        Animated.timing(comboAnim, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                    ]).start();
                }
                return currentCombo + 1;
            });

            // Particles
            createParticles(balloon.x + 40, balloon.y._value + 50, '✨');
        } else {
            // خطأ! ❌
            // 🎵 Error haptic feedback - double buzz
            if (isVibrationOn) {
                try {
                    Vibration.vibrate([0, 100, 50, 100]);
                } catch (error) {
                    console.log('🔇 Vibration not available');
                }
            }
            
            // 🎵 Play error sound
            GameAudioService.playError();
            
            setScore(s => {
                const newScore = Math.max(0, s - 1);
                scoreRef.current = newScore; // ✅ Sync ref
                return newScore;
            });
            setCombo(0);
            createParticles(balloon.x + 40, balloon.y._value + 50, '💔');
        }

        // Remove balloon
        setTimeout(() => {
            setBalloons(prev => prev.filter(b => b.id !== balloon.id));
        }, 200);
    };

    const createParticles = (x, y, emoji) => {
        const newParticles = Array.from({ length: 6 }, (_, i) => ({
            id: Date.now() + i,
            x: x + (Math.random() - 0.5) * 50,
            y: new Animated.Value(y),
            opacity: new Animated.Value(1),
            emoji,
        }));

        setParticles(prev => [...prev, ...newParticles]);

        newParticles.forEach(particle => {
            Animated.parallel([
                Animated.timing(particle.y, {
                    toValue: y - 100,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(particle.opacity, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setParticles(prev => prev.filter(p => p.id !== particle.id));
            });
        });
    };

    // 🎵 Toggle Music
    const toggleMusic = () => {
        GlobalAudioService.playClickSound();
        const newState = GameAudioService.toggleMusic();
        setIsMusicMuted(newState);
    };

    // 📳 Toggle Vibration
    const toggleVibration = () => {
        GlobalAudioService.playClickSound();
        const newState = GameAudioService.toggleVibration();
        setIsVibrationOn(newState);
    };

    const handleRestart = () => {
        setShowVictory(false);
        setScore(0);
        scoreRef.current = 0; // ✅ Reset ref
        setCombo(0);
        setTimeLeft(30);
        setBalloons([]);
        setParticles([]);
        victoryAnim.setValue(0);
        startGame();
    };

    const getStars = () => {
        const finalScore = scoreRef.current; // ✅ Use ref
        return finalScore >= 15 ? 3 : finalScore >= 10 ? 2 : finalScore >= 5 ? 1 : 0;
    };

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#87CEEB', '#E0F6FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.uiLayer}>
                {/* Header: Settings (Left) & Close Button (Right) */}
                <View style={[styles.header, { justifyContent: 'space-between', paddingTop: 10, paddingBottom: 0 }]}>
                    {/* Settings Buttons - Above Score */}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 25 }}>
                        <TouchableOpacity onPress={toggleMusic} style={[styles.circularBtn, { backgroundColor: isMusicMuted ? '#EF9A9A' : '#4ECDC4' }]}>
                            <Ionicons name={isMusicMuted ? "volume-mute" : "musical-notes"} size={20} color="#FFF" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={toggleVibration} style={[styles.circularBtn, { backgroundColor: !isVibrationOn ? '#EF9A9A' : '#FFD93D' }]}>
                            <Ionicons name={isVibrationOn ? "phone-portrait" : "phone-portrait-outline"} size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Close Button */}
                    <TouchableOpacity 
                        onPress={() => {
                            GlobalAudioService.playClickSound();
                            navigation.goBack();
                        }}
                        style={[styles.circularBtn, { marginTop: 25 }]}
                    >
                        <Ionicons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Game Stats Header */}
                <View style={styles.header}>
                    {/* Score */}
                    <Animated.View style={{ transform: [{ scale: scoreAnim }] }}>
                        <LinearGradient
                            colors={['#FFD700', '#FFA500']}
                            style={styles.scoreBox}
                        >
                            <Text style={styles.scoreLabel}>النقاط</Text>
                            <Text style={styles.scoreText}>{score}</Text>
                        </LinearGradient>
                    </Animated.View>

                    {/* Target Letter */}
                    <View style={styles.targetBox}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                            style={styles.targetGradient}
                        >
                            <Text style={styles.targetLabel}>ابحث عن</Text>
                            <View style={styles.targetLetterBox}>
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    style={styles.targetLetterGradient}
                                >
                                    <Text style={styles.targetLetter}>{targetLetter}</Text>
                                </LinearGradient>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Timer */}
                    <LinearGradient
                        colors={timeLeft <= 10 ? ['#FF6B6B', '#EE5A6F'] : ['#4ECDC4', '#44A08D']}
                        style={styles.timerBox}
                    >
                        <Text style={styles.timerIcon}>⏱️</Text>
                        <Text style={styles.timerText}>{timeLeft}</Text>
                    </LinearGradient>
                </View>



                {/* Combo Indicator */}
                {combo > 1 && (
                    <Animated.View 
                        style={[
                            styles.comboContainer,
                            {
                                opacity: comboAnim,
                                transform: [{
                                    scale: comboAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.5, 1],
                                    })
                                }]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={['#FF6B6B', '#EE5A6F']}
                            style={styles.comboGradient}
                        >
                            <Text style={styles.comboText}>🔥 Combo x{combo}</Text>
                        </LinearGradient>
                    </Animated.View>
                )}

                {/* Game Area */}
                <View style={styles.gameArea} pointerEvents="box-none">
                    {/* Balloons */}
                    {balloons.map(balloon => {
                        if (balloon.popped) return null;

                        return (
                            <Animated.View
                                key={balloon.id}
                                style={[
                                    styles.balloon,
                                    {
                                        left: balloon.x,
                                        transform: [
                                            { scale: balloon.scale },
                                            { translateY: balloon.y }
                                        ],
                                    }
                                ]}
                            >
                                <TouchableOpacity
                                    style={styles.touchArea}
                                    onPress={() => handlePop(balloon)}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={balloon.colors}
                                        style={styles.balloonGradient}
                                    >
                                        <View style={styles.balloonShine} />
                                        <Text style={styles.balloonText}>{balloon.letter}</Text>
                                    </LinearGradient>
                                    <View style={styles.string} />
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}

                    {/* Particles */}
                    {particles.map(particle => (
                        <Animated.View
                            key={particle.id}
                            style={[
                                styles.particle,
                                {
                                    left: particle.x,
                                    opacity: particle.opacity,
                                    transform: [{ translateY: particle.y }],
                                }
                            ]}
                        >
                            <Text style={styles.particleText}>{particle.emoji}</Text>
                        </Animated.View>
                    ))}
                </View>
            </SafeAreaView>

            {/* Victory Modal */}
            <Modal
                visible={showVictory}
                transparent={true}
                animationType="none"
            >
                <View style={styles.modalOverlay}>
                    <Animated.View 
                        style={[
                            styles.victoryCard,
                            {
                                opacity: victoryAnim,
                                transform: [{
                                    scale: victoryAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.5, 1],
                                    })
                                }]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            style={styles.victoryGradient}
                        >
                            <Text style={styles.victoryTitle}>
                                {getStars() >= 3 ? '🎉 ممتاز!' : getStars() >= 2 ? '👏 رائع!' : getStars() >= 1 ? '💪 جيد!' : '😊 حاول مرة أخرى'}
                            </Text>
                            
                            <View style={styles.starsContainer}>
                                {[1, 2, 3].map((star) => (
                                    <Text key={star} style={styles.star}>
                                        {star <= getStars() ? '⭐' : '☆'}
                                    </Text>
                                ))}
                            </View>

                            <View style={styles.scoreDisplay}>
                                <Text style={styles.finalScoreLabel}>النقاط النهائية</Text>
                                <Text style={styles.finalScore}>{score}</Text>
                            </View>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity 
                                    style={styles.modalButton}
                                    onPress={() => navigation.goBack()}
                                >
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
                                        style={styles.modalButtonGradient}
                                    >
                                        <Text style={styles.modalButtonText}>🗺️ الخريطة</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.modalButton}
                                    onPress={handleRestart}
                                >
                                    <LinearGradient
                                        colors={['#FFD700', '#FFA500']}
                                        style={styles.modalButtonGradient}
                                    >
                                        <Text style={styles.modalButtonTextPrimary}>🔄 إعادة</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    uiLayer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
        alignItems: 'center',
    },
    circularBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    scoreBox: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    scoreLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    scoreText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    targetBox: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    targetGradient: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
    },
    targetLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
        fontWeight: '600',
    },
    targetLetterBox: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    targetLetterGradient: {
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    targetLetter: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    timerBox: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    timerIcon: {
        fontSize: 20,
        marginBottom: 4,
    },
    timerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    comboContainer: {
        alignSelf: 'center',
        marginTop: 10,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
    },
    comboGradient: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    comboText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    gameArea: {
        ...StyleSheet.absoluteFillObject,
    },
    balloon: {
        position: 'absolute',
        width: 90,
        height: 110,
    },
    touchArea: {
        width: '100%',
        height: '100%',
    },
    balloonGradient: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    balloonShine: {
        position: 'absolute',
        top: 15,
        left: 20,
        width: 25,
        height: 25,
        borderRadius: 12.5,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    balloonText: {
        fontSize: 44,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    string: {
        position: 'absolute',
        bottom: 0,
        left: 43,
        width: 2,
        height: 30,
        backgroundColor: 'rgba(150, 150, 150, 0.6)',
    },
    particle: {
        position: 'absolute',
    },
    particleText: {
        fontSize: 24,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    victoryCard: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
    },
    victoryGradient: {
        padding: 32,
        alignItems: 'center',
    },
    victoryTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 24,
        textAlign: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 8,
    },
    star: {
        fontSize: 48,
    },
    scoreDisplay: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 24,
        alignItems: 'center',
    },
    finalScoreLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 8,
    },
    finalScore: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    modalButtonTextPrimary: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});

export default MiniGameScreen;
