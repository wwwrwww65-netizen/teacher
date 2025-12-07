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
            <ImageBackground
                source={require('../../assets/chalkboard.png')}
                style={styles.chalkboard}
                resizeMode="cover"
            >
                {/* طبقة شفافة لزيادة وضوح الكتابة */}
                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20, 40, 30, 0.8)' }} />

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
                                    strokeDasharray={[pathLength, pathLength]}
                                    strokeDashoffset={strokeDashoffset}
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
