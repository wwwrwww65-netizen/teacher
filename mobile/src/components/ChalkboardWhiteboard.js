import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { View, StyleSheet, Image, Animated, Easing, I18nManager } from 'react-native';
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
            .map((drawItem) => (
                <View
                    key={drawItem.key}
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: (drawItem.offset.y / 300) * 100 + '%',
                        transform: [
                            { translateY: -25 }  // Fine-tuned vertical alignment
                        ],
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Animated.Text
                        style={{
                            fontSize: Math.max(30, Math.min(55, 280 / (drawItem.content?.toString().length || 1))) * drawItem.scale,
                            fontWeight: 'bold',
                            color: 'white',
                            textAlign: 'center',
                            opacity: progress,
                            textShadowColor: 'rgba(255, 255, 255, 0.4)',
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 8,
                        }}
                    >
                        {drawItem.content}
                    </Animated.Text>
                </View>
            ));
    };

    return (
        <View style={styles.container}>
            <View style={styles.drawingArea}>
                {imageUri ? (
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.homeworkImage}
                        resizeMode="contain"
                    />
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
    homeworkImage: {
        width: '90%',
        height: '90%',
        borderRadius: 5,
        transform: [{ rotate: '-2deg' }],
    },
});

export default ChalkboardWhiteboard;
