import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { View, StyleSheet, Image, Animated, Easing, I18nManager, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// إنشاء مكون Path قابل للتحريك
const AnimatedPath = Animated.createAnimatedComponent(Path);

const ChalkboardWhiteboard = forwardRef((props, ref) => {
    const [drawings, setDrawings] = useState([]); // List of { content, offset, type }
    const [imageUri, setImageUri] = useState(null);

    // قيمة الحركة للرسم
    const progress = useRef(new Animated.Value(0)).current;

    useImperativeHandle(ref, () => ({
        write: (content, options = {}) => {
            const { count = 1, duration = 1500, type = 'any' } = options;
            console.log('📝 [BOARD] write called', { content, options });
            setImageUri(null);

            const isComplexSvg = typeof content === 'string' &&
                /^[MmLlCcAaQqZz][\d\s\.\,\-]+$/.test(content.trim()) &&
                content.trim().length > 20;

            const determinedIsText = type === 'text' || !isComplexSvg;
            const finalContentType = determinedIsText ? 'text' : 'path';

            setDrawings([{
                content,
                count,
                type: finalContentType,
                key: Date.now()
            }]);

            progress.setValue(0);
            Animated.timing(progress, {
                toValue: 1,
                duration: duration,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start();
        },
        showImage: (uri) => {
            console.log('📝 [BOARD] showImage called', { uri });
            setDrawings([]);
            setImageUri(uri);
            
            // Trigger animation
            progress.setValue(0);
            Animated.spring(progress, {
                toValue: 1,
                tension: 40,
                friction: 7,
                useNativeDriver: true,
            }).start();
        },
        clear: () => {
            console.log('📝 [BOARD] clear called');
            setDrawings([]);
            setImageUri(null);
            progress.setValue(0);
        },
    }));

    // دالة مساعدة لحساب مواضع الشبكة (Grid Layout)
    const calculateGridPositions = (count, startX = 150, startY = 160, spacing = 80) => {
        const positions = [];
        if (count === 1) return [{ x: startX, y: startY }];

        const cols = count > 3 ? 3 : count;
        const rows = Math.ceil(count / cols);

        for (let i = 0; i < count; i++) {
            const r = Math.floor(i / cols);
            const c = i % cols;

            positions.push({
                x: startX + (c - (cols - 1) / 2) * spacing,
                y: startY + (r - (rows - 1) / 2) * spacing
            });
        }
        return positions;
    };

    // تحويل مدخلات الرسم إلى كائنات قابلة للعرض
    const drawingsToRender = drawings.flatMap((draw, idx) => {
        const itemIsText = draw.type === 'text';
        const count = draw.count || 1;
        const baseKey = draw.key || `draw-${idx}`;

        const positions = calculateGridPositions(count);

        return positions.map((pos, subIdx) => ({
            type: itemIsText ? 'text' : 'path',
            content: draw.content,
            offset: pos,
            scale: count > 3 ? 0.5 : (count > 1 ? 0.7 : 1.0),
            key: `${baseKey}-${subIdx}`
        }));
    });

    const renderTextDrawings = () => {
        return drawingsToRender
            .filter(d => d.type === 'text')
            .map((drawItem) => {
                const textLength = drawItem.content?.toString().length || 1;
                const isLongText = textLength > 100; // نص طويل (مثل الحديث)
                
                // حساب حجم الخط بناءً على طول النص
                let fontSize;
                if (textLength > 500) {
                    fontSize = 11; // زيادة الحجم
                } else if (textLength > 300) {
                    fontSize = 13; // زيادة الحجم
                } else if (textLength > 200) {
                    fontSize = 16; // زيادة الحجم
                } else if (textLength > 100) {
                    fontSize = 20; // زيادة الحجم
                } else {
                    fontSize = Math.max(30, Math.min(55, 280 / textLength)); // نص قصير
                }
                
                fontSize *= drawItem.scale;
                
                // حساب lineHeight ديناميكياً
                let lineHeight;
                if (isLongText) {
                    // lineHeight كبير جداً لملء السبورة
                    if (textLength > 500) {
                        lineHeight = fontSize * 1.6; // تقليل بسيط (كان 1.8)
                    } else if (textLength > 300) {
                        lineHeight = fontSize * 2.2; // تقليل بسيط (كان 2.5)
                    } else if (textLength > 200) {
                        lineHeight = fontSize * 3.0; // تقليل بسيط (كان 3.5)
                    } else {
                        lineHeight = fontSize * 4.0; // تقليل بسيط (كان 5.0)
                    }
                } else {
                    lineHeight = fontSize * 1.5;
                }
                
                return (
                    <View
                        key={drawItem.key}
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            paddingHorizontal: isLongText ? 8 : 0,
                            paddingVertical: isLongText ? 8 : 0,
                        }}
                    >
                        <View
                            style={{
                                flex: 1,
                                justifyContent: 'center', // ← العودة للوسط (أفضل خيار)
                                alignItems: isLongText ? 'flex-end' : 'center',
                            }}
                        >
                            <Animated.Text
                                style={{
                                    fontSize,
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textAlign: isLongText ? 'justify' : 'center', // ⬅️ تغيير إلى ضبط (Justify) لترتيب النص
                                    alignSelf: isLongText ? 'flex-end' : 'center', // ⬅️ إضافة المحاذاة الذاتية لليمين
                                    opacity: progress,
                                    textShadowColor: 'rgba(255, 255, 255, 0.4)',
                                    textShadowOffset: { width: 0, height: 0 },
                                    textShadowRadius: 8,
                                    lineHeight: lineHeight,
                                    width: isLongText ? '100%' : undefined,
                                    writingDirection: 'rtl', 
                                    // transform removal: Making text "Normal" and straight as requested
                                    // transform: [
                                    //    { rotate: '-3deg' }, 
                                    //    { skewX: '-10deg' } 
                                    // ], 
                                    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', // Ensure normal system font
                                }}
                            >
                                {drawItem.content}
                            </Animated.Text>
                        </View>
                    </View>
                );
            });
    };

    return (
        <View style={styles.container}>
            <View style={styles.drawingArea}>
                {imageUri ? (
                    <Animated.View 
                        style={[
                            styles.imageWrapper,
                            {
                                opacity: progress,
                                transform: [
                                    { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                                    { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                                    { rotate: '-1deg' }
                                ]
                            }
                        ]}
                    >
                        <Image
                            source={{ uri: imageUri }}
                            style={styles.homeworkImage}
                            resizeMode="cover"
                        />
                        {/* Decorative Tape/Corner for Premium Look */}
                        <View style={styles.tapeDecor} />
                    </Animated.View>
                ) : (
                    <>
                        <Svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 300 300"
                        >
                            {drawingsToRender
                                .filter(d => d.type === 'path')
                                .map((drawItem) => (
                                    <AnimatedPath
                                        key={drawItem.key}
                                        d={drawItem.content}
                                        stroke="#F9F9F9"
                                        strokeWidth={12 * drawItem.scale}
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeDasharray={[2000, 2000]}
                                        strokeDashoffset={progress.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [2000, 0],
                                        })}
                                        transform={`translate(${drawItem.offset.x - 150}, ${drawItem.offset.y - 150}) scale(${drawItem.scale})`}
                                    />
                                ))
                            }
                        </Svg>
                        {/* Text must be sibling to Svg to render correctly in React Native */}
                        {renderTextDrawings()}
                    </>
                )}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
    },
    drawingArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageWrapper: {
        width: '85%',
        height: '85%',
        backgroundColor: '#FFF',
        padding: 6,
        borderRadius: 4,
        // High quality shadow for "stuck on board" look
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 10,
    },
    homeworkImage: {
        width: '100%',
        height: '100%',
        borderRadius: 2,
    },
    tapeDecor: {
        position: 'absolute',
        top: -10,
        left: '40%',
        width: 40,
        height: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 2,
        transform: [{ rotate: '5deg' }],
    },
});

export default ChalkboardWhiteboard;
