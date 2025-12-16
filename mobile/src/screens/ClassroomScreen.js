import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    StatusBar,
    Platform,
    PermissionsAndroid,
    ImageBackground,
    Dimensions,
    TextInput,
    KeyboardAvoidingView,
    Modal
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Teacher3D from '../components/avatar/Teacher3D';
import ChalkboardWhiteboard from '../components/ChalkboardWhiteboard';
import HandwritingModal from '../components/HandwritingModal';
import { aiService } from '../services/AIService';
import arabicVoiceService from '../services/ArabicVoiceService';
import { theme } from '../config/theme';
import BouncyButton from '../components/BouncyButton';

const { width, height } = Dimensions.get('window');

const ClassroomScreen = ({ navigation, route }) => {
    const avatarRef = useRef(null);
    const whiteboardRef = useRef(null);

    const [status, setStatus] = useState('idle');
    const [transcript, setTranscript] = useState('');
    const [isMicActive, setIsMicActive] = useState(false);
    const [userName, setUserName] = useState('يا بطل');

    // Keyboard State
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [inputText, setInputText] = useState('');

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
            } catch (err) {
                console.warn(err);
            }
        }
    };

    const initializeClassroom = async () => {
        await requestPermissions();
        let name = 'بَطَل';
        try {
            const userDataStr = await AsyncStorage.getItem('userProfile');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                if (userData.name) name = userData.name;
                aiService.setUserProfile(userData.name, userData.grade, userData.interests);
            }
        } catch (e) { console.log('No user profile'); }

        setUserName(name);
        await arabicVoiceService.initialize();

        // Greeting with delay to ensure ready
        setTimeout(() => startGreeting(name), 1500);
    };

    const startGreeting = async (name) => {
        setStatus('speaking');

        // Handle Lesson Mode
        if (route?.params?.mode === 'lesson' && route?.params?.prompt) {
            console.log('🎓 Starting Lesson Mode...');
            await processUserMessage(route.params.prompt);
            return; // Skip standard greeting
        }

        // Standard Greeting
        const welcomeText = `أَهْلاً بِكَ يَا ${name} فِي فَصْلِنَا الدِّرَاسِيّْ! كَيْفَ حَالُكَ الْيَوْمْ؟ هَلْ أَنْتَ مُسْتَعِدٌّ لِلتَّعَلُّمْ؟`;
        setTranscript(welcomeText);

        // avatarRef.current?.startTalking(); // REMOVED: Wait for sync
        await arabicVoiceService.speak(welcomeText, {
            onPlayStart: () => avatarRef.current?.startTalking()
        });
        avatarRef.current?.stopTalking();

        setStatus('idle');
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
                // Speech detected
                setTranscript(`أنت: ${userText}`);
                setIsMicActive(false);
                processUserMessage(userText);
            } else {
                // Silence detected - RESTART LOOP
                console.log('🔄 Silence... listening again');
                // Keep status as 'listening' but maybe blink or just wait
                setTimeout(startListening, 500);
            }
        } catch (error) {
            // Error (No match / Network / Cancel) - RESTART LOOP
            console.warn("Speech Error (Looping):", error);
            setIsMicActive(false);

            // Retry after short delay
            setTimeout(() => {
                if (status !== 'speaking') startListening();
            }, 1000);
        }
    };

    const processUserMessage = async (text, base64Image = null) => {
        setStatus('thinking');
        avatarRef.current?.setEmotion('thinking');

        const response = await aiService.chat(text, base64Image);
        await speakResponse(response);

        if (response.action === 'practice_writing') {
            setWritingLetter(response.data || 'أ');
            setTimeout(() => setIsWritingModalVisible(true), 1500);
        }
    };

    const speakResponse = async (response) => {
        setStatus('speaking');
        setTranscript(response.text);

        if (response.emotion) {
            avatarRef.current?.setEmotion(response.emotion);
            if (response.emotion === 'happy') avatarRef.current?.laugh();
        }

        // Drawing Logic
        if (response.action === 'explain_board' && response.draw) {
            // Point to board (left side usually)
            avatarRef.current?.walkToBoard();
            await new Promise(r => setTimeout(r, 1000));
            if (response.draw) {
                whiteboardRef.current?.write(response.draw, 3000);
            }
        }

        // avatarRef.current?.startTalking(); // REMOVED: Wait for sync

        await arabicVoiceService.speak(response.text, {
            onPlayStart: () => {
                avatarRef.current?.startTalking();
            },
            onVisemeChange: (viseme, path) => {
                if (avatarRef.current) {
                    avatarRef.current.speakVisually(viseme);
                }
            }
        });

        avatarRef.current?.speakVisually('silence'); // Close mouth
        avatarRef.current?.stopTalking();

        // After speaking, reset position
        // avatarRef.current?.walkToCenter(); // REMOVED: Stay at board if there
        setStatus('idle');

        // AUTO-LISTEN: Continuous Conversation Mode
        console.log('🔄 Auto-listening...');
        setTimeout(() => {
            startListening();
        }, 800);
    };

    const pickImage = async () => {
        try {
            const result = await launchCamera({
                mediaType: 'photo',
                includeBase64: true,
                quality: 0.5,
                saveToPhotos: true,
            });

            if (result.didCancel || result.errorMessage) return;

            const asset = result.assets[0];
            if (asset.uri) {
                whiteboardRef.current?.showImage(asset.uri);
                setTranscript("جاري تحليل الصورة... 🖼️");
                await processUserMessage("انظري لهذه الصورة، هل حلي صحيح؟", asset.base64);
            }
        } catch (error) {
            console.error("ImagePicker Error:", error);
            Alert.alert("خطأ", "حدث خطأ أثناء فتح المعرض");
        }
    };

    const handleWritingSuccess = async () => {
        setIsWritingModalVisible(false);
        // Feedback to user immediately
        avatarRef.current?.setEmotion('happy');
        avatarRef.current?.laugh();

        // Let AI know about the success to continue the lesson flow
        // "I wrote the letter [Letter] correctly!"
        await processUserMessage(`لقد كتبت حرف ${writingLetter} بشكل صحيح! ماذا نفعل الآن؟`);
    };

    const handleSendText = async () => {
        if (!inputText.trim()) return;

        const textToSend = inputText;
        setInputText('');
        setIsKeyboardOpen(false);

        setTranscript(`أنت: ${textToSend}`);
        await processUserMessage(textToSend);
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

                {/* 1. Header (Floating on top) */}
                <View style={styles.header}>
                    <BouncyButton onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>←</Text>
                    </BouncyButton>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{status === 'listening' ? '🎤 أستمع' : '😊 جاهزة'}</Text>
                    </View>
                </View>

                {/* 2. Main Full Screen Layer (Teacher/Image) */}
                <View style={styles.fullScreenLayer}>
                    <Teacher3D ref={avatarRef} />
                </View>

                {/* 3. Chalkboard Overlay (Optional, if we want to draw on top of the image) */}
                <View style={styles.boardOverlay}>
                    {/* Pass true to make it transparent until drawn on */}
                    <ChalkboardWhiteboard ref={whiteboardRef} />
                </View>

                {/* 4. Transcript Text */}
                <View style={styles.transcriptContainer}>
                    <Text style={styles.transcriptText}>{transcript}</Text>
                </View>

                {/* 5. Footer Controls */}
                <View style={styles.controls}>
                    {/* Camera */}
                    <BouncyButton
                        onPress={pickImage}
                        disabled={status === 'speaking'}
                        style={[styles.controlButton, { backgroundColor: '#E0F7FA' }]}
                    >
                        <Text style={styles.controlIcon}>📷</Text>
                    </BouncyButton>

                    {/* Microphone (Main) */}
                    <BouncyButton
                        onPress={startListening}
                        disabled={status === 'thinking' || status === 'speaking'}
                        style={[
                            styles.micButton,
                            isMicActive && styles.micButtonActive,
                            status === 'thinking' && styles.micButtonThinking
                        ]}
                    >
                        {status === 'thinking' ? (
                            <ActivityIndicator color="white" size="large" />
                        ) : (
                            <Text style={styles.micIcon}>{isMicActive ? '👂' : '🎤'}</Text>
                        )}
                    </BouncyButton>

                    {/* Write */}
                    <BouncyButton
                        onPress={() => {
                            setWritingLetter('أ');
                            setIsWritingModalVisible(true);
                        }}
                        disabled={status === 'speaking'}
                        style={[styles.controlButton, { backgroundColor: '#F3E5F5' }]}
                    >
                        <Text style={styles.controlIcon}>✏️</Text>
                    </BouncyButton>

                    {/* Keyboard Input */}
                    <BouncyButton
                        onPress={() => setIsKeyboardOpen(true)}
                        disabled={status === 'speaking'}
                        style={[styles.controlButton, { backgroundColor: '#E1BEE7' }]}
                    >
                        <Text style={styles.controlIcon}>⌨️</Text>
                    </BouncyButton>

                    {/* DEBUG: Test Drawing Button */}
                    <BouncyButton
                        onPress={async () => {
                            // Manual trigger to verify drawing works
                            const mockResponse = {
                                text: "انظر، سأرسم لك دائرة جميلة!",
                                action: 'explain_board',
                                // Circle centered at 150,150 with radius 70
                                draw: "M 150, 75 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0",
                                emotion: 'happy'
                            };
                            await speakResponse(mockResponse);
                        }}
                        disabled={status === 'speaking' || status === 'thinking'}
                        style={[styles.controlButton, { backgroundColor: '#FFF3E0' }]}
                    >
                        <Text style={styles.controlIcon}>🎨</Text>
                    </BouncyButton>
                </View>

                {/* Keyboard Input Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isKeyboardOpen}
                    onRequestClose={() => setIsKeyboardOpen(false)}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.keyboardModalWrapper}
                    >
                        <View style={styles.keyboardContainer}>
                            <View style={styles.keyboardHeader}>
                                <Text style={styles.keyboardTitle}>اكتب رسالتك للمعلمة</Text>
                                <BouncyButton onPress={() => setIsKeyboardOpen(false)} style={styles.closeButton}>
                                    <Text style={styles.closeButtonText}>✕</Text>
                                </BouncyButton>
                            </View>

                            <TextInput
                                style={styles.textInput}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="اكتب هنا..."
                                placeholderTextColor="#999"
                                multiline
                                autoFocus
                            />

                            <BouncyButton
                                onPress={handleSendText}
                                style={styles.sendButton}
                            >
                                <Text style={styles.sendButtonText}>إرسال 📤</Text>
                            </BouncyButton>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                {/* Handwriting Modal */}
                <HandwritingModal
                    visible={isWritingModalVisible}
                    letter={writingLetter}
                    onClose={() => setIsWritingModalVisible(false)}
                    onSuccess={handleWritingSuccess}
                />
            </SafeAreaView >
        </View >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' }, // Clean white container, image will cover
    safeArea: { flex: 1 },
    header: {
        position: 'absolute',
        top: 30, left: 0, right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        zIndex: 50
    },
    backButton: {
        width: 45, height: 45, borderRadius: 22.5,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center', justifyContent: 'center'
    },
    backButtonText: { fontSize: 24, color: 'white', fontWeight: 'bold' },
    statusBadge: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 15, paddingVertical: 8,
        borderRadius: 20, justifyContent: 'center'
    },
    statusText: { color: 'white', fontWeight: 'bold' },

    fullScreenLayer: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        zIndex: 0, // Behind everything
    },

    boardOverlay: {
        position: 'absolute',
        top: '22%', // Push down further to match the green board
        right: '5%', // Push to the right side where the board is
        width: '45%', // Limit width to the board itself (approx half screen)
        height: '40%', // Cover board height
        zIndex: 5,
        backgroundColor: 'rgba(30, 58, 47, 0.0)',

        // DEBUG: Uncomment strict border to see exactly where the drawing layer is
        // borderWidth: 2, borderColor: 'red', 

        borderRadius: 8,
        elevation: 0
    },

    transcriptContainer: {
        position: 'absolute',
        bottom: '18%', // Above controls
        alignSelf: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20, paddingVertical: 12,
        borderRadius: 25,
        minWidth: '60%', maxWidth: '90%',
        alignItems: 'center', justifyContent: 'center',
        ...theme.shadows.md,
        zIndex: 40,
        elevation: 5,
        borderWidth: 2, borderColor: '#F0F0F0'
    },
    transcriptText: {
        fontSize: 18, color: '#2D3436', textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
        lineHeight: 26, fontWeight: 'bold'
    },

    controls: {
        position: 'absolute',
        bottom: 20, left: 20, right: 20,
        flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 15, borderRadius: 40,
        ...theme.shadows.lg,
        zIndex: 50
    },
    micButton: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: theme.colors.primary,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 4, borderColor: '#E0F7FA', marginTop: -30,
        ...theme.shadows.lg
    },
    micButtonActive: { backgroundColor: theme.colors.error, borderColor: '#FFEBEE', transform: [{ scale: 1.05 }] },
    micButtonThinking: { backgroundColor: theme.colors.secondary },
    micIcon: { fontSize: 40 },
    controlButton: {
        width: 55, height: 55, borderRadius: 28,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#F7F9FC'
    },
    controlIcon: { fontSize: 26 },

    // Keyboard Modal Styles
    keyboardModalWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    keyboardContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 20,
        paddingBottom: 40,
        ...theme.shadows.lg
    },
    keyboardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    keyboardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    closeButton: {
        padding: 5
    },
    closeButtonText: {
        fontSize: 20,
        color: theme.colors.textSecondary
    },
    textInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 15,
        padding: 15,
        fontSize: 16,
        color: '#333',
        minHeight: 100,
        textAlignVertical: 'top',
        textAlign: 'right', // Arabic alignment
        marginBottom: 15
    },
    sendButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center'
    },
    sendButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    }
});

export default ClassroomScreen;
