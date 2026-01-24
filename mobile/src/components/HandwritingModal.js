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
    ActivityIndicator,
    Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient'; 
import { theme } from '../config/theme';

const { width } = Dimensions.get('window');

// مسارات الحروف (أمثلة)
const LETTER_PATHS = {
    // --- ARABIC ALPHABET ---
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
    const activePathRef = useRef(null); // 🚀 Direct Native Access

    // Status: 'drawing' | 'checking' | 'success' | 'failure'
    const [checkStatus, setCheckStatus] = useState('drawing');

    // 🧠 تحديد نوع المحتوى (رقم أو حرف)
    const isNumber = /^[0-9\u0660-\u0669]+$/.test(letter?.toString().trim());

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                if (checkStatus !== 'drawing') return;
                const { locationX, locationY } = evt.nativeEvent;
                const newPath = `M${locationX} ${locationY}`;
                pathRef.current = newPath;
                // 🚀 Perf: Use setNativeProps for instant feedback
                if (activePathRef.current) {
                    activePathRef.current.setNativeProps({ d: newPath });
                }
            },
            onPanResponderMove: (evt) => {
                if (checkStatus !== 'drawing') return;
                const { locationX, locationY } = evt.nativeEvent;
                const newPath = `${pathRef.current} L${locationX} ${locationY}`;
                pathRef.current = newPath;
                // 🚀 Perf: Avoid setState, use direct native update
                if (activePathRef.current) {
                    activePathRef.current.setNativeProps({ d: newPath });
                }
            },
            onPanResponderRelease: () => {
                if (checkStatus !== 'drawing') return;
                const finishedPath = pathRef.current;
                
                // Commit to React State
                if (finishedPath) {
                    setPaths((prev) => [...prev, finishedPath]);
                }
                
                // Reset Native Path immediately
                if (activePathRef.current) {
                    activePathRef.current.setNativeProps({ d: '' });
                }
                
                pathRef.current = '';
                // No need to clear currentPath state as we didn't use it for live drawing
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            console.log('✍️ [WRITE-MODAL] opened', { letter });
            setPaths([]);
            setCurrentPath('');
            setCheckStatus('drawing');
            overlayOpacity.setValue(0);
            scaleAnim.setValue(0);
            // Shake entrance
            triggerEntrance();
        } else {
            console.log('✍️ [WRITE-MODAL] closed', { letter });
        }
    }, [visible, letter]);

    const handleClear = () => {
        if (checkStatus !== 'drawing') return;
        console.log('✍️ [WRITE-MODAL] clear pressed');
        setPaths([]);
        setCurrentPath('');
    };

    const shakeAnim = useRef(new Animated.Value(0)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const entranceScale = useRef(new Animated.Value(0.8)).current;
    const entranceOpacity = useRef(new Animated.Value(0)).current;

    const triggerEntrance = () => {
        entranceScale.setValue(0.8);
        entranceOpacity.setValue(0);
        Animated.parallel([
            Animated.spring(entranceScale, { toValue: 1, friction: 6, useNativeDriver: true }),
            Animated.timing(entranceOpacity, { toValue: 1, duration: 300, useNativeDriver: true })
        ]).start();
    };

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

    const validateDrawing = (drawnPaths) => {
         let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        let totalPoints = 0;
        let pointsInside = 0;

        // "Target Zone" (Where the letter actually sits)
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
        const maxDim = Math.max(width, height);
        if (maxDim < 40) return false; 

        // 3. Containment Check
        if ((pointsInside / totalPoints) < 0.50) return false;

        // 4. Position Check
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        if (centerX < 80 || centerX > 220) return false;
        if (centerY < 80 || centerY > 220) return false;

        return true;
    };

    const handleSubmit = () => {
        if (checkStatus !== 'drawing') return;

        if (paths.length < 1) {
            console.log('✍️ [WRITE-MODAL] submit with no ink');
            triggerShake();
            return;
        }

        console.log('✍️ [WRITE-MODAL] submit', { pathsCount: paths.length });
        setCheckStatus('checking');

        // Verify Logic
        const isValid = validateDrawing(paths);

        setTimeout(() => {
            if (isValid) {
                console.log('✍️ [WRITE-MODAL] validation success');
                setCheckStatus('success');
                animateOverlay();
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                }, 1500);
            } else {
                console.log('✍️ [WRITE-MODAL] validation failure');
                setCheckStatus('failure');
                animateOverlay();
                setTimeout(() => {
                    if (onFailure) onFailure(); // Use dedicated failure callback
                    else if (onClose) onClose();
                }, 1500);
            }
        }, 1000);
    };

    const isText = (content) => {
        return typeof content === 'string' && !content.trim().startsWith('M') && content.length < 20;
    };
    const drawingContent = LETTER_PATHS[letter] || (typeof letter === 'string' ? letter : 'أ');
    const isLetterText = isText(drawingContent);

    // Calculate dynamic font size based on VISUAL length (ignoring Tashkeel/Diacritics)
    const getVisualLength = (str) => {
        if (!str) return 0;
        // Strip Arabic Diacritics (064B-065F) and Tatweel (0640) and Superscript (0670)
        return str.replace(/[\u064B-\u065F\u0670\u0640]/g, '').length;
    };

    const getContentFontSize = (text) => {
        const len = getVisualLength(text);
        if (len <= 1) return "240"; // Single letter: Massive
        if (len <= 2) return "200"; // Syllable
        if (len <= 3) return "180"; // Very Short Word
        if (len <= 4) return "160"; // Short Name (Hashim/Yasser) - OPTIMIZED
        if (len <= 5) return "140"; // Medium
        if (len <= 7) return "110";  // Long Word
        return "90"; // Long sentence
    };
    const dynamicFontSize = getContentFontSize(drawingContent);

    // Dynamic Title
    const getTitle = () => {
        if (checkStatus === 'checking') return 'جاري التصحيح...';
        if (checkStatus === 'success') return 'أحسنت! 🌟';
        if (checkStatus === 'failure') return 'حاول مرة أخرى 🔁';
        // Handle "word" vs "letter" in title
        const typeLabel = isNumber ? 'الرقم' : (drawingContent.length > 1 ? 'الكلمة' : 'الحرف');
        return `اكتب ${typeLabel}: ${letter}`;
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none" // Custom animation
            onRequestClose={checkStatus === 'drawing' ? onClose : () => { }}
        >
            <View style={styles.overlay}>
                <Animated.View style={[
                    styles.container, 
                    { 
                        transform: [
                            { translateX: shakeAnim },
                            { scale: entranceScale }
                        ],
                        opacity: entranceOpacity 
                    }
                ]}>
                    
                    {/* Header Gradient Border Effect */}
                    <LinearGradient
                        colors={['#FF9A9E', '#FECFEF', '#a18cd1', '#fbc2eb']}
                        start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                        style={styles.headerGradient}
                    />

                    {/* زر الإغلاق العلوي */}
                    {checkStatus === 'drawing' && (
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.title}>{getTitle()}</Text>

                    <View style={styles.canvasContainer}>
                        {/* 🌟 Template: WebView for Dotted Arabic Text (Perfect Shaping) */}
                        {isLetterText && (
                            <View style={styles.textTemplateContainer} pointerEvents="none">
                                {/* Fallback to Native Text: Only reliable way to render connected Arabic correctly on all devices */}
                                <WebView
                                    style={{ width: 320, height: 320, backgroundColor: '#FAFAFA', opacity: 0.99 }}
                                    androidLayerType="software"
                                    originWhitelist={['*']}
                                    source={{
                                        baseUrl: '',
                                        html: `
                                        <!DOCTYPE html>
                                        <html>
                                            <head>
                                                <meta name="viewport" content="width=320, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                                                <style>
                                                    body { margin:0; padding:0; width:100%; height:100%; background-color:#FAFAFA; overflow:hidden; display:flex; justify-content:center; align-items:center; }
                                                    svg { width: 320px; height: 320px; }
                                                    .txt { 
                                                        font-family: sans-serif; 
                                                        font-weight: 900; 
                                                        font-size: ${dynamicFontSize}px; 
                                                        fill: none; 
                                                        stroke: #808080; /* Lighter Gray */
                                                        stroke-width: 3px; 
                                                        stroke-linecap: round;
                                                        stroke-dasharray: 1, 9; /* Wider Spacing */
                                                    }
                                                </style>
                                            </head>
                                            <body>
                                                <svg viewBox="0 0 320 320">
                                                    <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" class="txt">
                                                        ${drawingContent}
                                                    </text>
                                                </svg>
                                            </body>
                                        </html>
                                    `}}
                                    javaScriptEnabled={false}
                                    scrollEnabled={false} 
                                />
                            </View>
                        )}

                        <Svg height="320" width="320" style={styles.svg} pointerEvents="none">
                            {/* SVG Paths Template (if not text) */}
                            {!isLetterText && (
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
                                    stroke={theme.colors.primary} strokeWidth="10"
                                    fill="none" strokeLinecap="round" strokeLinejoin="round"
                                />
                            ))}
                            <Path
                                ref={activePathRef}
                                d="" // Start empty, controlled by setNativeProps
                                stroke={theme.colors.primary} strokeWidth="10"
                                fill="none" strokeLinecap="round" strokeLinejoin="round"
                            />
                        </Svg>

                        {/* 🖱️ TOUCH LAYER: Transperant overlay dedicated for gestures */}
                        <View 
                            style={styles.touchLayer} 
                            {...panResponder.panHandlers} 
                        />

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
                                        <Text style={styles.feedbackText}>رائع!</Text>
                                    </Animated.View>
                                )}
                                {checkStatus === 'failure' && (
                                    <Animated.View style={[styles.feedbackContent, { transform: [{ scale: scaleAnim }] }]}>
                                        <Text style={styles.feedbackIcon}>💪</Text>
                                        <Text style={styles.feedbackText}>حاول مجدداً</Text>
                                    </Animated.View>
                                )}
                            </Animated.View>
                        )}
                    </View>

                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[styles.buttonWrapper, checkStatus !== 'drawing' && styles.disabledBtn]}
                            onPress={handleClear}
                            disabled={checkStatus !== 'drawing'}
                        >
                             <LinearGradient
                                colors={['#f6d365', '#fda085']}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>مسح 🔄</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.buttonWrapper, checkStatus !== 'drawing' && styles.disabledBtn]}
                            onPress={handleSubmit}
                            disabled={checkStatus !== 'drawing'}
                        >
                            <LinearGradient
                                colors={['#4facfe', '#00f2fe']}
                                style={styles.buttonGradient}
                            >
                                <Text style={[styles.buttonText, { color: 'white' }]}>تم ✅</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 20, 
    },
    container: {
        width: '100%',
        maxWidth: 400, 
        backgroundColor: 'white',
        borderRadius: 30, 
        padding: 25, 
        alignItems: 'center',
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        overflow: 'hidden', // important for header gradient
    },
    headerGradient: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 8,
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f1f2f6',
        borderRadius: 18,
        zIndex: 5,
        elevation: 2,
    },
    closeButtonText: {
        fontSize: 18,
        color: '#ff6b6b',
        fontWeight: 'bold',
        marginTop: -2
    },
    title: {
        fontSize: 28, 
        fontWeight: '800', 
        color: '#2d3436', 
        marginBottom: 20,
        marginTop: 15, 
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.05)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    canvasWrapper: {
        padding: 5,
        backgroundColor: '#fff',
        borderRadius: 25,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        marginBottom: 25,
    },
    canvasContainer: {
        width: 320, 
        height: 320, 
        backgroundColor: '#FAFAFA',
        borderRadius: 20, 
        borderWidth: 2, 
        borderColor: '#eee',
        borderStyle: 'dashed', // dashed border looks like a workbook
        overflow: 'hidden', 
        position: 'relative',
    },
    svg: { 
        position: 'absolute',
        top: 0, 
        left: 0,
        right: 0,
        bottom: 0,
    },
    touchLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 5, // Ensure it's above everything else in the container
    },
    feedbackOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center',
        zIndex: 10
    },
    feedbackContent: {
        alignItems: 'center', justifyContent: 'center',
        padding: 20
    },
    feedbackIcon: {
        fontSize: 80, marginBottom: 15,
    },
    feedbackText: {
        fontSize: 30, fontWeight: 'bold', color: theme.colors.primary,
    },
    buttons: {
        flexDirection: 'row', 
        gap: 20, 
        width: '100%',
        justifyContent: 'space-around', 
        paddingHorizontal: 10, 
    },
    buttonWrapper: {
        flex: 1, 
        borderRadius: 20, 
        elevation: 5,
        shadowColor: '#00af',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    buttonGradient: {
        paddingVertical: 15, 
        borderRadius: 20, 
        alignItems: 'center', 
        justifyContent: 'center',
    },
    disabledBtn: { opacity: 0.6 },
    buttonText: {
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    // 🌟 Native Text Template Styles
    textTemplateContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0, // Behind drawing
    },
    templateText: {
        fontWeight: 'bold',
        color: '#E0E0E0', // Light Gray for Tracing
        textAlign: 'center',
        opacity: 0.6 // Consistent faint look
    }
});

export default HandwritingModal;
