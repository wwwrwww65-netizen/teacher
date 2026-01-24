import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

class FCMService {
    async requestUserPermission() {
        try {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('Authorization status:', authStatus);
                await this.getFCMToken();
            }

            if (Platform.OS === 'android' && Platform.Version >= 33) {
                await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
            }
        } catch (error) {
            console.error('Permission request failed', error);
        }
    }

    async getFCMToken() {
        try {
            const token = await messaging().getToken();
            console.log('FCM Token:', token);
            return token;
        } catch (error) {
            console.log('FCM Token Error:', error);
            return null;
        }
    }

    listenForNotifications() {
        // Foreground state messages
        const unsubscribe = messaging().onMessage(async remoteMessage => {
            console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
        });

        // Background/Quit state messages interaction
        messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('Notification caused app to open from background state:', remoteMessage.notification);
        });

        messaging().getInitialNotification().then(remoteMessage => {
            if (remoteMessage) {
                console.log('Notification caused app to open from quit state:', remoteMessage.notification);
            }
        });

        return unsubscribe;
    }

    // Static method for background handling (used in index.js)
    static async backgroundHandler(remoteMessage) {
        console.log('Message handled in the background!', remoteMessage);
    }
}

export const fcmService = new FCMService();
