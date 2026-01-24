import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
    TextInput,
    Modal,
    Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { authService } from '../services/AuthService';
import { firebaseService } from '../services/FirebaseService';
import { subscriptionService } from '../services/SubscriptionService';
import { aiService } from '../services/AIService';
import CustomAlert from '../components/CustomAlert';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SettingsScreen = ({ navigation }) => {
    const [userProfile, setUserProfile] = useState(null);
    const [guardianName, setGuardianName] = useState('');
    const [studentName, setStudentName] = useState('');
    const [studentAge, setStudentAge] = useState('');
    const [notifications, setNotifications] = useState(true);
    const [soundEffects, setSoundEffects] = useState(true);
    const [autoSave, setAutoSave] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);

    // Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        onConfirm: () => {},
        singleButton: true,
        confirmText: 'موافق   ',
        cancelText: 'إلغاء   ',
        icon: 'alert-circle'
    });

    const showAlert = (config) => {
        setAlertConfig({
            confirmText: 'موافق   ',
            cancelText: 'إلغاء   ',
            singleButton: true,
            icon: 'alert-circle',
            ...config,
            visible: true,
            onConfirm: () => {
                setAlertConfig(prev => ({...prev, visible: false}));
                if (config.onConfirm) config.onConfirm();
            },
            onCancel: () => {
                setAlertConfig(prev => ({...prev, visible: false}));
                if (config.onCancel) config.onCancel();
            }
        });
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const memoryData = await AsyncStorage.getItem('nora_memory');
            if (memoryData) {
                const parsed = JSON.parse(memoryData);
                setUserProfile(parsed.userProfile || {});
                setGuardianName(parsed.userProfile?.guardianName || '');
                setStudentName(parsed.userProfile?.name || '');
                setStudentAge(parsed.userProfile?.age?.toString() || '');
            }

            // Load app settings
            const settings = await AsyncStorage.getItem('app_settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                setNotifications(parsed.notifications ?? true);
                setSoundEffects(parsed.soundEffects ?? true);
                setAutoSave(parsed.autoSave ?? true);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const saveSettings = async () => {
        try {
            const settings = {
                notifications,
                soundEffects,
                autoSave,
            };
            await AsyncStorage.setItem('app_settings', JSON.stringify(settings));
            Alert.alert('✅ تم الحفظ', 'تم حفظ الإعدادات بنجاح');
        } catch (error) {
            Alert.alert('خطأ', 'فشل حفظ الإعدادات');
        }
    };

    const handleUpdateProfile = async () => {
        if (!studentName.trim()) {
            Alert.alert('تنبيه', 'الرجاء إدخال اسم الطالب');
            return;
        }

        try {
            const memoryData = await AsyncStorage.getItem('nora_memory');
            const parsed = memoryData ? JSON.parse(memoryData) : {};
            
            const updatedProfile = {
                ...parsed.userProfile,
                guardianName: guardianName.trim(),
                name: studentName.trim(),
                age: parseInt(studentAge) || 6,
            };

            const updatedMemory = {
                ...parsed,
                userProfile: updatedProfile,
            };

            await AsyncStorage.setItem('nora_memory', JSON.stringify(updatedMemory));
            
            // Update Firebase
            await firebaseService.saveStudentData(updatedProfile);

            setUserProfile(updatedProfile);
            setShowEditModal(false);
            Alert.alert('✅ تم التحديث', 'تم تحديث البيانات بنجاح');
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('خطأ', 'فشل تحديث البيانات');
        }
    };

    const handleLogout = () => {
        showAlert({
            title: '⚠️ تسجيل الخروج',
            message: 'هل تريد تسجيل الخروج من التطبيق؟ (سيتم حفظ بياناتك)',
            confirmText: 'تسجيل الخروج   ',
            cancelText: 'إلغاء   ',
            singleButton: false,
            icon: 'log-out',
            onConfirm: async () => {
                try {
                    // Reset Services Memory
                    aiService.reset();
                    await subscriptionService.reset();

                    await authService.signOut();
                    await AsyncStorage.clear();
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                } catch (error) {
                    console.error('Logout error:', error);
                }
            }
        });
    };

    const handleDeleteAccount = () => {
        const performCleanup = async () => {
            try {
                aiService.reset();
                await subscriptionService.reset();
                await AsyncStorage.clear();
                
                showAlert({
                    title: 'تم الحذف ✅',
                    message: 'تم حذف حسابك وجميع بياناتك نهائياً. يمكنك الآن التسجيل من جديد.',
                    singleButton: true,
                    confirmText: 'حسناً   ',
                    onConfirm: () => navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    })
                });
            } catch (error) {
                console.error('Cleanup error:', error);
            }
        };

        const performDelete = async () => {
            try {
                await authService.deleteAccount();
                await performCleanup();
            } catch (error) {
                console.error('Delete account error:', error);
                
                if (error.code === 'auth/requires-recent-login') {
                    const user = authService.getCurrentUser();
                    const isGoogle = user?.providerData.find(p => p.providerId === 'google.com');

                    if (isGoogle) {
                        setTimeout(() => {
                            showAlert({
                                title: 'مطلوب التحقق',
                                message: 'لإتمام عملية الحذف، يرجى تأكيد هويتك عبر Google.',
                                confirmText: 'تأكيد وحذف   ',
                                cancelText: 'إلغاء   ',
                                singleButton: false,
                                icon: 'lock-closed',
                                onConfirm: async () => {
                                    try {
                                        const reauthSuccess = await authService.reauthenticateWithGoogle();
                                        if (reauthSuccess) {
                                            await authService.deleteAccount();
                                            await performCleanup();
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        showAlert({ title: 'خطأ', message: 'فشل التحقق من الهوية.' });
                                    }
                                }
                            });
                        }, 500);
                    } else {
                        setTimeout(() => {
                            showAlert({
                                title: 'مطلوب تسجيل دخول حديث',
                                message: 'لدواعٍ أمنية، يرجى تسجيل الخروج ثم الدخول مرة أخرى لإتمام عملية الحذف.',
                                confirmText: 'تسجيل الخروج   ',
                                cancelText: 'إلغاء   ',
                                singleButton: false,
                                icon: 'log-out',
                                onConfirm: handleLogout
                            });
                        }, 500);
                    }
                } else {
                    showAlert({ title: 'خطأ في الحذف', message: error.message || 'حدث خطأ غير متوقع' });
                }
            }
        };

        // First Warning
        showAlert({
            title: '⚠️ حذف الحساب',
            message: 'هل أنت متأكد؟ سيتم حذف جميع البيانات والتقدم بشكل نهائي\nولا يمكن استرجاعها!',
            confirmText: 'حذف نهائياً   ',
            cancelText: 'إلغاء   ',
            singleButton: false,
            icon: 'trash-outline',
            onConfirm: () => {
                // Second Warning
                setTimeout(() => {
                    showAlert({
                        title: '⚠️ تأكيد نهائي',
                        message: 'هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد تماماً من رغبتك في حذف الحساب؟',
                        confirmText: 'نعم، احذف الحساب   ',
                        cancelText: 'إلغاء   ',
                        singleButton: false,
                        icon: 'alert-circle',
                        onConfirm: performDelete
                    });
                }, 500);
            }
        });
    };

    const handleClearProgress = () => {
        showAlert({
            title: '⚠️ مسح التقدم',
            message: 'هل تريد مسح جميع التقدم والبدء من جديد؟ (سيتم الاحتفاظ بالحساب)',
            confirmText: 'مسح التقدم   ',
            cancelText: 'إلغاء   ',
            singleButton: false,
            onConfirm: async () => {
                try {
                    const memoryData = await AsyncStorage.getItem('nora_memory');
                    const parsed = memoryData ? JSON.parse(memoryData) : {};
                    
                    const resetProfile = {
                        ...parsed.userProfile,
                        totalSessions: 0,
                        completedLessons: 0,
                        lastLesson: '',
                        lastTopic: '',
                        isFirstTime: true,
                    };

                    const resetMemory = {
                        userProfile: resetProfile,
                        context: [],
                    };

                    await AsyncStorage.setItem('nora_memory', JSON.stringify(resetMemory));
                    await AsyncStorage.setItem('user', JSON.stringify({
                        ...resetProfile,
                        level: 1,
                        points: 0,
                    }));

                    showAlert({
                        title: '✅ تم المسح',
                        message: 'تم مسح التقدم بنجاح',
                        singleButton: true,
                        onConfirm: () => loadSettings()
                    });
                } catch (error) {
                    showAlert({ title: 'خطأ', message: 'فشل مسح التقدم' });
                }
            }
        });
    };

    const handleOpenPrivacyPolicy = () => {
        Linking.openURL('https://docs.google.com/document/d/125qJ-1gg9-XGzGuKQ90N26bZdMlyQIYsAoNmfoXUwFw/preview');
    };

    return (
        <View style={styles.container}>
            {/* Background */}
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
                        <Text style={styles.backIcon}>→</Text>
                    </LinearGradient>
                </TouchableOpacity>
                
                <Text style={styles.headerTitle}>⚙️ الإعدادات  </Text>
                
                <View style={{ width: 44 }} />
            </View>

            <ScrollView 
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profile Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👤 معلومات الحساب  </Text>
                    
                    <View style={styles.card}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                            style={styles.cardGradient}
                        >
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>ولي الأمر:  </Text>
                                <Text style={styles.infoValue}>{(guardianName || 'غير محدد') + '  '}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>اسم الطالب:   </Text>
                                <Text style={styles.infoValue}>{(studentName || 'غير محدد') + '  '}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>العمر:  </Text>
                                <Text style={styles.infoValue}>{studentAge || '6'} سنوات  </Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>الصف:  </Text>
                                <Text style={styles.infoValue}>{(userProfile?.grade || 'KG1') + '  '}</Text>
                            </View>

                            <TouchableOpacity 
                                style={styles.editButton}
                                onPress={() => setShowEditModal(true)}
                            >
                                <LinearGradient
                                    colors={['#4ECDC4', '#44A08D']}
                                    style={styles.editGradient}
                                >
                                    <Text style={styles.editButtonText}>✏️ تعديل البيانات</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>

                {/* Subscription Section */}
                {!subscriptionService.STORE_REVIEW_MODE && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>👑 الاشتراك  </Text>
                        
                        <TouchableOpacity 
                            style={styles.card}
                            onPress={() => navigation.navigate('Subscription')}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#FFD700', '#FFA500']}
                                style={styles.cardGradient}
                            >
                                <View style={styles.subscriptionContent}>
                                    <View style={styles.subscriptionIcon}>
                                        <Text style={styles.subscriptionEmoji}>💎</Text>
                                    </View>
                                    <View style={styles.subscriptionInfo}>
                                        <Text style={styles.subscriptionTitle}>الاشتراك المميز  </Text>
                                        <Text style={styles.subscriptionDesc}>
                                            احصل على وصول كامل لجميع المميزات
                                        </Text>
                                    </View>
                                    <Text style={styles.subscriptionArrow}>→</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                {/* App Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔧 إعدادات التطبيق  </Text>
                    
                    <View style={styles.card}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                            style={styles.cardGradient}
                        >
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>🔔 الإشعارات</Text>
                                    <Text style={styles.settingDesc}>تلقي تذكيرات يومية</Text>
                                </View>
                                <Switch
                                    value={notifications}
                                    onValueChange={setNotifications}
                                    trackColor={{ false: '#767577', true: '#4ECDC4' }}
                                    thumbColor={notifications ? '#FFFFFF' : '#f4f3f4'}
                                />
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>🔊 المؤثرات الصوتية</Text>
                                    <Text style={styles.settingDesc}>تشغيل الأصوات والموسيقى</Text>
                                </View>
                                <Switch
                                    value={soundEffects}
                                    onValueChange={setSoundEffects}
                                    trackColor={{ false: '#767577', true: '#4ECDC4' }}
                                    thumbColor={soundEffects ? '#FFFFFF' : '#f4f3f4'}
                                />
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>💾 الحفظ التلقائي</Text>
                                    <Text style={styles.settingDesc}>حفظ التقدم تلقائياً</Text>
                                </View>
                                <Switch
                                    value={autoSave}
                                    onValueChange={setAutoSave}
                                    trackColor={{ false: '#767577', true: '#4ECDC4' }}
                                    thumbColor={autoSave ? '#FFFFFF' : '#f4f3f4'}
                                />
                            </View>

                            <TouchableOpacity 
                                style={styles.saveButton}
                                onPress={saveSettings}
                            >
                                <LinearGradient
                                    colors={['#FFD93D', '#F6C90E']}
                                    style={styles.saveGradient}
                                >
                                    <Text style={styles.saveButtonText}>💾 حفظ الإعدادات  </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>

                {/* Privacy Policy */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔒 الخصوصية</Text>
                    <View style={styles.card}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                            style={styles.cardGradient}
                        >
                             <TouchableOpacity 
                                style={styles.dangerButton}
                                onPress={handleOpenPrivacyPolicy}
                            >
                                <Text style={styles.dangerIcon}>📄</Text>
                                <View style={styles.dangerInfo}>
                                    <Text style={[styles.dangerTitle, { color: '#FFF' }]}>سياسة الخصوصية</Text>
                                    <Text style={styles.dangerDesc}>قراءة الشروط والأحكام</Text>
                                </View>
                                <Ionicons name="open-outline" size={20} color="#FFF" style={{ opacity: 0.8 }} />
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⚠️ منطقة الخطر  </Text>
                    
                    <View style={styles.card}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                            style={styles.cardGradient}
                        >
                            <TouchableOpacity 
                                style={styles.dangerButton}
                                onPress={handleClearProgress}
                            >
                                <Text style={styles.dangerIcon}>🔄</Text>
                                <View style={styles.dangerInfo}>
                                    <Text style={styles.dangerTitle}>مسح التقدم</Text>
                                    <Text style={styles.dangerDesc}>البدء من جديد (الحساب يبقى)</Text>
                                </View>
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity 
                                style={styles.dangerButton}
                                onPress={handleLogout}
                            >
                                <Text style={styles.dangerIcon}>🚪</Text>
                                <View style={styles.dangerInfo}>
                                    <Text style={styles.dangerTitle}>تسجيل الخروج</Text>
                                    <Text style={styles.dangerDesc}>الخروج من الحساب</Text>
                                </View>
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity 
                                style={styles.dangerButton}
                                onPress={handleDeleteAccount}
                            >
                                <Text style={styles.dangerIcon}>🗑️</Text>
                                <View style={styles.dangerInfo}>
                                    <Text style={styles.dangerTitle}>حذف الحساب</Text>
                                    <Text style={styles.dangerDesc}>حذف نهائي لجميع البيانات</Text>
                                </View>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>

                {/* App Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ℹ️ معلومات التطبيق</Text>
                    
                    <View style={styles.card}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                            style={styles.cardGradient}
                        >
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>الإصدار:  </Text>
                                <Text style={styles.infoValue}>1.0.0</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>المطور:  </Text>
                                <Text style={styles.infoValue}>hash jeeey</Text>
                            </View>

                            <TouchableOpacity 
                                style={styles.saveButton}
                                onPress={() => navigation.navigate('Support')}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    style={styles.saveGradient}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                        <Text style={styles.saveButtonText}>تواصل مع الدعم     </Text>
                                        <Text style={{ fontSize: 20, marginLeft: 8 }}>📞</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            style={styles.modalGradient}
                        >
                            <Text style={styles.modalTitle}>✏️ تعديل البيانات</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>اسم ولي الأمر</Text>
                                <TextInput
                                    style={styles.input}
                                    value={guardianName}
                                    onChangeText={setGuardianName}
                                    placeholder="أدخل اسم ولي الأمر"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>اسم الطالب</Text>
                                <TextInput
                                    style={styles.input}
                                    value={studentName}
                                    onChangeText={setStudentName}
                                    placeholder="أدخل اسم الطالب"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>العمر</Text>
                                <TextInput
                                    style={styles.input}
                                    value={studentAge}
                                    onChangeText={setStudentAge}
                                    placeholder="أدخل العمر"
                                    keyboardType="numeric"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                />
                            </View>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity 
                                    style={styles.modalButton}
                                    onPress={() => setShowEditModal(false)}
                                >
                                    <Text style={styles.modalButtonText}>إلغاء</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.modalButtonPrimary]}
                                    onPress={handleUpdateProfile}
                                >
                                    <LinearGradient
                                        colors={['#4ECDC4', '#44A08D']}
                                        style={styles.modalButtonGradient}
                                    >
                                        <Text style={styles.modalButtonTextPrimary}>حفظ</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>
                </View>
            </Modal>

            <CustomAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                onConfirm={alertConfig.onConfirm}
                onCancel={alertConfig.onCancel}
                singleButton={alertConfig.singleButton}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
                icon={alertConfig.icon}
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
    backIcon: {
        fontSize: 24,
        color: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 24,
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
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    card: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    cardGradient: {
        padding: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    infoLabel: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    editButton: {
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    editGradient: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    settingDesc: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    saveButton: {
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    saveGradient: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    dangerIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    dangerInfo: {
        flex: 1,
    },
    dangerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    dangerDesc: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
    },
    modalGradient: {
        padding: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'right',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    modalButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalButtonPrimary: {
        backgroundColor: 'transparent',
    },
    modalButtonGradient: {
        width: '100%',
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    modalButtonTextPrimary: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    subscriptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subscriptionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    subscriptionEmoji: {
        fontSize: 32,
    },
    subscriptionInfo: {
        flex: 1,
    },
    subscriptionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    subscriptionDesc: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    subscriptionArrow: {
        fontSize: 24,
        color: '#FFFFFF',
        marginLeft: 8,
    },
});

export default SettingsScreen;
