import React, { useState, useCallback, useRef, useEffect } from 'react';
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
    ActivityIndicator,
    BackHandler,
    Modal,
    TouchableWithoutFeedback,
    Animated,
    Dimensions,
    Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../config/theme';
import { soundService } from '../services/SoundService';
import { authService } from '../services/AuthService';
import { firebaseService } from '../services/FirebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                setShowExitModal(true);
                return true;
            };

            BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }, [])
    );

    const checkUserAndNavigate = async (user) => {
        try {
            const studentData = await firebaseService.getStudentData();
            if (studentData && studentData.name) {
                await AsyncStorage.setItem('user', JSON.stringify(studentData));
                
                const { aiService } = require('../services/AIService');
                await aiService.loadMemory();

                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            } else {
                navigation.replace('StudentSetup');
            }
        } catch (error) {
            console.error('Check user error:', error);
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
                            <Text style={styles.title}>مرحباً بك</Text>
                            <Text style={styles.subtitle}>لنبدأ رحلة التعلم معاً</Text>
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

                                {/* Forgot Password */}
                                <TouchableOpacity 
                                    style={styles.forgotPass}
                                    onPress={() => {
                                        if(email) authService.sendPasswordReset(email).then(() => Alert.alert('تم','راجع بريدك'));
                                        else Alert.alert('تنبيه', 'ادخل البريد اولا');
                                    }}
                                >
                                    <Text style={styles.forgotPassText} numberOfLines={1} adjustsFontSizeToFit>نسيت كلمة المرور؟</Text>
                                </TouchableOpacity>

                                {/* Login Button */}
                                <TouchableOpacity
                                    onPress={handleLogin}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                    style={styles.loginButtonContainer}
                                >
                                    <LinearGradient
                                        colors={['#4ECDC4', '#44A08D']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.loginButton}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : (
                                            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', width: '100%', paddingHorizontal: 15 }}>
                                                <Text style={[styles.loginButtonText, { flex: 1 }]}>
                                                    تسجيل الدخول
                                                </Text>
                                                <Ionicons name="arrow-back" size={20} color="#FFF" />
                                            </View>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Separator */}
                                <View style={styles.separator}>
                                    <View style={styles.line} />
                                    <Text style={styles.orText} numberOfLines={1}>أو الدخول عبر</Text>
                                    <View style={styles.line} />
                                </View>

                                {/* Google Button */}
                                <TouchableOpacity
                                    onPress={handleGoogleLogin}
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
                                    <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ width: '100%' }}>
                                        <Text style={styles.linkText} numberOfLines={2} adjustsFontSizeToFit>
                                            ليس لديك حساب؟ إنشاء حساب جديد
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>

            {/* Custom Exit Confirmation Modal */}
            <Modal
                visible={showExitModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowExitModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowExitModal(false)}>
                    <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center'}}>
                        <TouchableWithoutFeedback>
                            <View style={{
                                width: '85%',
                                backgroundColor: '#FFF',
                                borderRadius: 25,
                                padding: 25,
                                alignItems: 'center',
                                elevation: 20,
                                shadowColor: '#000',
                                shadowOffset: {width: 0, height: 10},
                                shadowOpacity: 0.3,
                                shadowRadius: 20
                            }}>
                                <View style={{
                                    width: 60, height: 60, borderRadius: 30, 
                                    backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center',
                                    marginBottom: 15
                                }}>
                                    <Text style={{fontSize: 30}}>👋</Text>
                                </View>
                                
                                <Text style={{
                                    fontSize: 22, fontWeight: 'bold', color: '#333', 
                                    marginBottom: 10, textAlign: 'center',
                                    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium'
                                }}>
                                    هل تود المغادرة؟
                                </Text>
                                
                                <Text style={{
                                    fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 25, lineHeight: 22
                                }}>
                                    سنشتاق إليك! هل أنت متأكد من رغبتك في إغلاق التطبيق؟
                                </Text>

                                <View style={{flexDirection: 'row', gap: 15, width: '100%'}}>
                                    <TouchableOpacity 
                                        style={{
                                            flex: 1, paddingVertical: 12, borderRadius: 15, 
                                            backgroundColor: '#F5F5F5', alignItems: 'center'
                                        }}
                                        onPress={() => setShowExitModal(false)}
                                    >
                                        <Text style={{fontSize: 16, fontWeight: 'bold', color: '#666'}}>   إلغاء   </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={{
                                            flex: 1, paddingVertical: 12, borderRadius: 15, 
                                            backgroundColor: '#FF6B6B', alignItems: 'center'
                                        }}
                                        onPress={() => BackHandler.exitApp()}
                                    >
                                        <Text style={{fontSize: 16, fontWeight: 'bold', color: '#FFF'}}>   نعم، خروج   </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
    headerContainer: { alignItems: 'center', marginBottom: 30 },
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
        textAlign: 'center',
        width: '100%',
        paddingHorizontal: 20,
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
    forgotPass: { alignItems: 'flex-start', marginBottom: 20 },
    forgotPassText: { color: '#667eea', fontWeight: '600', fontSize: 14 },
    loginButtonContainer: {
        marginTop: 10,
        borderRadius: 15,
        elevation: 2,
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    loginButton: {
        height: 60,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 25,
    },
    loginButtonText: { 
        color: '#fff', 
        fontSize: 18, 
        fontWeight: 'bold',
        textAlign: 'center',
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
    forgotPass: { marginBottom: 20, width: '100%' },
    forgotPassText: { 
        color: '#667eea', 
        fontWeight: '600', 
        fontSize: 14,
    },
    footerLink: { alignItems: 'center', marginTop: 20 },
    linkText: { 
        color: '#667eea', 
        fontWeight: 'bold', 
        fontSize: 15,
        textAlign: 'center',
    },
});

export default LoginScreen;
