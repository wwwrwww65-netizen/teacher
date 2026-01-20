import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, AppState } from 'react-native';
import { authService } from '../services/AuthService';
import BouncyButton from '../components/BouncyButton';
import { theme } from '../config/theme';

const EmailVerificationScreen = ({ navigation }) => {
    const [appState, setAppState] = useState(AppState.currentState);

    useEffect(() => {
        // Listen for app coming back to foreground to auto-check
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                checkVerification();
            }
            setAppState(nextAppState);
        });

        return () => subscription.remove();
    }, [appState]);

    const checkVerification = async () => {
        const user = authService.getCurrentUser();
        if (user) {
            await user.reload(); // Refresh token
            if (user.emailVerified) {
                navigation.replace('StudentSetup'); // Success -> Setup
            }
        }
    };

    const handleResend = async () => {
        try {
            const user = authService.getCurrentUser();
            if (user) await user.sendEmailVerification();
            alert('تم إعادة إرسال رابط التحقق');
        } catch (e) {
            console.error(e);
        }
    };

    const handleManualCheck = () => {
        checkVerification();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.emoji}>📧</Text>
                <Text style={styles.title}>تحقق من بريدك</Text>
                <Text style={styles.subtitle}>
                    أرسلنا رابط تحقق إلى بريدك الإلكتروني. الرجاء الضغط عليه ثم العودة هنا.
                </Text>

                <BouncyButton onPress={handleManualCheck} style={styles.checkButton}>
                    <Text style={styles.btnText}>تحققت من البريد ✅</Text>
                </BouncyButton>

                <BouncyButton onPress={handleResend} style={styles.resendButton}>
                    <Text style={styles.resendText}>إعادة إرسال الرابط</Text>
                </BouncyButton>
                
                 <BouncyButton onPress={() => authService.signOut()} style={styles.logoutBtn}>
                    <Text style={styles.resendText}>تسجيل الخروج</Text>
                </BouncyButton>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E0F7FA', // Soft Blue
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 25,
        padding: 30,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    emoji: { fontSize: 60, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 24 },
    checkButton: {
        backgroundColor: theme.colors.primary,
        padding: 15,
        borderRadius: 15,
        width: '100%',
        alignItems: 'center',
        marginBottom: 15
    },
    btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    resendButton: {
        padding: 15,
        borderRadius: 15,
        width: '100%',
        alignItems: 'center',
        backgroundColor: '#F7FAFC'
    },
    resendText: { color: theme.colors.textSecondary, fontWeight: '600' },
    logoutBtn: {
        marginTop: 20
    }
});

export default EmailVerificationScreen;
