import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SmartBackground from '../components/SmartBackground';
import { theme } from '../config/theme';
import BouncyButton from '../components/BouncyButton';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    };

    const handleLogout = async () => {
        Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
            { text: 'إلغاء', style: 'cancel' },
            {
                text: 'نعم',
                onPress: async () => {
                    await AsyncStorage.removeItem('user');
                    navigation.replace('StudentSetup');
                }
            }
        ]);
    };

    // Mock Data for "Sticker Book"
    const stickers = [
        { id: 1, icon: '🦁', name: 'الأسد الشجاع', unlocked: true },
        { id: 2, icon: '🚀', name: 'رائد الفضاء', unlocked: true },
        { id: 3, icon: '🎨', name: 'الفنان الصغير', unlocked: false },
        { id: 4, icon: '👑', name: 'ملك الحروف', unlocked: false },
        { id: 5, icon: '🌟', name: 'النجم الساطع', unlocked: true },
        { id: 6, icon: '🐢', name: 'السلحفاة الحكيمة', unlocked: false },
    ];

    const renderShelf = (items) => (
        <View style={styles.shelfContainer}>
            <View style={styles.shelfContent}>
                {items.map((item, index) => (
                    <View key={index} style={[styles.stickerSlot, !item.unlocked && styles.lockedSlot]}>
                        <Text style={styles.stickerIcon}>{item.unlocked ? item.icon : '🔒'}</Text>
                        {item.unlocked && <View style={styles.shine} />}
                    </View>
                ))}
            </View>
            <View style={styles.shelfBoard} />
        </View>
    );

    return (
        <SmartBackground type="room">
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>⬅️</Text>
                </TouchableOpacity>
                <Text style={styles.title}>غرفتي 🏠</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutIcon}>🚪</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Avatar Frame */}
                <View style={styles.avatarSection}>
                    <View style={styles.frame}>
                        <View style={styles.avatarBg}>
                            <Text style={styles.avatarEmoji}>{user?.avatar || '👤'}</Text>
                        </View>
                        <Text style={styles.heroName}>{user?.name || 'البطل'}</Text>
                        <View style={styles.levelTag}>
                            <Text style={styles.levelText}>المستوى {user?.level || 1}</Text>
                        </View>
                    </View>
                </View>

                {/* Shelves Section */}
                <Text style={styles.sectionTitle}>مجموعة الملصقات 🏆</Text>
                {renderShelf(stickers.slice(0, 3))}
                {renderShelf(stickers.slice(3, 6))}

                {/* Stats as "Posters" on the wall */}
                <Text style={styles.sectionTitle}>إحصائياتي 📊</Text>
                <View style={styles.statsWall}>
                    <View style={[styles.poster, { backgroundColor: '#FF8A80', transform: [{ rotate: '-2deg' }] }]}>
                        <Text style={styles.posterTitle}>النقاط</Text>
                        <Text style={styles.posterValue}>{user?.points || 0}</Text>
                    </View>
                    <View style={[styles.poster, { backgroundColor: '#80D8FF', transform: [{ rotate: '2deg' }] }]}>
                        <Text style={styles.posterTitle}>نجوم</Text>
                        <Text style={styles.posterValue}>45</Text>
                    </View>
                    <View style={[styles.poster, { backgroundColor: '#CCFF90', transform: [{ rotate: '-1deg' }] }]}>
                        <Text style={styles.posterTitle}>دروس</Text>
                        <Text style={styles.posterValue}>12</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />

            </ScrollView>
        </SmartBackground>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 40
    },
    backIcon: { fontSize: 30 },
    logoutIcon: { fontSize: 25 },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#5D4037',
        backgroundColor: 'rgba(255,255,255,0.6)',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 15
    },
    scrollContent: {
        padding: 20
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 40
    },
    frame: {
        width: 180,
        height: 180,
        backgroundColor: '#FFF',
        borderRadius: 90,
        borderWidth: 8,
        borderColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5
    },
    avatarEmoji: { fontSize: 80 },
    heroName: {
        marginTop: 15,
        fontSize: 28,
        fontWeight: 'bold',
        color: '#3E2723',
        textShadowColor: 'rgba(255, 255, 255, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1
    },
    levelTag: {
        position: 'absolute',
        bottom: -15,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#FFF'
    },
    levelText: { color: 'white', fontWeight: 'bold' },

    // Shelf Styles
    shelfContainer: {
        marginBottom: 30,
        alignItems: 'center'
    },
    shelfContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 20,
        marginBottom: -5, // Sit on shelf
        zIndex: 1
    },
    shelfBoard: {
        width: '100%',
        height: 15,
        backgroundColor: '#8D6E63',
        borderRadius: 5,
        borderBottomWidth: 5,
        borderBottomColor: '#5D4037'
    },
    stickerSlot: {
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center'
    },
    stickerIcon: { fontSize: 50 },
    lockedSlot: { opacity: 0.3, transform: [{ scale: 0.8 }] },
    shine: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 35,
        transform: [{ rotate: '45deg' }]
    },

    // Stats Wall
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#5D4037',
        marginBottom: 15,
        textAlign: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignSelf: 'center',
        paddingHorizontal: 20,
        borderRadius: 10
    },
    statsWall: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
        flexWrap: 'wrap'
    },
    poster: {
        width: 90,
        height: 110,
        backgroundColor: 'white',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        // Tape effect?
    },
    posterTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333'
    },
    posterValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 5
    }
});

export default ProfileScreen;
