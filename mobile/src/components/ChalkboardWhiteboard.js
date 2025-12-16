import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { View, StyleSheet, ImageBackground, Image, Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// إنشاء مكون Path قابل للتحريك
const AnimatedPath = Animated.createAnimatedComponent(Path);

const ChalkboardWhiteboard = forwardRef((props, ref) => {
    const [currentPath, setCurrentPath] = useState('');
    const [imageUri, setImageUri] = useState(null); // صورة الواجب

    // قيمة الحركة للرسم
    const progress = useRef(new Animated.Value(0)).current;

    useImperativeHandle(ref, () => ({
        write: (svgPath, duration = 3000) => {
            setImageUri(null); // إخفاء الصورة عند الكتابة
            setCurrentPath(svgPath);
            progress.setValue(0);

            Animated.timing(progress, {
                toValue: 1,
                duration: duration,
                easing: Easing.linear,
                useNativeDriver: true, // استخدام Native Driver للأداء
            }).start();
        },
        showImage: (uri) => {
            setCurrentPath(''); // مسح الكتابة عند عرض الصورة
            setImageUri(uri);
        },
        clear: () => {
            setCurrentPath('');
            setImageUri(null);
            progress.setValue(0);
        },
    }));

    // تحريك strokeDashoffset لمحاكاة حركة الكتابة
    // بما أننا لا نستطيع معرفة طول المسار بدقة بدون `getTotalLength` (الذي يحتاج DOM)،
    // سنستخدم قيمة كبيرة تقديرية (1000) ونحركها.
    const pathLength = 1000;
    const strokeDashoffset = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [pathLength, 0],
    });

    return (
        <View style={styles.container}>
            {/* Transparent Overlay - Drawing Only */}
            <View style={styles.drawingArea}>
                {/* عرض صورة الواجب إذا وجدت */}
                {imageUri ? (
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.homeworkImage}
                        resizeMode="contain"
                    />
                ) : (
                    <Svg width="100%" height="100%" viewBox="0 0 300 300">
                        {currentPath && (
                            <AnimatedPath
                                d={currentPath}
                                stroke="#FFFFFF"
                                strokeWidth="8"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray={[pathLength, pathLength]}
                                strokeDashoffset={strokeDashoffset}
                            />
                        )}
                    </Svg>
                )}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%', // Flexible
        backgroundColor: 'transparent', // Explicitly transparent
    },
    drawingArea: {
        flex: 1,
        // padding: 20, // Optional padding inside board
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
