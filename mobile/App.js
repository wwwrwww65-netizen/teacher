import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

// Import Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import EmailVerificationScreen from './src/screens/EmailVerificationScreen';
import HomeScreen from './src/screens/HomeScreen';
import StudentSetupScreen from './src/screens/StudentSetupScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import LessonsScreen from './src/screens/LessonsScreen';
import LessonDetailScreen from './src/screens/LessonDetailScreen';
import ClassroomScreen from './src/screens/ClassroomScreen';
import MiniGameScreen from './src/screens/MiniGameScreen';
import QuizScreen from './src/screens/QuizScreen';
import CurriculumScreen from './src/screens/CurriculumScreen';
import DashboardScreen from './src/screens/DashboardScreen';

import { subscriptionService } from './src/services/SubscriptionService';
import geminiLiveService from './src/services/GeminiLiveService';
import { authService } from './src/services/AuthService';
import { firebaseService } from './src/services/FirebaseService';
import GlobalAudioService from './src/services/GlobalAudioService';

const Stack = createNativeStackNavigator();

// Error Boundary
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.log('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.errorContainer}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.errorTitle}>Oops! Something went wrong.</Text>
                        <Text style={styles.errorText}>
                            {this.state.error && this.state.error.toString()}
                        </Text>
                    </ScrollView>
                </View>
            );
        }

        return this.props.children;
    }
}

// Auth Loading / Router Component
// Auth Loading / Router Component
const AuthCheckScreen = ({ navigation }) => {
    useEffect(() => {
        const checkAuth = async () => {
            // Short delay to show the beautiful loader smoothly
            await new Promise(resolve => setTimeout(resolve, 800));

            const user = authService.getCurrentUser();
            if (!user) {
                navigation.replace('Login');
                return;
            }

            // Optional: Check email verification
            // if (!user.emailVerified) { navigation.replace('EmailVerification'); return; }

            // Check if student profile exists
            const studentData = await firebaseService.getStudentData();
            if (studentData && studentData.guardianName) {
                navigation.replace('Home');
            } else {
                navigation.replace('StudentSetup');
            }
        };
        checkAuth();
    }, []);

    return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <LinearGradient
                colors={['#FFF8F0', '#E6CBA8']} // Matching Splash Theme
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            
            {/* Logo Circle Container */}
            <View style={{
                width: 140, height: 140, 
                backgroundColor: 'rgba(255,255,255,0.6)', 
                borderRadius: 70, 
                justifyContent: 'center', alignItems: 'center',
                marginBottom: 40,
                elevation: 15, 
                shadowColor: '#5D4037', 
                shadowOffset: {width: 0, height: 10},
                shadowOpacity: 0.25, 
                shadowRadius: 15,
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.8)'
            }}>
                <Image 
                    source={require('./src/assets/splash_logo.png')} 
                    style={{width: '65%', height: '65%'}}
                    resizeMode="contain"
                />
            </View>

            <ActivityIndicator size={40} color="#5D4037" style={{ marginBottom: 15 }} />
            
            <Text style={{
                color: '#5D4037', 
                fontSize: 18, 
                fontWeight: 'bold', 
                fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                letterSpacing: 0.5
            }}>
                جاري التحقق من الهوية...
            </Text>
            
            <Text style={{
                marginTop: 8,
                color: '#8D6E63', 
                fontSize: 12, 
                fontWeight: '500', 
                fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                opacity: 0.8
            }}>
                HASH JEEEY SECURITY
            </Text>
        </View>
    );
};

function App() {
    useEffect(() => {
        const initServices = async () => {
            await subscriptionService.init();
            geminiLiveService.initializeWarmUpConnection();
            
            // 🎵 Start app background music
            GlobalAudioService.playAppBackgroundMusic();
        };
        initServices();

        return () => {
            subscriptionService.shutdown();
            GlobalAudioService.cleanup();
        };
    }, []);

    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <NavigationContainer onStateChange={() => {
                    // 🎵 Play click sound on navigation
                    GlobalAudioService.playClickSound();
                }}>
                    <Stack.Navigator
                        initialRouteName="Splash"
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: '#fff' },
                            animation: 'fade', // ☁️ Seamless Dissolve Transition
                            animationDuration: 600, // Slower for elegance
                        }}
                    >
                        {/* Entry Flow */}
                        <Stack.Screen name="Splash" component={SplashScreen} />
                        <Stack.Screen name="AuthCheck" component={AuthCheckScreen} />
                        
                        {/* Auth Stack */}
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
                        <Stack.Screen name="StudentSetup" component={StudentSetupScreen} />

                        {/* Main App */}
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="Dashboard" component={DashboardScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="Subscription" component={SubscriptionScreen} />

                        {/* Features */}
                        <Stack.Screen name="Curriculum" component={CurriculumScreen} />
                        <Stack.Screen name="Lessons" component={LessonsScreen} />
                        <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
                        <Stack.Screen name="Classroom" component={ClassroomScreen} />
                        <Stack.Screen name="MiniGame" component={MiniGameScreen} />
                        <Stack.Screen name="Quiz" component={QuizScreen} />
                    </Stack.Navigator>
                </NavigationContainer>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        backgroundColor: '#FFEBEE',
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#D32F2F',
        marginBottom: 10,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#B71C1C',
        marginBottom: 20,
        lineHeight: 22,
    },
});

export default App;
