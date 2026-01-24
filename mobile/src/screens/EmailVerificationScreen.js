import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, AppState, TouchableOpacity, Alert } from 'react-native';
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
            if (user) {
                await user.sendEmailVerification();
                Alert.alert('تم! ✅', 'أرسلنا رابطاً جديداً إلى بريدك. لا تنسَ تفقد صندوق الرسائل غير المرغوب فيها (Spam).');
            }
        } catch (e) {
            if (e.code === 'auth/too-many-requests') {
                Alert.alert('عذراً ✋', 'لقد طلبت الكثير من المحاولات. الرجاء الانتظار قليلاً قبل المحاولة مرة أخرى لحماية حسابك.');
            } else {
                Alert.alert('خطأ', 'فشل إرسال البريد. تأكد من أن البريد صحيح.');
            }
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
                <Text style={styles.title}>تفعيل الحساب</Text>
                <Text style={styles.subtitle}>
                    أرسلنا <Text style={{fontWeight: 'bold'}}>رابط تفعيل</Text> إلى بريدك الإلكتروني.
                    {"\n\n"}
                    ⚠️ <Text style={{color: '#E53E3E'}}>ملاحظة:</Text> لا يوجد رمز (Code). فقط اضغط على الرابط في الرسالة ليتفعل حسابك تلقائياً.
                </Text>

                <View style={styles.tipBox}>
                    <Text style={styles.tipText}>💡 تفقد مجلد "الرسائل غير المرغوب فيها" (Junk/Spam) إذا لم تجد الرسالة.</Text>
                </View>

                <BouncyButton onPress={handleManualCheck} style={styles.checkButton}>
                    <Text style={styles.btnText}>ضغطت على الرابط ✅</Text>
                </BouncyButton>

                <BouncyButton onPress={handleResend} style={styles.resendButton}>
                    <Text style={styles.resendText}>لم تصلني الرسالة؟ إعادة الإرسال</Text>
                </BouncyButton>
                
                 <TouchableOpacity 
                    onPress={async () => {
                        await authService.signOut();
                        navigation.replace('Login');
                    }} 
                    style={styles.logoutLink}
                >
                    <Text style={styles.linkText}>استخدام بريد آخر / خروج</Text>
                </TouchableOpacity>
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
    tipBox: {
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 12,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#FEF3C7'
    },
    tipText: {
        color: '#92400E',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18
    },
    logoutLink: {
        marginTop: 20,
        padding: 10
    },
    linkText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 14
    }
});

export default EmailVerificationScreen;
