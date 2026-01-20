import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Animated,
    Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { subscriptionService } from '../services/SubscriptionService';

const { width } = Dimensions.get('window');

const SubscriptionScreen = ({ navigation }) => {
    const [selectedPlan, setSelectedPlan] = useState('yearly');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscriptionInfo, setSubscriptionInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        loadSubscriptionStatus();
        startAnimations();
    }, []);

    const startAnimations = () => {
        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for popular badge
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const loadSubscriptionStatus = async () => {
        const status = await subscriptionService.checkSubscriptionStatus();
        setIsSubscribed(status);
        
        if (status) {
            const info = subscriptionService.getSubscriptionInfo();
            setSubscriptionInfo(info);
        }
    };

    const handlePurchase = async () => {
        if (loading) return;

        setLoading(true);
        try {
            const result = await subscriptionService.purchaseSubscription(selectedPlan);
            
            if (result.success) {
                await loadSubscriptionStatus();
                // Navigate back after successful purchase
                setTimeout(() => {
                    navigation.goBack();
                }, 2000);
            }
        } catch (error) {
            console.error('Purchase error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        Alert.alert(
            'إلغاء الاشتراك',
            'هل أنت متأكد من رغبتك في إلغاء الاشتراك؟',
            [
                { text: 'لا', style: 'cancel' },
                {
                    text: 'نعم، إلغاء',
                    style: 'destructive',
                    onPress: async () => {
                        await subscriptionService.cancelSubscription();
                    },
                },
            ]
        );
    };

    const handleRestorePurchases = async () => {
        setLoading(true);
        try {
            await subscriptionService.restorePurchases();
            await loadSubscriptionStatus();
        } catch (error) {
            console.error('Restore error:', error);
        } finally {
            setLoading(false);
        }
    };

    const plans = subscriptionService.getAvailablePlans();

    const renderPlanCard = (plan) => {
        const isSelected = selectedPlan === plan.id;
        
        return (
            <Animated.View
                key={plan.id}
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                }}
            >
                <TouchableOpacity
                    style={[
                        styles.planCard,
                        isSelected && styles.planCardSelected,
                    ]}
                    onPress={() => setSelectedPlan(plan.id)}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={
                            isSelected
                                ? ['#667eea', '#764ba2']
                                : ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']
                        }
                        style={styles.planGradient}
                    >
                        {/* Popular Badge */}
                        {plan.popular && (
                            <Animated.View
                                style={[
                                    styles.popularBadge,
                                    { transform: [{ scale: pulseAnim }] },
                                ]}
                            >
                                <LinearGradient
                                    colors={['#FFD700', '#FFA500']}
                                    style={styles.popularGradient}
                                >
                                    <Text style={styles.popularText}>⭐ الأكثر شعبية</Text>
                                </LinearGradient>
                            </Animated.View>
                        )}

                        {/* Plan Header */}
                        <View style={styles.planHeader}>
                            <View style={styles.planTitleContainer}>
                                <Text style={styles.planTitle}>{plan.title}</Text>
                                <Text style={styles.planDescription}>{plan.description}</Text>
                            </View>
                            
                            {/* Selection Indicator */}
                            <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                                {isSelected && <View style={styles.radioInner} />}
                            </View>
                        </View>

                        {/* Price */}
                        <View style={styles.priceContainer}>
                            <Text style={styles.price}>{plan.price}</Text>
                            <Text style={styles.duration}>/ {plan.duration}</Text>
                        </View>

                        {/* Original Price & Discount */}
                        {plan.originalPrice && (
                            <View style={styles.discountContainer}>
                                <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>وفر {plan.discount}</Text>
                                </View>
                            </View>
                        )}

                        {/* Features */}
                        <View style={styles.featuresContainer}>
                            {plan.features.map((feature, index) => (
                                <Text key={index} style={styles.feature}>
                                    {feature}
                                </Text>
                            ))}
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Background */}
            <LinearGradient
                colors={['#1a1a2e', '#16213e', '#0f3460', '#533483']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                        style={styles.headerButton}
                    >
                        <Text style={styles.backIcon}>←</Text>
                    </LinearGradient>
                </TouchableOpacity>
                
                <Text style={styles.headerTitle}>👑 الاشتراك المميز</Text>
                
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Current Subscription Status */}
                {isSubscribed && subscriptionInfo && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <View style={styles.currentSubCard}>
                            <LinearGradient
                                colors={['#4ECDC4', '#44A08D']}
                                style={styles.currentSubGradient}
                            >
                                <Text style={styles.currentSubTitle}>✅ اشتراكك النشط</Text>
                                <Text style={styles.currentSubPlan}>{subscriptionInfo.planTitle}</Text>
                                <Text style={styles.currentSubExpiry}>
                                    ينتهي في: {subscriptionInfo.expiryDate?.toLocaleDateString('ar-SA')}
                                </Text>
                                <Text style={styles.currentSubDays}>
                                    ({subscriptionInfo.daysRemaining} يوم متبقي)
                                </Text>

                                <TouchableOpacity
                                    style={styles.manageButton}
                                    onPress={handleCancelSubscription}
                                >
                                    <Text style={styles.manageButtonText}>إدارة الاشتراك</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </View>
                    </Animated.View>
                )}

                {/* Hero Section */}
                {!isSubscribed && (
                    <Animated.View 
                        style={[
                            styles.heroSection,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                        ]}
                    >
                        <Text style={styles.heroTitle}>🚀 ارتقِ بتجربة التعلم</Text>
                        <Text style={styles.heroSubtitle}>
                            احصل على وصول كامل لجميع المميزات والمحتوى الحصري
                        </Text>
                    </Animated.View>
                )}

                {/* Plans */}
                {!isSubscribed && (
                    <View style={styles.plansContainer}>
                        {plans.map(renderPlanCard)}
                    </View>
                )}

                {/* Subscribe Button */}
                {!isSubscribed && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <TouchableOpacity
                            style={styles.subscribeButton}
                            onPress={handlePurchase}
                            disabled={loading}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#FF6B6B', '#EE5A6F']}
                                style={styles.subscribeGradient}
                            >
                                <Text style={styles.subscribeText}>
                                    {loading ? '⏳ جاري المعالجة...' : '🎉 اشترك الآن'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Restore Purchases */}
                <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={handleRestorePurchases}
                    disabled={loading}
                >
                    <Text style={styles.restoreText}>
                        استعادة المشتريات السابقة
                    </Text>
                </TouchableOpacity>

                {/* Benefits Section */}
                <View style={styles.benefitsSection}>
                    <Text style={styles.benefitsTitle}>✨ لماذا الاشتراك المميز؟</Text>
                    
                    <View style={styles.benefitCard}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
                            style={styles.benefitGradient}
                        >
                            <Text style={styles.benefitIcon}>📚</Text>
                            <View style={styles.benefitInfo}>
                                <Text style={styles.benefitTitle}>محتوى غير محدود</Text>
                                <Text style={styles.benefitDesc}>
                                    الوصول لجميع الدروس والمواد الدراسية
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>

                    <View style={styles.benefitCard}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
                            style={styles.benefitGradient}
                        >
                            <Text style={styles.benefitIcon}>🎯</Text>
                            <View style={styles.benefitInfo}>
                                <Text style={styles.benefitTitle}>تقارير مفصلة</Text>
                                <Text style={styles.benefitDesc}>
                                    تتبع تقدم طفلك بشكل دقيق ومفصل
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>

                    <View style={styles.benefitCard}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
                            style={styles.benefitGradient}
                        >
                            <Text style={styles.benefitIcon}>🤖</Text>
                            <View style={styles.benefitInfo}>
                                <Text style={styles.benefitTitle}>AI متقدم</Text>
                                <Text style={styles.benefitDesc}>
                                    تجربة تعليمية مخصصة بالذكاء الاصطناعي
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>

                    <View style={styles.benefitCard}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
                            style={styles.benefitGradient}
                        >
                            <Text style={styles.benefitIcon}>💬</Text>
                            <View style={styles.benefitInfo}>
                                <Text style={styles.benefitTitle}>دعم فني مميز</Text>
                                <Text style={styles.benefitDesc}>
                                    أولوية في الرد والمساعدة الفنية
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>
                </View>

                {/* Terms */}
                <Text style={styles.terms}>
                    بالاشتراك، أنت توافق على شروط الخدمة وسياسة الخصوصية.{'\n'}
                    يمكنك إلغاء الاشتراك في أي وقت من إعدادات Google Play.
                </Text>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    currentSubCard: {
        marginBottom: 24,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    currentSubGradient: {
        padding: 20,
        alignItems: 'center',
    },
    currentSubTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    currentSubPlan: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    currentSubExpiry: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 4,
    },
    currentSubDays: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 16,
    },
    manageButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    manageButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 24,
    },
    plansContainer: {
        marginBottom: 24,
        gap: 16,
    },
    planCard: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    planCardSelected: {
        shadowColor: '#667eea',
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
    },
    planGradient: {
        padding: 20,
        position: 'relative',
    },
    popularBadge: {
        position: 'absolute',
        top: -8,
        right: 20,
        zIndex: 10,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
    },
    popularGradient: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    popularText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        marginTop: 8,
    },
    planTitleContainer: {
        flex: 1,
    },
    planTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    planDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    radioOuter: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderColor: '#FFFFFF',
    },
    radioInner: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    price: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    duration: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginLeft: 8,
    },
    discountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    originalPrice: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textDecorationLine: 'line-through',
    },
    discountBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    discountText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    featuresContainer: {
        gap: 8,
    },
    feature: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.95)',
        lineHeight: 20,
    },
    subscribeButton: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    subscribeGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    subscribeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    restoreButton: {
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 32,
    },
    restoreText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textDecorationLine: 'underline',
    },
    benefitsSection: {
        marginBottom: 24,
    },
    benefitsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    benefitCard: {
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
    },
    benefitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    benefitIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    benefitInfo: {
        flex: 1,
    },
    benefitTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    benefitDesc: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.85)',
        lineHeight: 18,
    },
    terms: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default SubscriptionScreen;
