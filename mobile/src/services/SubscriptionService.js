import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

/**
 * Google Play Billing Subscription Service
 * نظام الاشتراك المباشر مع Google Play
 */
class GooglePlaySubscriptionService {
    constructor() {
        this.isSubscribed = false;
        this.subscriptionType = null; // 'monthly', 'yearly', null
        this.expiryDate = null;
        this.onSubscriptionChange = null;
        
        // معرفات المنتجات في Google Play Console
        this.PRODUCT_IDS = {
            monthly: 'premium_monthly',
            yearly: 'premium_yearly',
        };
    }

    /**
     * تهيئة الخدمة
     */
    async init() {
        try {
            // تحميل حالة الاشتراك من التخزين المحلي
            await this.loadSubscriptionStatus();
            console.log('✅ [Subscription] Service initialized');
            console.log(`💎 [Subscription] Status: ${this.isSubscribed ? 'PREMIUM' : 'FREE'}`);
        } catch (error) {
            console.error('❌ [Subscription] Init error:', error);
        }
    }

    /**
     * تحميل حالة الاشتراك من AsyncStorage
     */
    async loadSubscriptionStatus() {
        try {
            const isPremium = await AsyncStorage.getItem('is_premium_user');
            const subType = await AsyncStorage.getItem('subscription_type');
            const expiry = await AsyncStorage.getItem('subscription_expiry');

            this.isSubscribed = isPremium === 'true';
            this.subscriptionType = subType;
            this.expiryDate = expiry ? new Date(expiry) : null;

            // التحقق من انتهاء الصلاحية
            if (this.expiryDate && new Date() > this.expiryDate) {
                await this.setSubscriptionStatus(false, null, null);
            }
        } catch (error) {
            console.error('Error loading subscription status:', error);
        }
    }

    /**
     * التحقق من حالة الاشتراك
     */
    async checkSubscriptionStatus() {
        await this.loadSubscriptionStatus();
        return this.isSubscribed;
    }

    /**
     * تعيين حالة الاشتراك
     */
    async setSubscriptionStatus(status, type = null, expiryDate = null) {
        this.isSubscribed = status;
        this.subscriptionType = type;
        this.expiryDate = expiryDate;

        await AsyncStorage.setItem('is_premium_user', status ? 'true' : 'false');
        await AsyncStorage.setItem('subscription_type', type || '');
        await AsyncStorage.setItem('subscription_expiry', expiryDate ? expiryDate.toISOString() : '');

        console.log(`💎 [Subscription] Status updated: ${status ? 'PREMIUM' : 'FREE'}`);
        if (type) console.log(`📦 [Subscription] Type: ${type}`);
        if (expiryDate) console.log(`📅 [Subscription] Expires: ${expiryDate.toLocaleDateString()}`);

        if (this.onSubscriptionChange) {
            this.onSubscriptionChange(status);
        }
    }

    /**
     * الحصول على خطط الاشتراك المتاحة
     */
    getAvailablePlans() {
        return [
            {
                id: 'monthly',
                productId: this.PRODUCT_IDS.monthly,
                title: 'الاشتراك الشهري',
                description: 'وصول كامل لجميع المميزات',
                price: '9.99 ر.س',
                priceValue: 9.99,
                currency: 'SAR',
                duration: 'شهر واحد',
                features: [
                    '✅ دروس غير محدودة',
                    '✅ جميع المواد الدراسية',
                    '✅ تقارير مفصلة',
                    '✅ دعم فني مميز',
                ],
                popular: false,
            },
            {
                id: 'yearly',
                productId: this.PRODUCT_IDS.yearly,
                title: 'الاشتراك السنوي',
                description: 'وفر 40% - أفضل قيمة',
                price: '69.99 ر.س',
                priceValue: 69.99,
                currency: 'SAR',
                duration: 'سنة كاملة',
                originalPrice: '119.88 ر.س',
                discount: '40%',
                features: [
                    '✅ جميع مميزات الشهري',
                    '✅ وفر 50 ر.س سنوياً',
                    '✅ محتوى حصري',
                    '✅ أولوية في الدعم',
                ],
                popular: true,
            },
        ];
    }

    /**
     * شراء اشتراك
     * في الإنتاج، سيتم استدعاء Google Play Billing API
     */
    async purchaseSubscription(planId) {
        try {
            console.log(`🛒 [Subscription] Purchasing: ${planId}`);

            // TODO: في الإنتاج، استخدم react-native-iap
            // const purchase = await RNIap.requestSubscription(this.PRODUCT_IDS[planId]);

            // للتطوير: محاكاة الشراء الناجح
            const plan = this.getAvailablePlans().find(p => p.id === planId);
            if (!plan) {
                throw new Error('Invalid plan');
            }

            // حساب تاريخ الانتهاء
            const expiryDate = new Date();
            if (planId === 'monthly') {
                expiryDate.setMonth(expiryDate.getMonth() + 1);
            } else if (planId === 'yearly') {
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            }

            await this.setSubscriptionStatus(true, planId, expiryDate);

            Alert.alert(
                '🎉 تم الاشتراك بنجاح!',
                `تم تفعيل ${plan.title} بنجاح. استمتع بجميع المميزات!`,
                [{ text: 'رائع!' }]
            );

            return {
                success: true,
                planId,
                expiryDate,
            };
        } catch (error) {
            console.error('❌ [Subscription] Purchase error:', error);
            
            if (error.code === 'E_USER_CANCELLED') {
                console.log('ℹ️ [Subscription] User cancelled');
                return { success: false, cancelled: true };
            }

            Alert.alert(
                'خطأ في الاشتراك',
                'حدث خطأ أثناء عملية الاشتراك. يرجى المحاولة مرة أخرى.',
                [{ text: 'حسناً' }]
            );

            return { success: false, error };
        }
    }

    /**
     * إلغاء الاشتراك
     */
    async cancelSubscription() {
        try {
            console.log('🚫 [Subscription] Cancelling subscription');

            // TODO: في الإنتاج، توجيه المستخدم لإدارة الاشتراكات في Google Play
            // Linking.openURL('https://play.google.com/store/account/subscriptions');

            Alert.alert(
                'إلغاء الاشتراك',
                'لإلغاء اشتراكك، يرجى:\n\n1. فتح متجر Google Play\n2. الذهاب إلى الاشتراكات\n3. اختيار "المعلمة نورا"\n4. الضغط على "إلغاء الاشتراك"\n\nملاحظة: سيبقى الاشتراك نشطاً حتى نهاية الفترة المدفوعة.',
                [
                    { text: 'إلغاء', style: 'cancel' },
                    { 
                        text: 'فتح Google Play', 
                        onPress: () => {
                            // Linking.openURL('https://play.google.com/store/account/subscriptions');
                            console.log('Opening Google Play subscriptions...');
                        }
                    },
                ]
            );

            return true;
        } catch (error) {
            console.error('❌ [Subscription] Cancel error:', error);
            return false;
        }
    }

    /**
     * استعادة المشتريات
     */
    async restorePurchases() {
        try {
            console.log('🔄 [Subscription] Restoring purchases');

            // TODO: في الإنتاج، استخدم react-native-iap
            // const purchases = await RNIap.getAvailablePurchases();

            Alert.alert(
                'استعادة المشتريات',
                'تم التحقق من مشترياتك السابقة.',
                [{ text: 'حسناً' }]
            );

            return this.isSubscribed;
        } catch (error) {
            console.error('❌ [Subscription] Restore error:', error);
            Alert.alert(
                'خطأ',
                'فشل استعادة المشتريات. يرجى المحاولة مرة أخرى.',
                [{ text: 'حسناً' }]
            );
            return false;
        }
    }

    /**
     * الحصول على معلومات الاشتراك الحالي
     */
    getSubscriptionInfo() {
        if (!this.isSubscribed) {
            return null;
        }

        const plan = this.getAvailablePlans().find(p => p.id === this.subscriptionType);
        
        return {
            isActive: this.isSubscribed,
            type: this.subscriptionType,
            planTitle: plan?.title || 'اشتراك مميز',
            expiryDate: this.expiryDate,
            daysRemaining: this.expiryDate 
                ? Math.ceil((this.expiryDate - new Date()) / (1000 * 60 * 60 * 24))
                : 0,
        };
    }

    /**
     * التحقق من صلاحية الاشتراك
     */
    isSubscriptionValid() {
        if (!this.isSubscribed) return false;
        if (!this.expiryDate) return true; // اشتراك دائم (للتطوير)
        return new Date() < this.expiryDate;
    }

    shutdown() {
        console.log('🔌 [Subscription] Service shutdown');
    }
}

export const subscriptionService = new GooglePlaySubscriptionService();
