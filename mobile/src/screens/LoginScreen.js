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
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import BouncyButton from '../components/BouncyButton';
import { theme } from '../config/theme';
import { soundService } from '../services/SoundService';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { authService } from '../services/AuthService';
import { firebaseService } from '../services/FirebaseService';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const checkUserAndNavigate = async (user) => {
        // If email not verified (and you want to enforce it)
        if (!user.emailVerified) {
             // Optional: Force verification. For now, we allow it or redirect.
             // navigation.replace('EmailVerification');
             // Let's assume we proceed or check verification.
        }

        const studentData = await firebaseService.getStudentData();
        if (studentData && studentData.name) {
             navigation.replace('Home');
        } else {
             navigation.replace('StudentSetup');
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('تنبيه', 'رجاءً أدخل البريد وكلمة المرور');
            return;
        }

        setLoading(true);
        try {
            const user = await authService.signIn(email, password);
            soundService.playSuccess();
            await checkUserAndNavigate(user);
        } catch (error) {
            soundService.playError();
            Alert.alert('خطأ', error.message || 'فشل تسجيل الدخول');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const user = await authService.signInWithGoogle();
            soundService.playSuccess();
            await checkUserAndNavigate(user);
        } catch (error) {
            console.log(error);
            Alert.alert('خطأ', 'فشل تسجيل الدخول عبر Google');
        } finally {
            setLoading(false);
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
                <Circle cx="10%" cy="10%" r="50" fill={theme.colors.primary} opacity="0.1" />
                <Circle cx="90%" cy="20%" r="80" fill={theme.colors.secondary} opacity="0.1" />
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
                            <Text style={styles.mascot}>👩‍🏫</Text>
                            <Text style={styles.title}>أهلاً بك مجدداً!</Text>
                            <Text style={styles.subtitle}>المعلمة نورا اشتاقت إليك</Text>
                        </View>

                        <View style={styles.card}>
                            
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>البريد الإلكتروني</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="example@mail.com"
                                    placeholderTextColor="#A0AEC0"
                                    value={email}
                                    onChangeText={setEmail}
                                    textAlign="right"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>كلمة المرور</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#A0AEC0"
                                    value={password}
                                    onChangeText={setPassword}
                                    textAlign="right"
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity 
                                style={styles.forgotPass}
                                onPress={() => {
                                    if(email) authService.sendPasswordReset(email).then(() => Alert.alert('تم','راجع بريدك'));
                                    else Alert.alert('تنبيه', 'ادخل البريد اولا');
                                }}
                            >
                                <Text style={styles.forgotPassText}>نسيت كلمة المرور؟</Text>
                            </TouchableOpacity>

                            <BouncyButton
                                onPress={handleLogin}
                                style={styles.loginButton}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.loginButtonText}>دخول 🚀</Text>}
                            </BouncyButton>

                            <View style={styles.separator}>
                                <View style={styles.line} />
                                <Text style={styles.orText}>أو</Text>
                                <View style={styles.line} />
                            </View>

                             <BouncyButton
                                onPress={handleGoogleLogin}
                                style={styles.googleButton}
                                disabled={loading}
                            >
                                <Text style={styles.googleButtonText}>الدخول عبر Google 🇬</Text>
                            </BouncyButton>

                            <View style={styles.footerLink}>
                                <Text style={styles.footerText}>ليس لديك حساب؟ </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                    <Text style={styles.linkText}>إنشاء حساب جديد</Text>
                                </TouchableOpacity>
                            </View>

                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.lg },
    mascotContainer: { alignItems: 'center', marginBottom: theme.spacing.lg },
    mascot: { fontSize: 80, marginBottom: theme.spacing.sm },
    title: { fontSize: 28, fontWeight: 'bold', color: theme.colors.text, marginBottom: 5 },
    subtitle: { fontSize: 16, color: theme.colors.textSecondary },
    card: {
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 25,
        ...theme.shadows.lg,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    inputWrapper: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: theme.colors.text, marginBottom: 8, textAlign: 'right' },
    input: {
        backgroundColor: '#F7FAFC',
        borderRadius: 15,
        padding: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        color: theme.colors.text,
        textAlign: 'right'
    },
    loginButton: {
        backgroundColor: theme.colors.primary,
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
        ...theme.shadows.button,
    },
    loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    googleButton: {
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginTop: 10
    },
    googleButtonText: { color: '#333', fontSize: 16, fontWeight: '600' },
    separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
    orText: { marginHorizontal: 10, color: '#A0AEC0' },
    forgotPass: { alignItems: 'flex-start', marginBottom: 20 },
    forgotPassText: { color: theme.colors.primary, fontWeight: '600' },
    footerLink: { flexDirection: 'row-reverse', justifyContent: 'center', marginTop: 25 },
    footerText: { color: theme.colors.textSecondary },
    linkText: { color: theme.colors.primary, fontWeight: 'bold' }
});

export default LoginScreen;
