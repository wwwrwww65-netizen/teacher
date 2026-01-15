import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Alert, Image } from 'react-native';
import { subscriptionService } from '../services/SubscriptionService';

const { width, height } = Dimensions.get('window');

const SubscriptionModal = ({ visible, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        if (visible) {
            loadProducts();
        }
    }, [visible]);

    const loadProducts = async () => {
        try {
            const items = await subscriptionService.getSubscriptions();
            setProducts(items);
        } catch (e) {
            console.log('Error loading products', e);
        }
    };

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            await subscriptionService.subscribe();
            // Subscription status is handled by the listener in the service
            // We can close the modal if successful via the listener callback or just wait
        } catch (error) {
            Alert.alert('تنبيه', 'حدث خطأ أثناء الاتصال بالمتجر. تأكد من إعداد حساب الدفع.');
            setLoading(false);
        }
        // Don't set loading false immediately to prevent flicker if successful, let the listener handle it or timeout
        setTimeout(() => setLoading(false), 3000); 
    };

    const handleRestore = async () => {
        setLoading(true);
        try {
            const restored = await subscriptionService.restorePurchases();
            if (restored) {
                Alert.alert('نجاح', 'تمت استعادة اشتراكك بنجاح! 🎉');
                onClose();
            } else {
                Alert.alert('تنبيه', 'لم يتم العثور على اشتراكات سابقة.');
            }
        } catch (e) {
            Alert.alert('خطأ', 'حدث خطأ أثناء استعادة المشتريات.');
        }
        setLoading(false);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.card}>
                    {/* Header Image or Icon Area */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.icon}>🎓</Text>
                        </View>
                        <Text style={styles.title}>المعلمة الذكية: Premium</Text>
                        <Text style={styles.subtitle}>افتح عالم المعرفة لطفلك</Text>
                    </View>

                    {/* Features List */}
                    <View style={styles.featuresContainer}>
                        <FeatureItem text="دروس غير محدودة مع المعلمة نورا" />
                        <FeatureItem text="تتبع ذكي لمستوى الطفل وتقدمه" />
                        <FeatureItem text="تفاعل صوتي كامل ومحفز" />
                        <FeatureItem text="دعم فوري وتصحيح للأخطاء" />
                    </View>

                    {/* Pricing */}
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceText}>
                             5.00 دولار / شهرياً
                        </Text>
                        <Text style={styles.cancelText}>يمكنك الإلغاء في أي وقت</Text>
                    </View>

                    {/* Action Buttons */}
                    <TouchableOpacity 
                        style={styles.subscribeButton} 
                        onPress={handleSubscribe}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.subscribeButtonText}>اشترك الآن وابدأ التعلم</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
                        <Text style={styles.restoreButtonText}>استعادة المشتريات</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>ليس الآن</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const FeatureItem = ({ text }) => (
    <View style={styles.featureRow}>
        <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: width * 0.9,
        backgroundColor: '#FFF',
        borderRadius: 25,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E3F2FD', // Light Blue
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    icon: {
        fontSize: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A237E', // Dark Blue
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#757575',
        textAlign: 'center',
    },
    featuresContainer: {
        width: '100%',
        marginBottom: 24,
    },
    featureRow: {
        flexDirection: 'row-reverse', // RTL Support
        alignItems: 'center',
        marginBottom: 12,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#4CAF50', // Green
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    checkMark: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    featureText: {
        fontSize: 16,
        color: '#424242',
        flex: 1,
        textAlign: 'right', // RTL
    },
    priceContainer: {
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: '#FFFDE7', // Light Yellow
        padding: 12,
        borderRadius: 12,
        width: '100%',
    },
    priceText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#F57F17', // Orange/Gold
        marginBottom: 4,
    },
    cancelText: {
        fontSize: 12,
        color: '#9E9E9E',
    },
    subscribeButton: {
        backgroundColor: '#2196F3', // Blue
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
        elevation: 4,
    },
    subscribeButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    restoreButton: {
        padding: 10,
    },
    restoreButtonText: {
        color: '#757575',
        fontSize: 14,
    },
    closeButton: {
        marginTop: 8,
    },
    closeButtonText: {
        color: '#BDBDBD',
        fontSize: 14,
    },
});

export default SubscriptionModal;
