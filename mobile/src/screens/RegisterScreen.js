import React, { useState, useRef, useEffect } from 'react';
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
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    Dimensions,
    Image
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import BouncyButton from '../components/BouncyButton';
import { theme } from '../config/theme';
import { authService } from '../services/AuthService';
import { soundService } from '../services/SoundService';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
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
            const user = await authService.signUp(email, password, name);
            const { firebaseService } = require('../services/FirebaseService');
            
            const initialData = {
                guardianName: name,
                email: email,
                isSetupComplete: false
            };
            
            await firebaseService.saveStudentData(initialData);
            soundService.playSuccess();
            navigation.replace('EmailVerification');
        } catch (error) {
            soundService.playError();
            Alert.alert('خطأ التسجيل', error.message || 'حدث خطأ ما');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setLoading(true);
        try {
            const user = await authService.signInWithGoogle();
            soundService.playSuccess();
            const { firebaseService } = require('../services/FirebaseService');
            const studentData = await firebaseService.getStudentData();
            
            if (studentData && studentData.name) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            } else {
                navigation.replace('StudentSetup');
            }
        } catch (error) {
            console.log(error);
            Alert.alert('خطأ', 'فشل التسجيل عبر Google');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Animated Gradient Background */}
            <LinearGradient
                colors={['#667eea', '#764ba2', '#f093fb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Circles */}
            <View style={StyleSheet.absoluteFill}>
                <View style={[styles.circle, { top: -50, right: -50, width: 200, height: 200, opacity: 0.1 }]} />
                <View style={[styles.circle, { bottom: -80, left: -80, width: 250, height: 250, opacity: 0.08 }]} />
                <View style={[styles.circle, { top: '40%', left: -30, width: 150, height: 150, opacity: 0.06 }]} />
            </View>

            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                        scrollEventThrottle={16}
                        bounces={true}
                        overScrollMode="always"
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Back Button */}
                        <TouchableOpacity 
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-forward" size={24} color="#FFF" />
                        </TouchableOpacity>

                        {/* Header Section */}
                        <Animated.View 
                            style={[
                                styles.headerContainer,
                                { 
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
                                }
                            ]}
                            renderToHardwareTextureAndroid={true}
                        >
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <LinearGradient
                                    colors={['#FFD700', '#FFA500']}
                                    style={styles.iconGradient}
                                >
                                    <Image 
                                        source={require('../assets/teacher_logo.png')}
                                        style={styles.logoImage}
                                        resizeMode="contain"
                                    />
                                </LinearGradient>
                            </Animated.View>
                            <Text style={styles.title}>انضم إلى عائلتنا!</Text>
                            <Text style={styles.subtitle}>ابدأ رحلة تعليمية ممتعة مع طفلك</Text>
                        </Animated.View>

                        {/* Form Card */}
                        <Animated.View 
                            style={[
                                styles.cardContainer,
                                { 
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                            renderToHardwareTextureAndroid={true}
                        >
                            <View style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
                                {/* Name Input */}
                                <View style={styles.inputWrapper}>
                                    <View style={styles.labelRow}>
                                        <Ionicons name="person" size={18} color="#667eea" />
                                        <Text style={styles.label}>الاسم الرباعي (ولي الأمر)</Text>
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="أدخل اسمك الكامل"
                                            placeholderTextColor="rgba(0,0,0,0.5)"
                                            value={name}
                                            onChangeText={setName}
                                            textAlign="right"
                                        />
                                    </View>
                                </View>

                                {/* Email Input */}
                                <View style={styles.inputWrapper}>
                                    <View style={styles.labelRow}>
                                        <Ionicons name="mail" size={18} color="#667eea" />
                                        <Text style={styles.label}>البريد الإلكتروني</Text>
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="example@mail.com"
                                            placeholderTextColor="rgba(0,0,0,0.5)"
                                            value={email}
                                            onChangeText={setEmail}
                                            textAlign="right"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                {/* Password Input */}
                                <View style={styles.inputWrapper}>
                                    <View style={styles.labelRow}>
                                        <Ionicons name="lock-closed" size={18} color="#667eea" />
                                        <Text style={styles.label}>كلمة المرور</Text>
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <TouchableOpacity 
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={styles.eyeIcon}
                                        >
                                            <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="rgba(0,0,0,0.4)" />
                                        </TouchableOpacity>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="••••••••"
                                            placeholderTextColor="rgba(0,0,0,0.5)"
                                            value={password}
                                            onChangeText={setPassword}
                                            textAlign="right"
                                            secureTextEntry={!showPassword}
                                        />
                                    </View>
                                </View>

                                {/* Confirm Password */}
                                <View style={styles.inputWrapper}>
                                    <View style={styles.labelRow}>
                                        <Ionicons name="shield-checkmark" size={18} color="#667eea" />
                                        <Text style={styles.label}>تأكيد كلمة المرور</Text>
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <TouchableOpacity 
                                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                            style={styles.eyeIcon}
                                        >
                                            <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color="rgba(0,0,0,0.4)" />
                                        </TouchableOpacity>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="••••••••"
                                            placeholderTextColor="rgba(0,0,0,0.5)"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            textAlign="right"
                                            secureTextEntry={!showConfirmPassword}
                                        />
                                    </View>
                                </View>

                                {/* Register Button */}
                                <TouchableOpacity
                                    onPress={handleRegister}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                    style={styles.registerButtonContainer}
                                >
                                    <LinearGradient
                                        colors={['#4ECDC4', '#44A08D']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.registerButton}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : (
                                            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', width: '100%', paddingHorizontal: 15 }}>
                                                <Text style={[styles.registerButtonText, { flex: 1 }]}>
                                                    إنشاء الحساب
                                                </Text>
                                                <Ionicons name="arrow-back" size={20} color="#FFF" />
                                            </View>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Separator */}
                                <View style={styles.separator}>
                                    <View style={styles.line} />
                                    <Text style={styles.orText}>أو التسجيل عبر</Text>
                                    <View style={styles.line} />
                                </View>

                                {/* Google Button */}
                                <TouchableOpacity
                                    onPress={handleGoogleRegister}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                    style={styles.googleButtonContainer}
                                >
                                    <View style={styles.googleButton}>
                                        <Image 
                                            source={{ uri: 'https://img.icons8.com/color/96/000000/google-logo.png' }}
                                            style={{ width: 28, height: 28 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                </TouchableOpacity>

                                {/* Footer Link */}
                                <View style={styles.footerLink}>
                                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: '100%' }}>
                                        <Text style={styles.linkText} numberOfLines={2} adjustsFontSizeToFit>
                                            لديك حساب بالفعل؟ تسجيل الدخول
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    circle: { position: 'absolute', borderRadius: 1000, backgroundColor: '#FFF' },
    scrollContent: { 
        padding: 20, 
        paddingTop: 100, 
        paddingBottom: 40,
        minHeight: '100%',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        alignSelf: 'flex-end',
    },
    headerContainer: { alignItems: 'center', marginBottom: 30 },
    iconContainer: {
        marginBottom: 20,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    iconGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
        overflow: 'hidden',
    },
    logoImage: {
        width: 80,
        height: 80,
    },
    mascot: { fontSize: 50 },
    title: { 
        fontSize: 32, 
        fontWeight: 'bold', 
        color: '#FFF', 
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: { 
        fontSize: 16, 
        color: '#FFFFFF',
        textAlign: 'center',
        width: '100%',
        paddingHorizontal: 5,
        marginTop: 5,
    },
    cardContainer: {
        borderRadius: 30,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 20,
    },
    card: { padding: 25, borderRadius: 30 },
    inputWrapper: { marginBottom: 20 },
    labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6, justifyContent: 'flex-start' },
    label: { fontSize: 14, fontWeight: '600', color: '#333', flex: 1, textAlign: 'left' },
    inputContainer: { position: 'relative' },
    input: {
        backgroundColor: '#F7FAFC',
        borderRadius: 15,
        padding: 15,
        paddingLeft: 45,
        fontSize: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        color: '#333',
        textAlign: 'right',
    },
    eyeIcon: { position: 'absolute', left: 12, top: 15, zIndex: 1 },
    registerButtonContainer: {
        marginTop: 20,
        borderRadius: 15,
        elevation: 2,
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    registerButton: {
        height: 60,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 25,
    },
    registerButtonText: { 
        color: '#fff', 
        fontSize: 18, 
        fontWeight: 'bold',
        textAlign: 'center',
        includeFontPadding: false,
        paddingHorizontal: 15,
    },
    googleButtonContainer: {
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    googleButton: {
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    googleButtonText: { color: '#333', fontSize: 16, fontWeight: '600', flexShrink: 0 },
    separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 25, justifyContent: 'center' },
    line: { width: 60, height: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
    orText: { 
        paddingHorizontal: 12,
        color: 'rgba(0,0,0,0.5)', 
        fontSize: 14, 
        fontWeight: '600',
        textAlign: 'center',
        minWidth: 150,
    },
    footerLink: { alignItems: 'center', marginTop: 20 },
    linkText: { 
        color: '#667eea', 
        fontWeight: 'bold', 
        fontSize: 15,
        textAlign: 'center',
    },
});

export default RegisterScreen;
