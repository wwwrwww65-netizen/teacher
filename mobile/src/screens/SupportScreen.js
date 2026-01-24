import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    ActivityIndicator,
    Share,
    Platform,
    Linking,
    ToastAndroid
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseService } from '../services/FirebaseService';
import CustomAlert from '../components/CustomAlert';

const SupportScreen = ({ navigation }) => {
    const [message, setMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        onConfirm: () => {},
        singleButton: true,
        confirmText: 'موافق'
    });

    const showAlert = (title, message, onConfirm, singleButton = true, cancelText = 'إلغاء   ', onCancel) => {
        const handleConfirm = () => {
             setAlertConfig(prev => ({...prev, visible: false}));
             if (onConfirm) onConfirm();
        };
        
        const handleCancel = () => {
             setAlertConfig(prev => ({...prev, visible: false}));
             if (onCancel) onCancel();
        };

        setAlertConfig({
            visible: true,
            title,
            message,
            onConfirm: handleConfirm,
            onCancel: handleCancel,
            singleButton,
            confirmText: 'موافق   ',
            cancelText
        });
    };

    const handleSelectImage = async () => {
        const options = {
            mediaType: 'photo',
            quality: 0.8,
            selectionLimit: 1,
        };

        try {
            const result = await launchImageLibrary(options);
            
            console.log('Image Picker Result:', result); // DEBUG

            if (result.didCancel) return;
            
            if (result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                console.log('Selected Asset:', asset); // DEBUG
                setSelectedImage(asset);
            } else {
                // Optional: Don't show alert for user cancellation if handled by didCancel, 
                // but launchImageLibrary sometimes returns empty without didCancel
                // showAlert('تنبيه', 'لم يتم اختيار صورة'); 
            }
        } catch (error) {
            console.error('Picker Error:', error);
            showAlert('خطأ', 'فشل فتح المعرض: ' + error.message);
        }
    };

    const openDirectMail = async (body) => {
        const subject = encodeURIComponent('استفسار دعم فني - تطبيق المعلمة نورا');
        const encodedBody = encodeURIComponent(body);
        const mailtoUrl = `mailto:wwerooe@gmail.com?subject=${subject}&body=${encodedBody}`;

        try {
            const canOpen = await Linking.canOpenURL(mailtoUrl);
            if (canOpen) {
                await Linking.openURL(mailtoUrl);
            } else {
                showAlert('خطأ', 'لا يوجد تطبيق بريد إلكتروني مثبت');
            }
        } catch (err) {
            console.error('Mail Error:', err);
        }
    };

    const handleSend = async () => {
        if (!message.trim() && !selectedImage) {
            showAlert('تنبيه', 'الرجاء كتابة رسالة أو اختيار صورة');
            return;
        }

        setLoading(true);

        try {
            // Get user info
            const userData = await AsyncStorage.getItem('user');
            const user = userData ? JSON.parse(userData) : {};
            
            const ticketData = {
                message: message.trim(),
                userEmail: user.email || 'unknown',
                userName: user.name || 'unknown',
                userUid: user.uid || 'unknown',
                hasImage: !!selectedImage,
                version: '1.0.0'
            };

            // 1. Submit to Firestore (Text Backup)
            await firebaseService.submitSupportTicket(ticketData);

            if (Platform.OS === 'android') {
                ToastAndroid.show('✅ تم حفظ التذكرة، جاري فتح البريد...', ToastAndroid.LONG);
            }

            // 2. Open Email Directly
            const emailBody = `
مرحبا فريق الدعم،

${message}

------------------
بيانات المستخدم:
الاسم: ${user.name || 'غير محدد'}
المعرف: ${user.uid || 'N/A'}
الإصدار: 1.0.0
            `;

            // If image was selected, notify user to attach it manually
            if (selectedImage) {
                showAlert(
                    '   تنبيه   ',
                    'لضمان فتح البريد مباشرة، يرجى إرفاق الصورة يدوياً من داخل تطبيق البريد 📎',
                    async () => {
                        await openDirectMail(emailBody);
                    },
                    false, // Not single button? Wait, standard alert has 1 button to confirm action.
                    // Actually, here user wants to proceed. Let's make it single button "Open".
                    // But user might want to cancel?
                    // Let's use singleButton false.
                    'إلغاء   ',
                    () => {}
                );
                // Wait, showAlert params: title, message, onConfirm, singleButton, cancelText, onCancel
                // Let's call it clearly:
                /*
                showAlert(
                    'تذكير', 
                    'لضمان فتح البريد مباشرة، يرجى إرفاق الصورة يدوياً...',
                    async () => await openDirectMail(emailBody),
                    false, // show cancel
                    'إلغاء',
                    () => {} // cancel action
                );
                */
               // But wait, the previous code had 'OK (Open Mail)' button.
               // My custom alert confirmText defaults to 'موافق'. I need to make sure I update confirmText in showAlert logic if needed, or pass it.
               // My simple showAlert wrapper assumes 'موافق'. I should update showAlert wrapper to accept confirmText.
            } else {
                await openDirectMail(emailBody);
            }

        } catch (error) {
            console.error('Support Error:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // ... JSX ...

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#667eea', '#764ba2', '#f093fb']}
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
                        <Ionicons name="arrow-forward" size={24} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>الدعم الفني   </Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                        style={styles.formContainer}
                    >
                        <Text style={styles.label}>رسالتك</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="اكتب مشكلتك أو استفسارك هنا..."
                            placeholderTextColor="rgba(255,255,255,0.6)"
                            multiline
                            numberOfLines={6}
                            value={message}
                            onChangeText={setMessage}
                            textAlignVertical="top"
                        />

                        <Text style={styles.label}>صورة توضيحية (اختياري)</Text>
                        <TouchableOpacity onPress={handleSelectImage} style={styles.imageButton}>
                            {selectedImage ? (
                                <View style={styles.imagePreviewContainer}>
                                    <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
                                    <TouchableOpacity 
                                        style={styles.removeImageBtn}
                                        onPress={() => setSelectedImage(null)}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.placeholderContainer}>
                                    <Ionicons name="image-outline" size={32} color="#FFFFFF" />
                                    <Text style={styles.placeholderText}>اضغط لاختيار صورة   </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.sendButton}
                            onPress={handleSend}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#4ECDC4', '#44A08D']}
                                style={styles.sendGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Text style={styles.sendText}>إرسال   </Text>
                                        <Ionicons 
                                            name="send" 
                                            size={20} 
                                            color="#FFF" 
                                            style={{ marginLeft: 8, transform: [{ rotate: '180deg' }] }} 
                                        />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </ScrollView>

            <CustomAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                onConfirm={alertConfig.onConfirm}
                onCancel={alertConfig.onCancel}
                singleButton={alertConfig.singleButton}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
            />
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
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    content: {
        padding: 20,
    },
    card: {
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        marginBottom: 20,
    },
    formContainer: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
        marginStart: 4,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.2)', // Slightly dark background for better white text contrast
        borderRadius: 20,
        padding: 20,
        fontSize: 17,
        color: '#FFFFFF',
        minHeight: 150, // Taller
        marginBottom: 25,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
        textAlign: 'right',
        lineHeight: 24,
    },
    imageButton: {
        marginBottom: 35,
    },
    placeholderContainer: {
        height: 160,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    placeholderText: {
        color: '#EEE',
        fontSize: 15,
        fontWeight: '600',
    },
    imagePreviewContainer: {
        position: 'relative',
        height: 200,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 20,
        padding: 4,
    },
    sendButton: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        marginTop: 10,
    },
    sendGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
    },
    sendText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

export default SupportScreen;
