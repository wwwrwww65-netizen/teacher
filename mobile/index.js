// CRITICAL: Import react-native core first to ensure StyleSheet is available
// Force Reload
import React from 'react';
import { StyleSheet, LogBox } from 'react-native';

LogBox.ignoreLogs([
    "`new NativeEventEmitter()`", // Suppress noisy warning from legacy native modules
]);

// CRITICAL: react-native-reanimated MUST be imported FIRST (after core RN checks)
// DO NOT import anything before this line
import 'react-native-reanimated';

// gesture-handler must come early
import 'react-native-gesture-handler';

import { enableScreens } from 'react-native-screens';
enableScreens();

import { AppRegistry, Text, TextInput } from 'react-native';
import messaging from '@react-native-firebase/messaging';

// 🏗️ SET GLOBAL FONT
const setGlobalFont = () => {
    const defaultFontFamily = 'Almarai-Regular'; 
    
    const oldTextRender = Text.render;
    Text.render = function(...args) {
        const origin = oldTextRender.call(this, ...args);
        return React.cloneElement(origin, {
            style: [{fontFamily: defaultFontFamily}, origin.props.style],
        });
    };
    
    // Also for TextInput
    const oldTextInputRender = TextInput.render;
    TextInput.render = function(...args) {
         const origin = oldTextInputRender.call(this, ...args);
         return React.cloneElement(origin, {
             style: [{fontFamily: defaultFontFamily}, origin.props.style],
         });
    };
};

// Try to apply it (safe wrap)
try { setGlobalFont(); } catch(e) { console.log('Font override failed', e); }

import App from './App';
import { name as appName } from './app.json';
import { fcmService } from './src/services/FCMService';

// Register background handler
messaging().setBackgroundMessageHandler(fcmService.constructor.backgroundHandler);

AppRegistry.registerComponent(appName, () => App);
