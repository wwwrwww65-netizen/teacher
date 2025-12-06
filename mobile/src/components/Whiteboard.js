import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import Animated, {
    useAnimatedProps,
    useSharedValue,
    withTiming,
    Easing,
    runOnJS
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const { width } = Dimensions.get('window');
const BOARD_WIDTH = width * 0.9;
const BOARD_HEIGHT = 200;

const Whiteboard = forwardRef((props, ref) => {
    const [paths, setPaths] = useState([]);
    const [currentPath, setCurrentPath] = useState(null);

    // Animation value for the current drawing path (0 to 1)
    const drawProgress = useSharedValue(0);

    useImperativeHandle(ref, () => ({
        // Method to start writing text/drawing
        write: (svgPathData, duration = 2000) => {
            // Reset progress
            drawProgress.value = 0;
            setCurrentPath(svgPathData);

            // Animate drawing
            drawProgress.value = withTiming(1, {
                duration: duration,
                easing: Easing.linear
            }, (finished) => {
                if (finished) {
                    runOnJS(finalizePath)(svgPathData);
                }
            });
        },
        clear: () => {
            setPaths([]);
            setCurrentPath(null);
            drawProgress.value = 0;
        }
    }));

    const finalizePath = (pathData) => {
        setPaths(prev => [...prev, pathData]);
        setCurrentPath(null);
        drawProgress.value = 0;
    };

    const animatedProps = useAnimatedProps(() => {
        return {
            strokeDashoffset: 1000 * (1 - drawProgress.value),
            strokeDasharray: 1000, // Assuming max path length is < 1000
            opacity: currentPath ? 1 : 0
        };
    });

    return (
        <View style={styles.container}>
            <View style={styles.boardFrame}>
                <Svg width={BOARD_WIDTH} height={BOARD_HEIGHT} viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}>
                    {/* Board Background */}
                    <Rect x="0" y="0" width={BOARD_WIDTH} height={BOARD_HEIGHT} fill="#ffffff" rx="10" />

                    {/* Existing Paths (Already drawn) */}
                    {paths.map((d, index) => (
                        <Path
                            key={index}
                            d={d}
                            stroke="#2c3e50"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ))}

                    {/* Current Animating Path */}
                    {currentPath && (
                        <AnimatedPath
                            d={currentPath}
                            stroke="#2c3e50"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            animatedProps={animatedProps}
                        />
                    )}
                </Svg>
            </View>
            <View style={styles.tray}>
                <View style={styles.marker} />
                <View style={[styles.marker, { backgroundColor: '#e74c3c' }]} />
                <View style={styles.eraser} />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 20,
    },
    boardFrame: {
        width: BOARD_WIDTH + 20,
        height: BOARD_HEIGHT + 20,
        backgroundColor: '#d35400', // Wood color
        padding: 10,
        borderRadius: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    tray: {
        width: BOARD_WIDTH,
        height: 15,
        backgroundColor: '#d35400',
        marginTop: -5,
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    marker: {
        width: 40,
        height: 8,
        backgroundColor: '#2c3e50',
        borderRadius: 4,
    },
    eraser: {
        width: 30,
        height: 10,
        backgroundColor: '#ecf0f1',
        borderRadius: 2,
    }
});

export default Whiteboard;
