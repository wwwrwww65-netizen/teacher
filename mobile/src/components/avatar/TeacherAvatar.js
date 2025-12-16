import React, { useEffect, useImperativeHandle, forwardRef, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, ImageBackground, Platform, Image } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import Tts from 'react-native-tts';

// إنشاء مكونات SVG قابلة للتحريك
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// Web Chroma Key Helper
const removeGreenScreen = async (imageSrc) => {
    if (Platform.OS !== 'web') return imageSrc;

    return new Promise((resolve) => {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Simple Green Screen Logic: High Green, Low Red/Blue
                if (g > 100 && r < 100 && b < 100) {
                    data[i + 3] = 0; // Set Alpha to 0
                }
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL());
        };
        img.onerror = () => resolve(imageSrc); // Fallback
    });
};


const TeacherAvatar = forwardRef((props, ref) => {
    // 1. قيم الحركة (Animated Values)
    const mouthOpen = useRef(new Animated.Value(0.1)).current;
    const bodyTranslateY = useRef(new Animated.Value(0)).current;
    const bodyTranslateX = useRef(new Animated.Value(0)).current;
    const bodyScale = useRef(new Animated.Value(1)).current;
    const bodyRotate = useRef(new Animated.Value(0)).current; // New rotation for swaying

    // Processed Image State for Web
    const [avatarSource, setAvatarSource] = useState(null); // require('../../../assets/teacher_idle.png')

    // 2. إعداد الحركة عند التحميل
    useEffect(() => {
        // Chroma Key for Web
        // Chroma Key for Web
        if (Platform.OS === 'web') {
            // const originalImage = require('../../../assets/teacher_idle.png');
            let uri = null;
            // let uri = originalImage;

            // Handle different Webpack asset loading behaviors
            if (typeof originalImage === 'object') {
                if (originalImage.default) uri = originalImage.default; // ES Module
                else if (originalImage.uri) uri = originalImage.uri; // RN Asset
                else if (originalImage.src) uri = originalImage.src;
            }

            // If we have a string URI, process it. Otherwise fallback to using the require directly.
            if (typeof uri === 'string') {
                removeGreenScreen(uri).then(newSrc => setAvatarSource({ uri: newSrc }));
            }
        }

        startBreathing();
    }, []);

    // 4. دوال الحركة (Enhanced)
    const startBreathing = () => {
        Animated.loop(
            Animated.parallel([
                // Vertical Bounce (Breathing)
                Animated.sequence([
                    Animated.timing(bodyTranslateY, {
                        toValue: -10,
                        duration: 3000,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(bodyTranslateY, {
                        toValue: 0,
                        duration: 3000,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                ]),
                // Scale (Breathing Chest)
                Animated.sequence([
                    Animated.timing(bodyScale, {
                        toValue: 1.02,
                        duration: 3000,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(bodyScale, {
                        toValue: 1,
                        duration: 3000,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                ]),
                // Swaying (Rotation) - "Alive" feel
                Animated.sequence([
                    Animated.timing(bodyRotate, {
                        toValue: 1, // 1 degree
                        duration: 4000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(bodyRotate, {
                        toValue: -1, // -1 degree
                        duration: 4000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            ])
        ).start();
    };


    const talkingAnimRef = useRef(null);

    const startTalkingAnimation = () => {
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

    useImperativeHandle(ref, () => ({
        speakArabic: async (text) => { console.warn("Deprecated"); },
        startTalking: () => { startTalkingAnimation(); },
        stopTalking: () => { stopTalkingAnimation(); },
        pointToBoard: () => { },
        resetPosition: () => { },
        setEmotion: (emotion) => { },
        laugh: () => {
            Animated.sequence([
                Animated.timing(bodyTranslateY, { toValue: -15, duration: 100, useNativeDriver: true }),
                Animated.timing(bodyTranslateY, { toValue: 0, duration: 100, useNativeDriver: true }),
                Animated.timing(bodyTranslateY, { toValue: -15, duration: 100, useNativeDriver: true }),
                Animated.timing(bodyTranslateY, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]).start();
        },
        walkToBoard: () => {
            Animated.timing(bodyTranslateX, {
                toValue: 80,
                duration: 1000,
                useNativeDriver: true
            }).start();
        },
        walkToCenter: () => {
            Animated.timing(bodyTranslateX, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true
            }).start();
        }
    }));

    // Interpolate rotation value
    const spin = bodyRotate.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-1deg', '1deg']
    });

    return (
        <Animated.View style={[
            styles.container,
            {
                transform: [
                    { translateX: bodyTranslateX },
                    { translateY: bodyTranslateY },
                    { scale: bodyScale },
                    { rotate: spin } // Add rotation
                ]
            }
        ]}>
            <View style={styles.avatar}>
                <ImageBackground
                    source={avatarSource}
                    style={styles.characterImage}
                    resizeMode="contain"
                >
                    {/* Visual approximation for mouth position on new green screen asset */}
                    <View style={[styles.mouthContainer, { left: '49%', top: '22%' }]}>
                        <Svg height="25" width="30">
                            <AnimatedEllipse
                                cx="15" cy="10"
                                rx="10"
                                ry={mouthOpen.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [2, 10]
                                })}
                                fill="#A04040"
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
        height: 480, // Increased
    },
    avatar: {
        width: 420, // Increased from 350
        height: 480, // Increased from 400
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
