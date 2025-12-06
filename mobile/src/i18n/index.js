import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ar from './locales/ar.json';
import en from './locales/en.json';

const LANGUAGE_KEY = '@app_language';

// Get device language
const getDeviceLanguage = () => {
    const locale = Localization.locale;
    return locale.startsWith('ar') ? 'ar' : 'en';
};

// Get saved language or device language
const getInitialLanguage = async () => {
    try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        return savedLanguage || getDeviceLanguage();
    } catch {
        return getDeviceLanguage();
    }
};

// Initialize i18n
const initI18n = async () => {
    const initialLanguage = await getInitialLanguage();

    i18n
        .use(initReactI18next)
        .init({
            resources: {
                ar: { translation: ar },
                en: { translation: en },
            },
            lng: initialLanguage,
            fallbackLng: 'ar',
            interpolation: {
                escapeValue: false,
            },
            react: {
                useSuspense: false,
            },
        });
};

// Change language
export const changeLanguage = async (language) => {
    try {
        await AsyncStorage.setItem(LANGUAGE_KEY, language);
        await i18n.changeLanguage(language);
    } catch (error) {
        console.error('Error changing language:', error);
    }
};

// Get current language
export const getCurrentLanguage = () => i18n.language;

// Check if RTL
export const isRTL = () => i18n.language === 'ar';

initI18n();

export default i18n;
