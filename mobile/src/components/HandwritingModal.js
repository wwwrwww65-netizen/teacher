import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    PanResponder,
    Dimensions,
    Animated,
    ActivityIndicator
} from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { theme } from '../config/theme';

const { width } = Dimensions.get('window');

// مسارات الحروف (أمثلة)
const LETTER_PATHS = {
    // --- ARABIC ALPHABET (نستخدم النصوص لدقة العرض) ---
    'أ': "أ", 'إ': "إ", 'آ': "آ", 'ب': "ب", 'ت': "ت", 'ث': "ث",
    'ج': "ج", 'ح': "ح", 'خ': "خ", 'د': "د", 'ذ': "ذ", 'ر': "ر",
    'ز': "ز", 'س': "س", 'ش': "ش", 'ص': "ص", 'ض': "ض", 'ط': "ط",
    'ظ': "ظ", 'ع': "ع", 'غ': "غ", 'ف': "ف", 'ق': "ق", 'ك': "ك",
    'ل': "ل", 'م': "م", 'ن': "ن", 'هـ': "هـ", 'و': "و", 'ي': "ي",
    'ء': "ء",

    // --- NUMBERS (الأرقام) ---
    '1': "1", '2': "2", '3': "3", '4': "4", '5': "5",

    // --- ENGLISH ---
    'A': "A", 'B': "B",

    'default': 'M150 50 A100 100 0 1 1 149 50'
};

const HandwritingModal = ({ visible, letter, onClose, onSuccess, onFailure }) => {
    const [paths, setPaths] = useState([]);
    const [currentPath, setCurrentPath] = useState('');
    const pathRef = useRef('');

    // Status: 'drawing' | 'checking' | 'success' | 'failure'
    const [checkStatus, setCheckStatus] = useState('drawing');

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                if (checkStatus !== 'drawing') return;
                const { locationX, locationY } = evt.nativeEvent;
                const newPath = `M${locationX} ${locationY}`;
                pathRef.current = newPath;
                setCurrentPath(newPath);
            },
            onPanResponderMove: (evt) => {
                if (checkStatus !== 'drawing') return;
                const { locationX, locationY } = evt.nativeEvent;
                const newPath = `${pathRef.current} L${locationX} ${locationY}`;
                pathRef.current = newPath;
                setCurrentPath(newPath);
            },
            onPanResponderRelease: () => {
                if (checkStatus !== 'drawing') return;
                const finishedPath = pathRef.current;
                if (finishedPath) {
                    setPaths((prev) => [...prev, finishedPath]);
                }
                pathRef.current = '';
                setCurrentPath('');
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            setPaths([]);
            setCurrentPath('');
            setCheckStatus('drawing');
            overlayOpacity.setValue(0);
            scaleAnim.setValue(0);
        }
    }, [visible]);

    const handleClear = () => {
        if (checkStatus !== 'drawing') return;
        setPaths([]);
        setCurrentPath('');
    };

    const shakeAnim = useRef(new Animated.Value(0)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;

    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();
    };

    const animateOverlay = () => {
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true })
        ]).start();
    };

    // --- IMPROVED VALIDATION LOGIC ---
    const validateDrawing = (drawnPaths) => {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        let totalPoints = 0;
        let pointsInside = 0;

        // "Target Zone" (Where the letter actually sits)
        // Based on fontSize=180 and y=220, the visual letter is roughly in:
        // X: 70 - 230
        // Y: 80 - 240
        const TARGET_MIN_X = 50;
        const TARGET_MAX_X = 250;
        const TARGET_MIN_Y = 60;
        const TARGET_MAX_Y = 260;

        drawnPaths.forEach(p => {
            const parts = p.replace(/[ML]/g, ' ').trim().split(/\s+/);
            for (let i = 0; i < parts.length; i += 2) {
                const x = parseFloat(parts[i]);
                const y = parseFloat(parts[i + 1]);
                if (!isNaN(x) && !isNaN(y)) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;

                    totalPoints++;
                    // Check if point is inside the GENEROUS target box
                    if (x >= TARGET_MIN_X && x <= TARGET_MAX_X && y >= TARGET_MIN_Y && y <= TARGET_MAX_Y) {
                        pointsInside++;
                    }
                }
            }
        });

        // 1. Ink Check
        if (totalPoints < 10) return false;

        const width = maxX - minX;
        const height = maxY - minY;

        // 2. Minimum Size Check
        // Relaxed constraint: If it's a tall thin letter (Alif), width can be small.
        // If it's a flat wide letter (Ba), height can be small.
        // So we require Max dimension to be substantial.
        const maxDim = Math.max(width, height);
        if (maxDim < 50) return false; // Must be at least 50px long in some direction

        // 3. Containment Check
        // At least 60% of points must be inside the Target Zone.
        // This catches drawing in the far top margins or corners.
        if ((pointsInside / totalPoints) < 0.60) return false;

        // 4. Position Check (Centroid & Bounds)
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // A. Centroid must be generally central
        // 150 +/- 60 (Range: 90 - 210)
        if (centerX < 90 || centerX > 210) return false;
        if (centerY < 90 || centerY > 210) return false;

        // B. Vertical Bounds Sanity
        // A drawing cannot be ENTIRELY in the top 30% or bottom 30%
        if (maxY < 100) return false; // Too High (Stops before pixel 100)
        if (minY > 220) return false; // Too Low (Starts after pixel 220)

        return true;
    };

    const handleSubmit = () => {
        if (checkStatus !== 'drawing') return;

        if (paths.length < 1) {
            triggerShake();
            return;
        }

        setCheckStatus('checking');

        // Verify Logic
        const isValid = validateDrawing(paths);

        setTimeout(() => {
            if (isValid) {
                setCheckStatus('success');
                animateOverlay();
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                }, 1500);
            } else {
                setCheckStatus('failure');
                animateOverlay();
                setTimeout(() => {
                    if (onFailure) onFailure(); // Use dedicated failure callback
                    else if (onClose) onClose();
                }, 1500);
            }
        }, 1000);
    };

    // Rendering Helpers
    const isText = (content) => {
        return typeof content === 'string' && !content.trim().startsWith('M') && content.length < 10;
    };
    const drawingContent = LETTER_PATHS[letter] || (typeof letter === 'string' ? letter : 'أ');
    const isLetterText = isText(drawingContent);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={checkStatus === 'drawing' ? onClose : () => { }}
        >
            <View style={styles.overlay}>
                <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
                    <Text style={styles.title}>
                        {checkStatus === 'checking' ? 'جاري التصحيح...' :
                            checkStatus === 'success' ? 'أحسنت! 🌟' :
                                checkStatus === 'failure' ? 'حاول مرة أخرى 🔁' :
                                    `اكتب الحرف: ${letter}`}
                    </Text>

                    <View style={styles.canvasContainer} {...panResponder.panHandlers}>
                        <Svg height="300" width="300" style={styles.svg} pointerEvents="none">
                            {/* Template */}
                            {isLetterText ? (
                                <SvgText
                                    x="150" y="220"
                                    fontSize="180" fontWeight="bold"
                                    fill="none" stroke="#E0E0E0" strokeWidth="3"
                                    strokeDasharray="15, 10" textAnchor="middle"
                                >
                                    {drawingContent}
                                </SvgText>
                            ) : (
                                <Path
                                    d={drawingContent}
                                    stroke="#E0E0E0" strokeWidth="15"
                                    strokeDasharray="20, 15" fill="none"
                                    strokeLinecap="round" strokeLinejoin="round"
                                />
                            )}

                            {/* User Drawing */}
                            {paths.map((d, index) => (
                                <Path
                                    key={index} d={d}
                                    stroke={theme.colors.primary} strokeWidth="12"
                                    fill="none" strokeLinecap="round" strokeLinejoin="round"
                                />
                            ))}
                            <Path
                                d={currentPath}
                                stroke={theme.colors.primary} strokeWidth="12"
                                fill="none" strokeLinecap="round" strokeLinejoin="round"
                            />
                        </Svg>

                        {/* Feedback Overlay */}
                        {checkStatus !== 'drawing' && (
                            <Animated.View style={[styles.feedbackOverlay, { opacity: overlayOpacity }]}>
                                {checkStatus === 'checking' && (
                                    <View style={styles.feedbackContent}>
                                        <ActivityIndicator size="large" color="white" />
                                        <Text style={styles.feedbackText}>أنا أشاهد...</Text>
                                    </View>
                                )}
                                {checkStatus === 'success' && (
                                    <Animated.View style={[styles.feedbackContent, { transform: [{ scale: scaleAnim }] }]}>
                                        <Text style={styles.feedbackIcon}>✅</Text>
                                        <Text style={styles.feedbackText}>مُمْتَاز!</Text>
                                    </Animated.View>
                                )}
                                {checkStatus === 'failure' && (
                                    <Animated.View style={[styles.feedbackContent, { transform: [{ scale: scaleAnim }] }]}>
                                        <Text style={styles.feedbackIcon}>❌</Text>
                                        <Text style={styles.feedbackText}>خاطئ</Text>
                                    </Animated.View>
                                )}
                            </Animated.View>
                        )}
                    </View>

                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[styles.buttonClear, checkStatus !== 'drawing' && styles.disabledBtn]}
                            onPress={handleClear}
                            disabled={checkStatus !== 'drawing'}
                        >
                            <Text style={styles.buttonText}>مسح 🔄</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.buttonSubmit, checkStatus !== 'drawing' && styles.disabledBtn]}
                            onPress={handleSubmit}
                            disabled={checkStatus !== 'drawing'}
                        >
                            <Text style={[styles.buttonText, { color: 'white' }]}>تم ✅</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center', alignItems: 'center',
    },
    container: {
        width: width * 0.9, backgroundColor: 'white',
        borderRadius: 25, padding: 25, alignItems: 'center',
        ...theme.shadows.lg,
    },
    title: {
        fontSize: 26, fontWeight: 'bold', color: theme.colors.text, marginBottom: 20,
    },
    canvasContainer: {
        width: 300, height: 300, backgroundColor: '#FAFAFA',
        borderRadius: 20, borderWidth: 3, borderColor: '#F0F0F0',
        overflow: 'hidden', position: 'relative'
    },
    svg: { position: 'absolute' },
    feedbackOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
        zIndex: 10
    },
    feedbackContent: {
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)', padding: 20, borderRadius: 20,
    },
    feedbackIcon: {
        fontSize: 80, marginBottom: 10,
        textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 6
    },
    feedbackText: {
        fontSize: 24, fontWeight: 'bold', color: 'white',
        textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4
    },
    buttons: {
        flexDirection: 'row', marginTop: 25, gap: 15, width: '100%'
    },
    buttonClear: {
        padding: 15, borderRadius: 15, backgroundColor: '#F5F5F5',
        flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0'
    },
    buttonSubmit: {
        padding: 15, borderRadius: 15, backgroundColor: theme.colors.primary,
        flex: 1, alignItems: 'center', ...theme.shadows.md
    },
    disabledBtn: { opacity: 0.5 },
    buttonText: {
        fontSize: 20, fontWeight: 'bold', color: theme.colors.text,
    },
});

export default HandwritingModal;
