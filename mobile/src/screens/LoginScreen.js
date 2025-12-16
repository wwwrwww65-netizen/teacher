import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BouncyButton from '../components/BouncyButton';
import { theme } from '../config/theme';
import { soundService } from '../services/SoundService';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';

const LoginScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('👦');

    const avatars = ['👦', '👧', '🦁', '🐰', '🦊', '🐱'];

    const handleLogin = async () => {
        soundService.playSuccess();
        const user = {
            name: name || 'البطل الصغير',
            avatar: selectedAvatar,
            level: 1,
            points: 50
        };
        try {
            await AsyncStorage.setItem('user', JSON.stringify(user));
        } catch (e) {
            console.log('AsyncStorage error', e); 
        }
        if (navigation && navigation.replace) {
            navigation.replace('Home');
        } else {
            console.log('Navigation not available, but Login Logic executed.');
            alert('Login Successful! (Navigation mocked)');
        }
    };

    // Background Gradient Component
    const Background = () => (
        <View style={StyleSheet.absoluteFill}>
            <Svg height="100%" width="100%">
                <Defs>
                    <LinearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0" stopColor="#E0F7FA" stopOpacity="1" />
                        <Stop offset="1" stopColor="#F8FAFC" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGrad)" />
                {/* Decorative Circles */}
                <Circle cx="10%" cy="10%" r="50" fill={theme.colors.primary} opacity="0.1" />
                <Circle cx="90%" cy="20%" r="80" fill={theme.colors.secondary} opacity="0.1" />
                <Circle cx="30%" cy="80%" r="60" fill={theme.colors.accent} opacity="0.1" />
            </Svg>
        </View>
    );

    return (
        <View style={styles.container}>
            <Background />
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>

                        <View style={styles.mascotContainer}>
                            <Text style={styles.mascot}>🤖</Text>
                            <Text style={styles.title}>أهلاً بك يا بطل!</Text>
                            <Text style={styles.subtitle}>المدرس الصغير ينتظرك</Text>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.label}>اختر شكلك المفضل</Text>
                            <View style={styles.avatarGrid}>
                                {avatars.map((av, index) => (
                                    <BouncyButton
                                        key={index}
                                        onPress={() => {
                                            soundService.playPop();
                                            setSelectedAvatar(av);
                                        }}
                                        style={[
                                            styles.avatarItem,
                                            selectedAvatar === av && styles.avatarSelected
                                        ]}
                                    >
                                        <Text style={styles.avatarText}>{av}</Text>
                                    </BouncyButton>
                                ))}
                            </View>

                            <Text style={styles.label}>ما اسمك؟</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="اكتب اسمك هنا..."
                                    placeholderTextColor="#A0AEC0"
                                    value={name}
                                    onChangeText={setName}
                                    textAlign="right"
                                />
                            </View>

                            <BouncyButton
                                onPress={handleLogin}
                                style={styles.loginButton}
                                soundName="success"
                            >
                                <Text style={styles.loginButtonText}>ابدأ المغامرة 🚀</Text>
                            </BouncyButton>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    mascotContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    mascot: {
        fontSize: 80,
        marginBottom: theme.spacing.sm,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 8,
    },
    title: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.xl,
        ...theme.shadows.lg,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    label: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    avatarItem: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F7FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    avatarSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: '#E0F2FE',
        transform: [{ scale: 1.1 }],
    },
    avatarText: {
        fontSize: 30,
    },
    inputWrapper: {
        marginBottom: theme.spacing.xl,
        backgroundColor: '#F7FAFC',
        borderRadius: theme.borderRadius.lg,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        paddingHorizontal: theme.spacing.md,
    },
    input: {
        paddingVertical: theme.spacing.md,
        fontSize: theme.fontSize.lg,
        color: theme.colors.text,
        textAlign: 'right', // Force RTL for Arabic name
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', // Ideally nice font
    },
    loginButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.round,
        alignItems: 'center',
        ...theme.shadows.button,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
    },
});

export default LoginScreen;
