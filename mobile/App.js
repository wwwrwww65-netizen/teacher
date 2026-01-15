import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import StudentSetupScreen from './src/screens/StudentSetupScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LessonsScreen from './src/screens/LessonsScreen';
import LessonDetailScreen from './src/screens/LessonDetailScreen';
import ClassroomScreen from './src/screens/ClassroomScreen';
import MiniGameScreen from './src/screens/MiniGameScreen';
import QuizScreen from './src/screens/QuizScreen';
import CurriculumScreen from './src/screens/CurriculumScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const Stack = createNativeStackNavigator();

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
                        <Text style={styles.errorInfo}>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </Text>
                    </ScrollView>
                </View>
            );
        }

        return this.props.children;
    }
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
    errorInfo: {
        fontSize: 12,
        color: '#555',
        fontFamily: 'monospace',
        backgroundColor: '#FFCDD2',
        padding: 10,
        borderRadius: 5,
    },
});

import { subscriptionService } from './src/services/SubscriptionService';

function App() {
    React.useEffect(() => {
        const initServices = async () => {
            await subscriptionService.init();
        };
        initServices();

        return () => {
            subscriptionService.shutdown();
        };
    }, []);

    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <NavigationContainer>
                    <Stack.Navigator
                        initialRouteName="StudentSetup"
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: '#fff' }
                        }}
                    >
                        <Stack.Screen name="StudentSetup" component={StudentSetupScreen} />

                        {/* Auth */}
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />

                        {/* Main App */}
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="Dashboard" component={DashboardScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />

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

export default App;
