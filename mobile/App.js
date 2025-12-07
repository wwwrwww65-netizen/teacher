import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LessonsScreen from './src/screens/LessonsScreen';
import LessonDetailScreen from './src/screens/LessonDetailScreen';
import ClassroomScreen from './src/screens/ClassroomScreen';
import QuizScreen from './src/screens/QuizScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const Stack = createNativeStackNavigator();

function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="Login"
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: '#fff' }
                    }}
                >
                    {/* Auth */}
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />

                    {/* Main App */}
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen name="Dashboard" component={DashboardScreen} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />

                    {/* Features */}
                    <Stack.Screen name="Lessons" component={LessonsScreen} />
                    <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
                    <Stack.Screen name="Classroom" component={ClassroomScreen} />
                    <Stack.Screen name="Quiz" component={QuizScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}

export default App;
