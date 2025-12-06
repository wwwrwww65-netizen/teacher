import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View, StyleSheet, ImageBackground, Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    Easing,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const ChalkboardWhiteboard = forwardRef((props, ref) => {
    const [currentPath, setCurrentPath] = useState('');
    const [imageUri, setImageUri] = useState(null); // صورة الواجب
    const progress = useSharedValue(0);

    useImperativeHandle(ref, () => ({
        write: (svgPath, duration = 3000) => {
            setImageUri(null); // إخفاء الصورة عند الكتابة
            setCurrentPath(svgPath);
            progress.value = 0;
            progress.value = withTiming(1, {
                duration,
                easing: Easing.linear,
            });
        },
        showImage: (uri) => {
            setCurrentPath(''); // مسح الكتابة عند عرض الصورة
            setImageUri(uri);
        },
        clear: () => {
            setCurrentPath('');
            setImageUri(null);
            progress.value = 0;
        },
    }));

    const animatedProps = useAnimatedProps(() => {
        if (!currentPath) return {};
        const pathLength = 1000;
        const strokeDashoffset = pathLength * (1 - progress.value);
        return {
            strokeDasharray: [pathLength, pathLength],
            strokeDashoffset,
        };
    });

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('../../assets/chalkboard.png')}
                style={styles.chalkboard}
                resizeMode="cover"
            >
                <View style={styles.drawingArea}>
                    {/* عرض صورة الواجب إذا وجدت */}
                    {imageUri ? (
                        <Image
                            source={{ uri: imageUri }}
                            style={styles.homeworkImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <Svg width="100%" height="100%" viewBox="0 0 300 200">
                            {currentPath && (
                                <AnimatedPath
                                    d={currentPath}
                                    stroke="#FFFFFF"
                                    strokeWidth="3"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    animatedProps={animatedProps}
                                />
                            )}
                        </Svg>
                    )}
                </View>
            </ImageBackground>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: '90%',
        aspectRatio: 3 / 2,
        alignSelf: 'center',
        marginVertical: 20,
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    chalkboard: {
        width: '100%',
        height: '100%',
    },
    drawingArea: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    homeworkImage: {
        width: '90%',
        height: '90%',
        borderRadius: 5,
        transform: [{ rotate: '-2deg' }], // لمسة جمالية كأنها معلقة
    },
});

export default ChalkboardWhiteboard;
