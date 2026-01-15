import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';

// RevenueCat API Keys (سنحتاج لإنشاء حساب مجاني على revenuecat.com)
const REVENUECAT_API_KEY = {
    android: 'YOUR_GOOGLE_API_KEY', // ستحصل عليه من لوحة تحكم RevenueCat
    ios: 'YOUR_APPLE_API_KEY'
};

class SubscriptionService {
    constructor() {
        this.isSubscribed = false;
        this.onSubscriptionChange = null;
    }

    async init() {
        try {
            // تهيئة RevenueCat - معطل مؤقتاً حتى يتم إضافة API Key
            // await Purchases.configure({
            //     apiKey: REVENUECAT_API_KEY.android,
            //     appUserID: await this.getUserId()
            // });

            // التحقق من حالة الاشتراك
            await this.checkSubscriptionStatus();

            console.log('✅ [Subscription] Service initialized (RevenueCat disabled)');
        } catch (err) {
            console.warn('❌ [Subscription] Init error:', err);
        }
    }

    async getUserId() {
        try {
            let userId = await AsyncStorage.getItem('user_id');
            if (!userId) {
                userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                await AsyncStorage.setItem('user_id', userId);
            }
            return userId;
        } catch (error) {
            return 'unknown_user';
        }
    }

    async checkSubscriptionStatus() {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            
            // التحقق من وجود اشتراك نشط
            const isActive = customerInfo.entitlements.active['premium'] !== undefined;
            
            await this.setSubscriptionStatus(isActive);
            return isActive;

        } catch (err) {
            console.warn('⚠️ [Subscription] Check status error:', err);
            return this.isSubscribed;
        }
    }

    async setSubscriptionStatus(status) {
        this.isSubscribed = status;
        await AsyncStorage.setItem('is_premium_user', status ? 'true' : 'false');
        console.log(`💎 [Subscription] Status: ${status ? 'PREMIUM' : 'FREE'}`);
        
        if (this.onSubscriptionChange) {
            this.onSubscriptionChange(status);
        }
    }

    async getSubscriptions() {
        try {
            const offerings = await Purchases.getOfferings();
            
            if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
                return offerings.current.availablePackages;
            }
            
            return [];
        } catch (err) {
            console.warn('❌ [Subscription] Get subscriptions error:', err);
            return [];
        }
    }

    async subscribe() {
        try {
            const packages = await this.getSubscriptions();
            
            if (packages.length > 0) {
                // شراء أول باقة متاحة (عادة الشهرية)
                const { customerInfo } = await Purchases.purchasePackage(packages[0]);
                
                // التحقق من نجاح الشراء
                if (customerInfo.entitlements.active['premium'] !== undefined) {
                    await this.setSubscriptionStatus(true);
                    return true;
                }
            } else {
                throw new Error('No subscription packages available');
            }
        } catch (err) {
            if (err.userCancelled) {
                console.log('ℹ️ [Subscription] User cancelled');
            } else {
                console.warn('❌ [Subscription] Purchase error:', err);
            }
            throw err;
        }
    }

    async restorePurchases() {
        try {
            const customerInfo = await Purchases.restorePurchases();
            const isActive = customerInfo.entitlements.active['premium'] !== undefined;
            await this.setSubscriptionStatus(isActive);
            return isActive;
        } catch (err) {
            console.warn('❌ [Subscription] Restore error:', err);
            throw err;
        }
    }

    shutdown() {
        // RevenueCat لا يحتاج cleanup يدوي
        console.log('🔌 [Subscription] Service shutdown');
    }
}

export const subscriptionService = new SubscriptionService();
