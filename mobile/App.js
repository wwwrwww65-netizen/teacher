import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';
import { notificationService } from './src/services/NotificationService';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import LessonsScreen from './src/screens/LessonsScreen';
import LessonDetailScreen from './src/screens/LessonDetailScreen';
import ClassroomScreen from './src/screens/ClassroomScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AvatarDemoScreen from './src/screens/AvatarDemoScreen';

const Stack = createNativeStackNavigator();

export default function App() {

    useEffect(() => {
        // 1. طلب إذن الإشعارات
        notificationService.registerForPushNotificationsAsync();

        // 2. جدولة تذكير يومي الساعة 4 عصراً
        notificationService.scheduleDailyReminder(16, 0);
    }, []);

    return (
        <I18nextProvider i18n={i18n}>
            <SafeAreaProvider>
                <NavigationContainer>
                    <Stack.Navigator
                        initialRouteName="Login"
                        screenOptions={{
                            headerShown: false,
                            animation: 'slide_from_right',
                        }}
                    >
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="Lessons" component={LessonsScreen} />
                        <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
                        <Stack.Screen name="Classroom" component={ClassroomScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="AvatarDemo" component={AvatarDemoScreen} />
                    </Stack.Navigator>
                </NavigationContainer>
            </SafeAreaProvider>
        </I18nextProvider>
    );
}
