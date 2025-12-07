import React, { useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ImageBackground, Platform } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import Tts from 'react-native-tts';

// إنشاء مكونات SVG قابلة للتحريك
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const TeacherAvatar = forwardRef((props, ref) => {
    // 1. قيم الحركة (Animated Values)
    const mouthOpen = useRef(new Animated.Value(0.1)).current; // 0.1 = مغلق، 1 = مفتوح
    const bodyTranslateY = useRef(new Animated.Value(0)).current;
    const bodyScale = useRef(new Animated.Value(1)).current;

    // حالة التحدث
    const isSpeaking = useRef(false);

    // 2. إعداد الصوت
    useEffect(() => {
        // إعداد TTS
        Tts.getInitStatus().then(() => {
            Tts.setDefaultLanguage('ar-SA');
            Tts.setDucking(true);
        }, (err) => {
            if (err.code === 'no_engine') {
                Tts.requestInstallEngine();
            }
        });

        const ttsStart = Tts.addListener('tts-start', () => {
            isSpeaking.current = true;
            startTalkingAnimation();
        });

        const ttsFinish = Tts.addListener('tts-finish', () => {
            isSpeaking.current = false;
            stopTalkingAnimation();
        });

        const ttsCancel = Tts.addListener('tts-cancel', () => {
            isSpeaking.current = false;
            stopTalkingAnimation();
        });

        // 3. بدء حركة التنفس الطبيعية
        startBreathing();

        return () => {
            ttsStart.remove();
            ttsFinish.remove();
            ttsCancel.remove();
            Tts.stop();
        };
    }, []);

    // 4. دوال الحركة
    const startBreathing = () => {
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(bodyTranslateY, {
                        toValue: -8,
                        duration: 2500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(bodyTranslateY, {
                        toValue: 0,
                        duration: 2500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(bodyScale, {
                        toValue: 1.02,
                        duration: 2500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(bodyScale, {
                        toValue: 1,
                        duration: 2500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ])
        ).start();
    };

    const talkingAnimRef = useRef(null);

    const startTalkingAnimation = () => {
        // حركة الفم أثناء الكلام
        if (talkingAnimRef.current) talkingAnimRef.current.stop();

        talkingAnimRef.current = Animated.loop(
            Animated.sequence([
                Animated.timing(mouthOpen, { toValue: 1, duration: 150, useNativeDriver: false }),
                Animated.timing(mouthOpen, { toValue: 0.2, duration: 150, useNativeDriver: false }),
                Animated.timing(mouthOpen, { toValue: 0.8, duration: 150, useNativeDriver: false }),
                Animated.timing(mouthOpen, { toValue: 0.3, duration: 150, useNativeDriver: false }),
            ])
        );
        talkingAnimRef.current.start();
    };

    const stopTalkingAnimation = () => {
        if (talkingAnimRef.current) talkingAnimRef.current.stop();
        Animated.timing(mouthOpen, { toValue: 0.1, duration: 200, useNativeDriver: false }).start();
    };

    // 5. التحكم الخارجي
    useImperativeHandle(ref, () => ({
        speakArabic: async (text) => {
            if (!text) return;

            return new Promise((resolve) => {
                let resolved = false;

                const cleanup = () => {
                    if (resolved) return;
                    resolved = true;
                    // eslint-disable-next-line
                    if (finishListener && finishListener.remove) finishListener.remove();
                    // eslint-disable-next-line
                    if (cancelListener && cancelListener.remove) cancelListener.remove();
                    // eslint-disable-next-line
                    if (timeoutId) clearTimeout(timeoutId);
                    resolve();
                };

                const finishListener = Tts.addListener('tts-finish', cleanup);
                const cancelListener = Tts.addListener('tts-cancel', cleanup);

                // Timeout safe-guard (10 ثواني كحد أقصى)
                const timeoutId = setTimeout(() => {
                    console.log('TTS Timeout - forcing continues');
                    cleanup();
                }, 10000);

                try {
                    Tts.stop();
                    Tts.speak(text);
                } catch (error) {
                    console.warn('TTS Error:', error);
                    cleanup();
                }
            });
        },
        pointToBoard: () => {
            // يمكن إضافة حركة دوران بسيطة هنا
        },
        resetPosition: () => {
            // mouthOpen.setValue(0.1);
        },
        setEmotion: (emotion) => {
            // يمكن تغيير الصورة هنا إذا توفرت صور بتعبيرات مختلفة
            // حالياً سنكتفي بالحركة
        },
        laugh: () => {
            Animated.sequence([
                Animated.timing(bodyTranslateY, { toValue: -10, duration: 100, useNativeDriver: true }),
                Animated.timing(bodyTranslateY, { toValue: 0, duration: 100, useNativeDriver: true }),
                Animated.timing(bodyTranslateY, { toValue: -10, duration: 100, useNativeDriver: true }),
                Animated.timing(bodyTranslateY, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]).start();
        },
        walkToBoard: () => { },
        walkToCenter: () => { }
    }));

    return (
        <Animated.View style={[
            styles.container,
            {
                transform: [
                    { translateY: bodyTranslateY },
                    { scale: bodyScale }
                ]
            }
        ]}>
            <View style={styles.avatar}>
                {/* صورة المعلمة الأصلية كخلفية */}
                <ImageBackground
                    source={require('../../../assets/teacher-character.png')}
                    style={styles.characterImage}
                    resizeMode="contain"
                >
                    {/* 
                      تم إزالة العيون المرسومة (SVG) لأنها تبدو بدائية وغير متناسقة مع الصورة الأصلية.
                      يتم الاعتماد على عيون الشخصية في الصورة.
                    */}

                    {/* --- الفم (Overlay) - يتم تحسينه ليكون أقل بروزاً --- */}
                    <View style={[styles.mouthContainer, { left: '46%', top: '41%' }]}>
                        <Svg height="25" width="30">
                            <AnimatedEllipse
                                cx="15" cy="10"
                                rx="10"
                                ry={mouthOpen.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [2, 10]
                                })}
                                fill="#A04040" // لون أغمق قليلاً ليبدو طبيعياً أكثر
                                fillOpacity={0.8}
                            />
                        </Svg>
                    </View>
                </ImageBackground>
            </View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 350,
    },
    avatar: {
        width: 300,
        height: 350,
        alignItems: 'center',
        justifyContent: 'center',
    },
    characterImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
    },
    mouthContainer: {
        position: 'absolute',
        width: 30,
        height: 25,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ translateX: -15 }]
    }
});

export default TeacherAvatar;
