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
    'أ': 'M150 50 L150 200 M150 50 L130 30 M150 50 L170 30', // تقريبي للألف
    'ب': 'M250 150 Q150 250 50 150 M150 200 L150 210', // تقريبي للباء
    'A': 'M150 50 L50 250 M150 50 L250 250 M100 150 L200 150',
    '1': 'M150 50 L150 250',
};

const HandwritingModal = ({ visible, letter, onClose, onSuccess }) => {
    const [paths, setPaths] = useState([]);
    const [currentPath, setCurrentPath] = useState('');

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                setCurrentPath(`M${locationX} ${locationY}`);
            },
            onPanResponderMove: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                setCurrentPath((prev) => `${prev} L${locationX} ${locationY}`);
            },
            onPanResponderRelease: () => {
                setPaths((prev) => [...prev, currentPath]);
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
                        <Svg height="300" width="300" style={styles.svg}>
                            <Path
                                d={LETTER_PATHS[letter] || LETTER_PATHS['أ']}
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
