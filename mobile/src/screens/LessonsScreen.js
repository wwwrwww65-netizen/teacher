console.log('🗺️ LessonsScreen Module Loaded');
import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Alert
} from 'react-native';
import { theme } from '../config/theme';
import Svg, { Path, Line } from 'react-native-svg';
import SmartBackground from '../components/SmartBackground';

const { width } = Dimensions.get('window');

// --- LEVEL DATA (The Map) ---
const LEVELS = [
    { id: 1, type: 'game', label: '1', title: 'صياد الحروف', target: 'أ', icon: '🎈', locked: false, x: 50, y: 50 },
    { id: 2, type: 'game', label: '2', title: 'فقع البالون', target: 'ب', icon: '🎪', locked: false, x: 200, y: 150 },
    { id: 3, type: 'game', label: '3', title: 'حرف التاء', target: 'ت', icon: '🐣', locked: true, x: 100, y: 300 },
    { id: 4, type: 'game', label: '4', title: 'قلعة الثاء', target: 'ث', icon: '🏰', locked: true, x: 250, y: 450 },
    { id: 5, type: 'game', label: '5', title: 'كنز الجيم', target: 'ج', icon: '💎', locked: true, x: 80, y: 600 },
];

const LessonsScreen = ({ navigation }) => {
    console.log('🗺️ LessonsScreen Rendering...');

    useEffect(() => {
        console.log('🗺️ LessonsScreen Mounted');
    }, []); const handleLevelPress = (level) => {
        console.log('📍 Level Pressed:', level.id, 'Locked:', level.locked);
        if (level.locked) {
            console.log('🔒 Level is locked');
            Alert.alert('🔒 مقفل', 'أكمل المراحل السابقة لفتح هذه المرحلة!');
            return;
        }

        if (level.type === 'game') {
            console.log('🎮 Navigating to MiniGame with params:', {
                targetLetter: level.target,
                level: level.id
            });
            navigation.navigate('MiniGame', {
                targetLetter: level.target,
                distractors: ['س', 'ش', 'ص', 'ع'], // Randomize later
                level: level.id
            });
        }
    };

    // Draw paths between nodes
    const renderPaths = () => {
        return (
            <Svg height={1500} width={width} style={styles.pathsLayer} pointerEvents="none">
                {LEVELS.map((level, index) => {
                    if (index === LEVELS.length - 1) return null;
                    const next = LEVELS[index + 1];
                    return (
                        <Line
                            key={`path-${index}`}
                            x1={level.x + 35} y1={level.y + 35}
                            x2={next.x + 35} y2={next.y + 35}
                            stroke={level.locked ? '#B0BEC5' : '#FFF176'} // Lighter colors for contrast on grass
                            strokeWidth="8"
                            strokeDasharray={level.locked ? "10, 5" : "0"}
                            strokeLinecap="round" // Nicer ends
                        />
                    );
                })}
            </Svg>
        );
    };

    return (
        <SmartBackground type="map">
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>⬅️</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>خريطة المغامرات 🗺️</Text>
            </View>

            <ScrollView contentContainerStyle={styles.mapContainer}>
                {renderPaths()}

                {LEVELS.map((level) => (
                    <TouchableOpacity
                        key={level.id}
                        style={[
                            styles.levelNode,
                            {
                                left: level.x,
                                top: level.y,
                                backgroundColor: level.locked ? '#CFD8DC' : theme.colors.secondary // Use Yellow/Orange for active levels
                            }
                        ]}
                        onPress={() => handleLevelPress(level)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.levelIcon}>{level.locked ? '🔒' : level.icon}</Text>
                        {!level.locked && (
                            <View style={styles.starBadge}>
                                <Text style={styles.starText}>⭐⭐⭐</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}

                {/* Extra space at bottom */}
                <View style={{ height: 200 }} />
            </ScrollView>
        </SmartBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#Dcedc8',
    },
    header: {
        padding: 20,
        paddingTop: 50,
        backgroundColor: 'rgba(255,255,255,0.8)',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...theme.shadows.md
    },
    backButton: {
        marginRight: 15,
    },
    backIcon: {
        fontSize: 24,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    mapContainer: {
        minHeight: 1000,
        paddingVertical: 50,
        position: 'relative'
    },
    pathsLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0
    },
    levelNode: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'white',
        ...theme.shadows.lg,
        zIndex: 1
    },
    levelIcon: {
        fontSize: 30,
    },
    starBadge: {
        position: 'absolute',
        bottom: -20,
        backgroundColor: 'white',
        borderRadius: 10,
        paddingHorizontal: 5,
        paddingVertical: 2,
        ...theme.shadows.sm
    },
    starText: {
        fontSize: 10
    }
});

export default LessonsScreen;
