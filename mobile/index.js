// CRITICAL: Import react-native core first to ensure StyleSheet is available
// Force Reload
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

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
