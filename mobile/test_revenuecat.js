const Purchases = require('react-native-purchases').default;

const REVENUECAT_API_KEY = 'sk_ogkpVdkFhZOxVDSKBtKnajgDOjVMJ';

async function testRevenueCat() {
    try {
        console.log('🔍 Testing RevenueCat connection...');
        console.log('📝 API Key:', REVENUECAT_API_KEY.substring(0, 10) + '...');
        
        // محاولة التهيئة
        await Purchases.configure({
            apiKey: REVENUECAT_API_KEY,
            appUserID: 'test_user_' + Date.now()
        });
        
        console.log('✅ RevenueCat initialized successfully!');
        
        // محاولة جلب معلومات العميل
        const customerInfo = await Purchases.getCustomerInfo();
        console.log('✅ Customer Info retrieved successfully!');
        console.log('📊 Customer ID:', customerInfo.originalAppUserId);
        console.log('📊 Active Entitlements:', Object.keys(customerInfo.entitlements.active));
        
        // محاولة جلب العروض المتاحة
        const offerings = await Purchases.getOfferings();
        console.log('✅ Offerings retrieved successfully!');
        console.log('📦 Current Offering:', offerings.current?.identifier || 'None');
        console.log('📦 Available Packages:', offerings.current?.availablePackages.length || 0);
        
        console.log('\n🎉 All tests passed! RevenueCat is working correctly.');
        
    } catch (error) {
        console.error('❌ Error testing RevenueCat:');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Full Error:', error);
    }
}

testRevenueCat();
