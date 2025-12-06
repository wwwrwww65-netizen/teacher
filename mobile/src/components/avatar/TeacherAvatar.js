import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withSpring,
    Easing,
    withDelay,
    interpolate
} from 'react-native-reanimated';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import arabicVoiceService from '../../services/ArabicVoiceService';
import { MOUTH_SHAPES } from '../../utils/arabicVisemes';
import { isRTL } from '../../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const TeacherAvatar = forwardRef((props, ref) => {
    const [currentMouthShape, setCurrentMouthShape] = useState('CLOSED');
    const [emotion, setEmotion] = useState('neutral'); // neutral, happy, surprised, thinking

    // Shared values
    const breathingScale = useSharedValue(1);
    const bounceY = useSharedValue(0);
    const headTilt = useSharedValue(0);
    const positionX = useSharedValue(0);

    // Eyes
    const leftEyeScaleY = useSharedValue(1); // For blinking
    const rightEyeScaleY = useSharedValue(1);
    const eyeX = useSharedValue(0); // Looking left/right
    const eyeY = useSharedValue(0); // Looking up/down

    useImperativeHandle(ref, () => ({
        startIdle,
        startTalking,
        stopTalking,
        walkToBoard,
        walkToCenter,
        setEmotion: (newEmotion) => {
            setEmotion(newEmotion);
            applyEmotion(newEmotion);
        },
        laugh: () => {
            setEmotion('happy');
            // Laugh animation sequence
            bounceY.value = withSequence(
                withTiming(-5, { duration: 100 }),
                withTiming(0, { duration: 100 }),
                withTiming(-5, { duration: 100 }),
                withTiming(0, { duration: 100 }),
                withTiming(-5, { duration: 100 }),
                withTiming(0, { duration: 100 })
            );
            headTilt.value = withSequence(
                withTiming(-5, { duration: 150 }),
                withTiming(5, { duration: 150 }),
                withTiming(-5, { duration: 150 }),
                withTiming(0, { duration: 150 })
            );
        },
        speakArabic: async (text) => {
            await arabicVoiceService.speak(text, {
                language: 'ar-SA',
                rate: 0.45,
                pitch: 1.15,
                onVisemeChange: (shape) => setCurrentMouthShape(shape),
            });
        },
    }));

    useEffect(() => {
        startIdle();
        startBlinking();
    }, []);

    const startBlinking = () => {
        const blink = () => {
            const duration = 150;
            leftEyeScaleY.value = withSequence(
                withTiming(0.1, { duration: duration / 2 }),
                withTiming(1, { duration: duration / 2 })
            );
            rightEyeScaleY.value = withSequence(
                withTiming(0.1, { duration: duration / 2 }),
                withTiming(1, { duration: duration / 2 })
            );

            // Random blink interval (2-6 seconds)
            const nextBlink = Math.random() * 4000 + 2000;
            setTimeout(blink, nextBlink);
        };
        blink();
    };

    const applyEmotion = (emo) => {
        switch (emo) {
            case 'happy':
                eyeY.value = withSpring(0);
                headTilt.value = withSpring(5);
                break;
            case 'surprised':
                eyeY.value = withSpring(0);
                leftEyeScaleY.value = withSpring(1.2);
                rightEyeScaleY.value = withSpring(1.2);
                break;
            case 'thinking':
                eyeX.value = withSpring(5);
                eyeY.value = withSpring(-5);
                headTilt.value = withSpring(-10);
                break;
            default: // neutral
                eyeX.value = withSpring(0);
                eyeY.value = withSpring(0);
                leftEyeScaleY.value = withSpring(1);
                rightEyeScaleY.value = withSpring(1);
                headTilt.value = withSpring(0);
        }
    };

    const startIdle = () => {
        breathingScale.value = withRepeat(
            withSequence(
                withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ), -1, false
        );
    };

    const startTalking = () => {
        bounceY.value = withRepeat(
            withSequence(withTiming(-2, { duration: 200 }), withTiming(0, { duration: 200 })), -1, false
        );
    };

    const stopTalking = () => {
        bounceY.value = withSpring(0);
    };

    const walkToBoard = () => {
        const targetX = isRTL() ? -SCREEN_WIDTH * 0.25 : SCREEN_WIDTH * 0.25;
        positionX.value = withTiming(targetX, { duration: 1000 });
        bounceY.value = withSequence(
            withTiming(-10, { duration: 250 }), withTiming(0, { duration: 250 }),
            withTiming(-10, { duration: 250 }), withTiming(0, { duration: 250 })
        );
    };

    const walkToCenter = () => {
        positionX.value = withTiming(0, { duration: 1000 });
        bounceY.value = withSequence(
            withTiming(-10, { duration: 250 }), withTiming(0, { duration: 250 }),
            withTiming(-10, { duration: 250 }), withTiming(0, { duration: 250 })
        );
    };

    // Styles
    const containerStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: positionX.value },
            { translateY: bounceY.value },
            { scale: breathingScale.value },
        ],
    }));

    const characterStyle = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${headTilt.value}deg` },
            { scaleX: isRTL() ? -1 : 1 },
        ],
    }));

    const leftEyeStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: eyeX.value },
            { translateY: eyeY.value },
            { scaleY: leftEyeScaleY.value }
        ]
    }));

    const rightEyeStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: eyeX.value },
            { translateY: eyeY.value },
            { scaleY: rightEyeScaleY.value }
        ]
    }));

    const getMouthPath = () => MOUTH_SHAPES[currentMouthShape]?.path || MOUTH_SHAPES.CLOSED.path;

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.characterContainer, containerStyle]}>
                <Animated.View style={characterStyle}>
                    {/* Base Image */}
                    <Image
                        source={require('../../../assets/teacher-character.png')}
                        style={styles.characterImage}
                        resizeMode="contain"
                    />

                    {/* Eyes Overlay (Adjust positions based on your image) */}
                    <View style={styles.eyesContainer}>
                        {/* Left Eye */}
                        <View style={styles.eyeWrapper}>
                            <Svg height="20" width="20">
                                <AnimatedEllipse cx="10" cy="10" rx="8" ry="6" fill="#333" animatedProps={leftEyeStyle} />
                                <Circle cx="12" cy="8" r="2" fill="white" />
                            </Svg>
                        </View>

                        {/* Right Eye */}
                        <View style={styles.eyeWrapper}>
                            <Svg height="20" width="20">
                                <AnimatedEllipse cx="10" cy="10" rx="8" ry="6" fill="#333" animatedProps={rightEyeStyle} />
                                <Circle cx="12" cy="8" r="2" fill="white" />
                            </Svg>
                        </View>
                    </View>

                    {/* Mouth Overlay */}
                    <View style={styles.mouthOverlay}>
                        <Svg width="60" height="30" viewBox="80 80 40 30">
                            <AnimatedPath
                                d={getMouthPath()}
                                stroke="#8B4513"
                                strokeWidth="2.5"
                                fill={currentMouthShape === 'CLOSED' ? 'none' : '#D35F5F'}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </Svg>
                    </View>
                </Animated.View>
            </Animated.View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: 300,
        height: 400,
        alignItems: 'center',
        justifyContent: 'center',
    },
    characterContainer: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    characterImage: {
        width: 280,
        height: 380,
    },
    eyesContainer: {
        position: 'absolute',
        top: 135, // Adjust based on image
        flexDirection: 'row',
        gap: 25, // Distance between eyes
    },
    eyeWrapper: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mouthOverlay: {
        position: 'absolute',
        bottom: 155, // Adjust based on image
        alignSelf: 'center',
    },
});

export default TeacherAvatar;
