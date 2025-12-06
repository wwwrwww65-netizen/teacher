import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// إعدادات عرض الإشعارات (حتى والتطبيق مفتوح)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

class NotificationService {
    constructor() {
        this.token = null;
    }

    // 1. التسجيل والحصول على التوكن
    async registerForPushNotificationsAsync() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }

            // الحصول على التوكن (Expo Push Token)
            // ملاحظة: لاستخدام FCM مباشرة تحتاج لخطوات إضافية، لكن Expo Token أسهل ويعمل مع Firebase
            token = (await Notifications.getExpoPushTokenAsync()).data;
            console.log('Expo Push Token:', token);

            this.token = token;
            await AsyncStorage.setItem('pushToken', token);
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        return token;
    }

    // 2. جدولة إشعار محلي (تذكير يومي)
    async scheduleDailyReminder(hour = 16, minute = 0) {
        await Notifications.cancelAllScheduledNotificationsAsync();

        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title: "وقت التعلم! 📚",
                body: "المعلمة تيني بانتظارك.. هل أنت جاهز؟ 😊",
                sound: true,
            },
            trigger: {
                hour: hour,
                minute: minute,
                repeats: true,
            },
        });

        return identifier;
    }

    // 3. إرسال إشعار فوري (للتجربة)
    async sendLocalNotification(title, body) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
            },
            trigger: null, // فوري
        });
    }
}

export const notificationService = new NotificationService();
