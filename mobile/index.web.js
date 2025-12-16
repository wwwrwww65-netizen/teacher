import React, { useState } from 'react';
import { AppRegistry, View, Text } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ClassroomScreen from './src/screens/ClassroomScreen';
import { name as appName } from './app.json';

const WebApp = () => {
    const [currentScreen, setCurrentScreen] = useState('Login');

    const navigation = {
        navigate: (screen) => {
            console.log('Navigating to:', screen);
            setCurrentScreen(screen);
        },
        replace: (screen) => {
            console.log('Replacing with:', screen);
            setCurrentScreen(screen);
        },
        goBack: () => {
            console.log('goBack');
            if (currentScreen === 'Classroom') setCurrentScreen('Home');
        },
    };

    return (
        <View style={{ flex: 1, height: '100vh', backgroundColor: '#f0f0f0' }}>
            {currentScreen === 'Login' && <LoginScreen navigation={navigation} />}
            {currentScreen === 'Home' && <HomeScreen navigation={navigation} />}
            {currentScreen === 'Classroom' && <ClassroomScreen navigation={navigation} />}
            {!['Login', 'Home', 'Classroom'].includes(currentScreen) && (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>Screen {currentScreen} not implemented in simulator</Text>
                </View>
            )}
        </View>
    );
};

// Inject fonts
const style = document.createElement('style');
style.textContent = `
  @font-face {
    font-family: 'MaterialCommunityIcons';
    src: url('https://raw.githubusercontent.com/oblador/react-native-vector-icons/master/Fonts/MaterialCommunityIcons.ttf') format('truetype');
  }
  body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
`;
document.head.appendChild(style);

AppRegistry.registerComponent(appName, () => WebApp);
AppRegistry.runApplication(appName, {
    initialProps: {},
    rootTag: document.getElementById('root'),
});
