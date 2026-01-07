import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    ImageBackground,
    SafeAreaView,
    Alert
} from 'react-native';
import { theme } from '../config/theme';
import MusicService from '../services/MusicService';
import SoundService from '../services/SoundService';
import SmartBackground from '../components/SmartBackground';

const { width, height } = Dimensions.get('window');

// --- GAME CONFIG ---
const BALLOON_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF87C3', '#64C7F6']; // Vibrant colors

const MiniGameScreen = ({ navigation, route }) => {
    // Params: targetLetter='أ', distractors=['ب', 'ت', 'س'], level=1
    const { targetLetter = 'أ', distractors = ['ب'], level = 1 } = route.params || {};

    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [balloons, setBalloons] = useState([]);

    // Game Loop Timer
    const gameLoopRef = useRef(null);

    useEffect(() => {
        console.log('🎮 MiniGame Mounted. Target:', targetLetter);
        startGame();
        return () => {
            console.log('🛑 MiniGame Unmounted');
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, []);

    const startGame = () => {
        console.log('▶️ Game Started');
        // Spawn balloons loop
        gameLoopRef.current = setInterval(() => {
            spawnBalloon();
        }, 1000); // Spawn every second

        // Countdown
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    clearInterval(gameLoopRef.current);
                    finishGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const finishGame = () => {
        console.log('🏁 Game Finished. Final Score:', score);
        Alert.alert(
            score >= 5 ? '🎉 مذهـل!' : '💪 محاولة جيدة',
            `لقد جمعت ${score} نقطة!`,
            [
                { text: 'عودة للخريطة', onPress: () => navigation.goBack() }
            ]
        );
    };

    const spawnBalloon = () => {
        // console.log('🎈 Spawning Balloon'); // Too noisy? Maybe keep it for now as user asked for "everything"
        const id = Date.now() + Math.random();
        // 40% chance of being the correct target
        const isTarget = Math.random() < 0.4;
        const letter = isTarget
            ? targetLetter
            : distractors[Math.floor(Math.random() * distractors.length)];

        const startX = Math.random() * (width - 80);
        const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];

        const newBalloon = {
            id,
            x: startX,
            y: new Animated.Value(height + 100), // Start below screen
            letter,
            isTarget,
            color,
            popped: false
        };

        setBalloons(prev => [...prev, newBalloon]);

        // Animate Up
        Animated.timing(newBalloon.y, {
            toValue: -200, // Float off top
            duration: 4000 + Math.random() * 2000,
            useNativeDriver: false // We might need layout interaction
        }).start(({ finished }) => {
            if (finished) {
                // Remove if it goes off screen without popping
                setBalloons(current => current.filter(b => b.id !== id));
            }
        });
    };

    const handlePop = (balloon) => {
        if (balloon.popped) return;
        console.log('💥 Balloon Popped:', balloon.letter, 'IsTarget:', balloon.isTarget);

        if (balloon.isTarget) {
            setScore(s => s + 1);
            // Play Pop Sound (Mock)
            // SoundService.play('pop');
        } else {
            setScore(s => Math.max(0, s - 1));
            // Play Error Sound
            // SoundService.play('error');
        }

        // Mark popped visually
        setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, popped: true } : b));

        // Remove after short delay
        setTimeout(() => {
            setBalloons(prev => prev.filter(b => b.id !== balloon.id));
        }, 200);
    };

    return (
        <SmartBackground type="sky">
            <SafeAreaView style={styles.uiLayer}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.scoreBox}>
                        <Text style={styles.scoreText}>⭐ {score}</Text>
                    </View>
                    <View style={styles.targetBox}>
                        <Text style={styles.targetLabel}>ابحث عن:</Text>
                        <Text style={styles.targetLetter}>{targetLetter}</Text>
                    </View>
                    <View style={styles.timerBox}>
                        <Text style={styles.timerText}>⏳ {timeLeft}</Text>
                    </View>
                </View>

                {/* Balloons Layer - Make sure View fills safely */}
                <View style={styles.gameArea} pointerEvents="box-none">
                    {balloons.map(balloon => {
                        if (balloon.popped) return null; // Or show explosion animation

                        return (
                            <Animated.View
                                key={balloon.id}
                                style={[
                                    styles.balloon,
                                    {
                                        left: balloon.x,
                                        top: balloon.y,
                                        backgroundColor: balloon.color
                                    }
                                ]}
                            >
                                <TouchableOpacity
                                    style={styles.touchArea}
                                    onPress={() => handlePop(balloon)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.balloonText}>{balloon.letter}</Text>
                                    <View style={styles.string} />
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </View>
            </SafeAreaView>
        </SmartBackground>
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
        padding: 20,
        alignItems: 'center'
    },
    scoreBox: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 10,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700'
    },
    scoreText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333'
    },
    targetBox: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        ...theme.shadows.lg
    },
    targetLabel: {
        fontSize: 12,
        color: '#666'
    },
    targetLetter: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.primary
    },
    timerBox: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 20,
    },
    timerText: {
        color: 'white',
        fontWeight: 'bold'
    },
    gameArea: {
        ...StyleSheet.absoluteFillObject,
    },
    balloon: {
        position: 'absolute',
        width: 80,
        height: 100,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    touchArea: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    balloonText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1
    },
    string: {
        position: 'absolute',
        bottom: -20,
        width: 2,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.8)'
    }
});

export default MiniGameScreen;
