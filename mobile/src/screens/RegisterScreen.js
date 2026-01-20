import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Alert,
    TouchableOpacity
} from 'react-native';
import BouncyButton from '../components/BouncyButton';
import { theme } from '../config/theme';
import { authService } from '../services/AuthService';
import { soundService } from '../services/SoundService';

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [country, setCountry] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword || !country) {
            Alert.alert('تنبيه', 'الرجاء تعبئة جميع الحقول');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('تنبيه', 'كلمات المرور غير متطابقة');
            return;
        }

        if (password.length < 6) {
             Alert.alert('تنبيه', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
             return;
        }

        setLoading(true);

        try {
            // 1. Create Auth User
            const user = await authService.signUp(email, password, name);
            
            // 2. Save generic profile info (e.g., Country) to Firestore if needed
            // Actually, we can save this later or now via FirebaseService if we had a method.
            // For now, Auth Profile 'displayName' is set. 
            // We can rely on StudentSetup to create the full firestore doc, OR create a stub here.
            // Let's create a stub here to store the country.
            const { firebaseService } = require('../services/FirebaseService');
            // Wait, we need to be logged in to write to 'students/{uid}'. 
            // Since signUp logs us in automatically, we can write now.
            
            const initialData = {
                guardianName: name,
                country: country,
                email: email,
                isSetupComplete: false
            };
            
            // We'll use a direct firestore set if simple, or just pass it in navigation params? 
            // Better to save it. "firebaseService.saveStudentData" works on current user ID.
            await firebaseService.saveStudentData(initialData);

            soundService.playSuccess();
            
            // 3. Navigate to Verification
            navigation.replace('EmailVerification');

        } catch (error) {
            soundService.playError();
            Alert.alert('خطأ التسجيل', error.message || 'حدث خطأ ما');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.logo}>📝</Text>
                        <Text style={styles.title}>حساب لولي الأمر</Text>
                        <Text style={styles.subtitle}>سجل بياناتك لمتابعة طفلك</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>الاسم الرباعي (ولي الأمر)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="الاسم الكامل"
                                value={name}
                                onChangeText={setName}
                                textAlign="right"
                            />
                        </View>

                         <View style={styles.inputContainer}>
                            <Text style={styles.label}>البلد</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="مثال: السعودية"
                                value={country}
                                onChangeText={setCountry}
                                textAlign="right"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>البريد الإلكتروني</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="your@email.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                textAlign="right"
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputContainer, {flex: 1, marginLeft: 5}]}>
                                <Text style={styles.label}>تأكيد المرور</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    textAlign="right"
                                />
                            </View>
                            <View style={[styles.inputContainer, {flex: 1, marginRight: 5}]}>
                                <Text style={styles.label}>كلمة المرور</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    textAlign="right"
                                />
                            </View>
                        </View>

                        <BouncyButton
                            onPress={handleRegister}
                            style={styles.registerButton}
                            disabled={loading}
                        >
                            <Text style={styles.btnText}>{loading ? 'جاري التسجيل...' : 'إنشاء الحساب 🆕'}</Text>
                        </BouncyButton>

                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
                            <Text style={styles.linkText}>لديك حساب بالفعل؟ تسجيل الدخول</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        padding: theme.spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        fontSize: 60,
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    form: {
        width: '100%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inputContainer: {
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
        textAlign: 'right'
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        textAlign: 'right'
    },
    registerButton: {
        marginTop: 10,
        marginBottom: 15,
        backgroundColor: theme.colors.secondary,
        padding: 15,
        borderRadius: 15,
        alignItems: 'center'
    },
    btnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18
    },
    loginLink: {
        alignItems: 'center',
        padding: 10
    },
    linkText: {
        color: theme.colors.primary,
        fontWeight: 'bold'
    }
});

export default RegisterScreen;
