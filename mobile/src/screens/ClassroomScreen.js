import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    StatusBar,
    Platform,
    PermissionsAndroid
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ClassroomScene from '../components/ClassroomScene';
import TeacherAvatar from '../components/avatar/TeacherAvatar';
import ChalkboardWhiteboard from '../components/ChalkboardWhiteboard';
import HandwritingModal from '../components/HandwritingModal';
import { aiService } from '../services/AIService';
import arabicVoiceService from '../services/ArabicVoiceService';
import { theme } from '../config/theme';

const ClassroomScreen = ({ navigation }) => {
    const avatarRef = useRef(null);
    const whiteboardRef = useRef(null);

    const [status, setStatus] = useState('idle');
    const [transcript, setTranscript] = useState('');
    const [isMicActive, setIsMicActive] = useState(false);

    // Handwriting Modal State
    const [isWritingModalVisible, setIsWritingModalVisible] = useState(false);
    const [writingLetter, setWritingLetter] = useState('أ');

    useEffect(() => {
        initializeClassroom();
        return () => {
            arabicVoiceService.stop();
        };
    }, []);

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                const grants = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                ]);

                if (grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED) {
                    console.log('Audio permission granted');
                } else {
                    console.log('Audio permission denied');
                    Alert.alert('تنبيه', 'التطبيق يحتاج لصلاحية الميكروفون ليعمل');
                }
            } catch (err) {
                console.warn(err);
            }
        }
    };

    const initializeClassroom = async () => {
        await requestPermissions();

        try {
            const userDataStr = await AsyncStorage.getItem('userProfile');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                aiService.setUserProfile(userData.name, userData.grade, userData.interests);
            }
        } catch (e) { console.log('No user profile'); }

        await arabicVoiceService.initialize();
        startGreeting();
    };

    const startGreeting = async () => {
        setStatus('thinking');
        const response = await aiService.generateGreeting();
        await speakResponse(response);
    };

    const startListening = async () => {
        if (status === 'speaking' || status === 'thinking') return;
        setStatus('listening');
        setIsMicActive(true);
        setTranscript("أستمع إليك... 🎤");
        avatarRef.current?.setEmotion('neutral');

        try {
            const userText = await arabicVoiceService.listen('ar-SA');
            if (userText) {
                setTranscript(`أنت: ${userText}`);
                setIsMicActive(false);
                processUserMessage(userText);
            } else {
                // Timeout or empty
                setIsMicActive(false);
                setStatus('idle');
                setTranscript("لم أسمعك جيداً 😕");
            }
        } catch (error) {
            console.warn("Speech Error:", error);
            setIsMicActive(false);
            setStatus('idle');
            setTranscript("حدث خطأ في الميكروفون");
        }
    };

    const processUserMessage = async (text, base64Image = null) => {
        setStatus('thinking');
        avatarRef.current?.setEmotion('thinking');

        // إرسال النص + الصورة (إن وجدت) للذكاء الاصطناعي
        const response = await aiService.chat(text, base64Image);
        await speakResponse(response);

        // التعامل مع الأوامر الخاصة
        if (response.action === 'practice_writing') {
            setWritingLetter(response.data || 'أ');
            setTimeout(() => setIsWritingModalVisible(true), 1500);
        } else if (response.text.includes('؟') || response.action === 'quiz') {
            setTimeout(startListening, 1000);
        } else {
            setStatus('idle');
        }
    };

    const speakResponse = async (response) => {
        setStatus('speaking');
        setTranscript(response.text);

        if (response.emotion) {
            avatarRef.current?.setEmotion(response.emotion);
            if (response.emotion === 'happy') avatarRef.current?.laugh();
        }

        if (response.action === 'explain_board' || response.draw) {
            avatarRef.current?.walkToBoard();
            await new Promise(r => setTimeout(r, 1000));
            if (response.draw) {
                whiteboardRef.current?.write(response.draw, 3000);
            }
        } else if (response.action === 'talk_center') {
            avatarRef.current?.walkToCenter();
        }

        await avatarRef.current?.speakArabic(response.text);

        if (response.action === 'explain_board') {
            await new Promise(r => setTimeout(r, 1000));
            avatarRef.current?.walkToCenter();
        } else {
            avatarRef.current?.resetPosition();
        }

        setStatus('idle'); // Ensure status returns to idle after speaking
    };

    // --- Image Picker Logic ---
    const pickImage = async () => {
        try {
            const result = await launchCamera({
                mediaType: 'photo',
                includeBase64: true,
                quality: 0.5,
                saveToPhotos: true,
            });

            if (result.didCancel) {
                return;
            }

            if (result.errorMessage) {
                Alert.alert("خطأ", result.errorMessage);
                return;
            }

            const asset = result.assets[0];

            if (asset.uri) {
                // 1. عرض الصورة على السبورة
                whiteboardRef.current?.showImage(asset.uri);
                avatarRef.current?.walkToBoard();

                // 2. إرسال الصورة للتحليل
                setTranscript("جاري تحليل الصورة... 🖼️");
                await processUserMessage("انظري لهذه الصورة، هل حلي صحيح؟", asset.base64);
            }
        } catch (error) {
            console.error("ImagePicker Error:", error);
            Alert.alert("خطأ", "حدث خطأ أثناء فتح المعرض");
        }
    };

    // --- Handwriting Logic ---
    const handleWritingSuccess = async () => {
        setIsWritingModalVisible(false);
        // المعلمة تشجع الطفل
        avatarRef.current?.setEmotion('happy');
        avatarRef.current?.laugh();
        await avatarRef.current?.speakArabic("أحسنت يا بطل! كتابة ممتازة! 🌟");
    };

    return (
        <ClassroomScene>
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{status === 'listening' ? '🎤 أستمع' : '😊 جاهزة'}</Text>
                    </View>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                    <ChalkboardWhiteboard ref={whiteboardRef} />
                    <View style={styles.avatarContainer}>
                        <TeacherAvatar ref={avatarRef} />
                    </View>
                    <View style={styles.transcriptContainer}>
                        <Text style={styles.transcriptText}>{transcript}</Text>
                    </View>
                </ScrollView>

                {/* Footer Buttons */}
                <View style={styles.footer}>
                    {/* Camera Button */}
                    <TouchableOpacity style={styles.secondaryButton} onPress={pickImage} disabled={status === 'speaking'}>
                        <Text style={styles.secondaryButtonIcon}>📷</Text>
                    </TouchableOpacity>

                    {/* Mic Button */}
                    <TouchableOpacity
                        style={[styles.micButton, isMicActive && styles.micButtonActive]}
                        onPress={startListening}
                        disabled={status === 'thinking' || status === 'speaking'}
                    >
                        {status === 'thinking' ? (
                            <ActivityIndicator color="white" size="large" />
                        ) : (
                            <Text style={styles.micIcon}>{isMicActive ? '👂' : '🎤'}</Text>
                        )}
                    </TouchableOpacity>

                    {/* Write Button (Manual Trigger) */}
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => {
                            // تغيير الحرف عشوائياً أو بناءً على الدرس
                            setWritingLetter('أ');
                            setIsWritingModalVisible(true);
                        }}
                        disabled={status === 'speaking'}
                    >
                        <Text style={styles.secondaryButtonIcon}>✏️</Text>
                    </TouchableOpacity>
                </View>

                {/* Handwriting Modal */}
                <HandwritingModal
                    visible={isWritingModalVisible}
                    letter={writingLetter}
                    onClose={() => setIsWritingModalVisible(false)}
                    onSuccess={handleWritingSuccess}
                />
            </SafeAreaView>
        </ClassroomScene>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, marginTop: 10 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    backButtonText: { fontSize: 24, color: 'white' },
    statusBadge: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 15 },
    statusText: { color: 'white', fontWeight: 'bold' },
    content: { flex: 1 },
    contentContainer: { paddingBottom: 100 },
    avatarContainer: { alignItems: 'center', marginTop: 20 },
    transcriptContainer: { margin: 20, backgroundColor: 'rgba(255,255,255,0.9)', padding: 15, borderRadius: 15, minHeight: 60, alignItems: 'center', justifyContent: 'center' },
    transcriptText: { fontSize: 16, color: '#333', textAlign: 'center' },
    footer: { position: 'absolute', bottom: 30, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
    micButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'white', elevation: 5 },
    micButtonActive: { backgroundColor: '#F44336', transform: [{ scale: 1.1 }] },
    micIcon: { fontSize: 35 },
    secondaryButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', elevation: 3 },
    secondaryButtonIcon: { fontSize: 24 },
});

export default ClassroomScreen;
