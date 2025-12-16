import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    PanResponder,
    Dimensions
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../config/theme';

const { width } = Dimensions.get('window');

// مسارات الحروف (أمثلة)
const LETTER_PATHS = {
    // --- ARABIC ALPHABET (الحروف العربية) ---
    'أ': 'M150 50 L150 250 M170 20 C140 20 140 40 170 40 L190 50',
    'ب': 'M250 150 Q150 250 50 150 M150 270 L150 280', // Dot below
    'ت': 'M250 150 Q150 250 50 150 M120 100 L120 110 M180 100 L180 110', // 2 Dots above
    'ث': 'M250 150 Q150 250 50 150 M150 80 L140 100 L160 100 Z', // Triangle dots
    'ج': 'M100 100 L200 100 Q200 250 100 250 M150 180 L160 170', // Dot inside
    'ح': 'M100 100 L200 100 Q200 250 100 250',
    'خ': 'M100 100 L200 100 Q200 250 100 250 M150 50 L150 60', // Dot above
    'د': 'M150 100 Q200 150 150 200',
    'ذ': 'M150 100 Q200 150 150 200 M150 50 L150 60',
    'ر': 'M150 100 Q150 200 50 250',
    'ز': 'M150 100 Q150 200 50 250 M150 50 L150 60',
    'س': 'M250 100 L250 150 M200 100 L200 150 M150 100 L150 200 Q100 250 50 200',
    'ش': 'M250 100 L250 150 M200 100 L200 150 M150 100 L150 200 Q100 250 50 200 M200 50 L190 70 L210 70 Z',
    'ص': 'M100 150 Q150 100 200 150 L100 150 Q50 250 150 250',
    'ض': 'M100 150 Q150 100 200 150 L100 150 Q50 250 150 250 M150 80 L150 90',
    'ط': 'M100 150 Q150 100 200 150 L100 150 M150 50 L150 150',
    'ظ': 'M100 150 Q150 100 200 150 L100 150 M150 50 L150 150 M180 80 L180 90',
    'ع': 'M200 100 Q150 100 150 150 Q100 150 100 250 Q200 250 250 200',
    'غ': 'M200 100 Q150 100 150 150 Q100 150 100 250 Q200 250 250 200 M180 50 L180 60',
    'ف': 'M200 100 Q220 80 200 80 Q180 80 180 100 L180 150 L50 150 M200 60 L200 70',
    'ق': 'M200 100 Q220 80 200 80 Q180 80 180 100 L180 150 Q100 250 50 150 M190 60 L190 70 M210 60 L210 70',
    'ك': 'M200 50 L200 150 L50 150 M150 100 L100 100', // Simplified Kaf
    'ل': 'M200 50 L200 200 Q150 250 100 200',
    'م': 'M200 150 A20 20 0 1 0 200 110 L200 150 L150 150 L150 250',
    'ن': 'M200 150 Q150 250 100 150 M150 100 L150 110',
    'هـ': 'M250 100 Q200 200 150 150 Q200 100 250 100 A 30 30 0 1 0 190 150', // Complex Haa simplified
    'و': 'M200 150 A20 20 0 1 0 200 110 Q200 200 100 250',
    'ي': 'M250 100 Q200 150 150 150 Q100 150 100 200 Q150 250 250 200 M150 270 L140 280 M160 270 L170 280',

    // --- NUMBERS (الأرقام) ---
    '1': 'M150 50 L150 250',
    '2': 'M100 100 Q200 100 200 150 Q200 250 100 250 L250 250',
    '3': 'M100 50 Q200 50 200 100 Q150 100 200 100 Q200 150 100 150',
    '4': 'M200 150 L50 150 L50 50 M50 150 L50 250', // Simplified 4
    '5': 'M200 50 L100 50 L100 100 Q200 150 100 200',

    // --- SHAPES (الأشكال) ---
    'دائرة': 'M150 50 A100 100 0 1 1 149 50',
    'مربع': 'M50 50 L250 50 L250 250 L50 250 Z',
    'مثلث': 'M150 50 L250 250 L50 250 Z',
    'نجمة': 'M150 20 L180 100 L270 100 L200 160 L230 250 L150 200 L70 250 L100 160 L30 100 L120 100 Z',

    // --- ENGLISH ---
    'A': 'M150 50 L50 250 M150 50 L250 250 M100 150 L200 150',
    'B': 'M100 50 L100 250 M100 50 Q200 50 200 100 Q200 150 100 150 M100 150 Q200 150 200 200 Q200 250 100 250',

    'default': 'M150 50 A100 100 0 1 1 149 50' // Circle fallback
};

const HandwritingModal = ({ visible, letter, onClose, onSuccess }) => {
    const [paths, setPaths] = useState([]);
    const [currentPath, setCurrentPath] = useState('');
    const pathRef = useRef(''); // Ref to hold current path value to avoid stale closures

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                const newPath = `M${locationX} ${locationY}`;
                pathRef.current = newPath; // Update ref
                setCurrentPath(newPath); // Update state for render
            },
            onPanResponderMove: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                const newPath = `${pathRef.current} L${locationX} ${locationY}`;
                pathRef.current = newPath;
                setCurrentPath(newPath);
            },
            onPanResponderRelease: () => {
                const finishedPath = pathRef.current; // Capture value BEFORE resetting ref
                if (finishedPath) {
                    setPaths((prev) => [...prev, finishedPath]);
                }
                pathRef.current = '';
                setCurrentPath('');
            },
            onPanResponderTerminate: () => {
                const finishedPath = pathRef.current; // Capture value BEFORE resetting ref
                if (finishedPath) {
                    setPaths((prev) => [...prev, finishedPath]);
                }
                pathRef.current = '';
                setCurrentPath('');
            },
        })
    ).current;

    const handleClear = () => {
        setPaths([]);
        setCurrentPath('');
    };

    const handleSubmit = () => {
        // هنا يمكن إضافة منطق للتحقق من دقة الرسم
        // للتبسيط، سنعتبر المحاولة ناجحة إذا رسم الطفل شيئاً
        if (paths.length > 0) {
            onSuccess();
        } else {
            onClose();
        }
        setPaths([]);
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>اكتب الحرف: {letter}</Text>

                    <View style={styles.canvasContainer} {...panResponder.panHandlers}>
                        {/* الحرف المراد كتابته (منقط) */}
                        <Svg height="300" width="300" style={styles.svg} pointerEvents="none">
                            <Path
                                d={LETTER_PATHS[letter] || LETTER_PATHS['default']}
                                stroke="#ddd"
                                strokeWidth="20"
                                strokeDasharray="10, 10"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* رسم الطفل */}
                            {paths.map((d, index) => (
                                <Path
                                    key={index}
                                    d={d}
                                    stroke={theme.colors.primary}
                                    strokeWidth="10"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            ))}
                            <Path
                                d={currentPath}
                                stroke={theme.colors.primary}
                                strokeWidth="10"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </Svg>
                    </View>

                    <View style={styles.buttons}>
                        <TouchableOpacity style={styles.buttonClear} onPress={handleClear}>
                            <Text style={styles.buttonText}>مسح 🔄</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.buttonSubmit} onPress={handleSubmit}>
                            <Text style={[styles.buttonText, { color: 'white' }]}>تم ✅</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.9,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        ...theme.shadows.lg,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 20,
    },
    canvasContainer: {
        width: 300,
        height: 300,
        backgroundColor: '#f9f9f9',
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#eee',
        overflow: 'hidden',
    },
    svg: {
        position: 'absolute',
    },
    buttons: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 15,
    },
    buttonClear: {
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        flex: 1,
        alignItems: 'center',
    },
    buttonSubmit: {
        padding: 15,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
        flex: 1,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
});

export default HandwritingModal;
