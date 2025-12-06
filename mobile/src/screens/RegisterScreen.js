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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';
import { theme } from '../config/theme';

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            alert('كلمات المرور غير متطابقة');
            return;
        }

        setLoading(true);

        // Simulate API call
        setTimeout(async () => {
            await AsyncStorage.setItem('token', 'demo-token');
            await AsyncStorage.setItem('user', JSON.stringify({
                name,
                email,
                avatar: '👦',
                level: 1,
                points: 0,
            }));
            setLoading(false);
            navigation.replace('Home');
        }, 1000);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.logo}>🤖</Text>
                        <Text style={styles.title}>إنشاء حساب جديد</Text>
                        <Text style={styles.subtitle}>انضم إلى Tiny Teacher</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>الاسم</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="اسمك الكامل"
                                value={name}
                                onChangeText={setName}
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

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>تأكيد كلمة المرور</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        <Button
                            title="إنشاء الحساب"
                            onPress={handleRegister}
                            loading={loading}
                            fullWidth
                            style={styles.registerButton}
                        />

                        <Button
                            title="لديك حساب؟ سجل الدخول"
                            onPress={() => navigation.goBack()}
                            variant="ghost"
                            fullWidth
                        />
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
        marginTop: theme.spacing.xl,
        marginBottom: theme.spacing.xxl,
    },
    logo: {
        fontSize: 80,
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: theme.fontSize.xxl,
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
    registerButton: {
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
});

export default RegisterScreen;
