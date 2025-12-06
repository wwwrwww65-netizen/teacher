import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Image,
    TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';
import { theme } from '../config/theme';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);

        // Simulate API call
        setTimeout(async () => {
            // For demo: accept any email/password
            await AsyncStorage.setItem('token', 'demo-token');
            await AsyncStorage.setItem('user', JSON.stringify({
                name: 'طفل صغير',
                email,
                avatar: '👦',
                level: 1,
                points: 0,
            }));
            setLoading(false);
            navigation.replace('Home');
        }, 1000);
    };

    const handleGuestLogin = async () => {
        await AsyncStorage.setItem('token', 'guest-token');
        await AsyncStorage.setItem('user', JSON.stringify({
            name: 'ضيف',
            email: 'guest@tinyteacher.com',
            avatar: '👤',
            level: 1,
            points: 0,
        }));
        navigation.replace('Home');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                {/* Logo/Mascot */}
                <View style={styles.header}>
                    <Text style={styles.logo}>🤖</Text>
                    <Text style={styles.title}>Tiny Teacher</Text>
                    <Text style={styles.subtitle}>تعلم مع المعلم الصغير</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>البريد الإلكتروني</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="your@email.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>كلمة المرور</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <Button
                        title="تسجيل الدخول"
                        onPress={handleLogin}
                        loading={loading}
                        fullWidth
                        style={styles.loginButton}
                    />

                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.link}>ليس لديك حساب؟ سجل الآن</Text>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>أو</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <Button
                        title="الدخول كضيف"
                        onPress={handleGuestLogin}
                        variant="outline"
                        fullWidth
                    />
                </View>
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
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xxl,
    },
    logo: {
        fontSize: 80,
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: theme.fontSize.xxxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.primary,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.fontSize.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    loginButton: {
        marginTop: theme.spacing.md,
    },
    link: {
        textAlign: 'center',
        color: theme.colors.primary,
        fontSize: theme.fontSize.sm,
        marginTop: theme.spacing.md,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme.spacing.xl,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.border,
    },
    dividerText: {
        marginHorizontal: theme.spacing.md,
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
    },
});

export default LoginScreen;
