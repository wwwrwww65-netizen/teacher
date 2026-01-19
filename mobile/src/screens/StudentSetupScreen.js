import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Dimensions,
    Animated,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Alert,
    I18nManager,
    Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../config/theme';
import BouncyButton from '../components/BouncyButton';

const { width } = Dimensions.get('window');

const GRADES = [
    { id: 'KG1', label: 'روضة 1 (KG1)', icon: '🧸', color: '#FF9800' },
    { id: 'KG2', label: 'روضة 2 (KG2)', icon: '🎨', color: '#4CAF50' },
    { id: 'Grade1', label: 'الصف الأول', icon: '✏️', color: '#2196F3' },
    { id: 'Grade2', label: 'الصف الثاني', icon: '📚', color: '#9C27B0' },
    { id: 'Grade3', label: 'الصف الثالث', icon: '🏫', color: '#F44336' },
];

const StudentSetupScreen = ({ navigation }) => {
    const [step, setStep] = useState(1); // 1: Name, 2: Grade
    const [name, setName] = useState('');
    const [selectedGrade, setSelectedGrade] = useState(null);
    const slideAnim = useRef(new Animated.Value(0)).current;

    const isRTL = I18nManager.isRTL;

    const handleNext = () => {
        // ALWAYS dismiss keyboard first for better UX
        Keyboard.dismiss();

        if (step === 1) {
            if (name.trim().length < 2) {
                Alert.alert('تنبيه', 'رجاءً اكتب اسمك يا بطل!');
                return;
            }
            // Animate to next step
            // In RTL, next slide is to the left (negative x)? No, in RTL 'row' means [Start] <-- [Next]. 
            // Actually in RN RTL: [Item 1] [Item 2]. Item 1 is on Right. Item 2 is on Left.
            // To see Item 2, we need to move the container to the RIGHT (+width).
            // Let's force it to standard LTR logic for the slider by using flexDirection: 'row-reverse' or something?
            // Safer: Check RTL.
            const toValue = isRTL ? width : -width;

            Animated.timing(slideAnim, {
                toValue: toValue,
                duration: 500,
                useNativeDriver: true,
            }).start(() => setStep(2));
        } else {
            finishSetup();
        }
    };

    const handleBack = () => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
        }).start(() => setStep(1));
    };

    const finishSetup = async () => {
        if (!selectedGrade) {
            Alert.alert('تنبيه', 'اختر صفك الدراسي!');
            return;
        }

        try {
            // 1. Prepare User Data
            const userProfile = {
                name: name.trim(),
                grade: selectedGrade.label,
                gradeId: selectedGrade.id,
                gradeVerified: true,
                interests: [],
                isFirstTime: true // Explicitly set as first time for AI greeting
            };

            // 2. Save via AIService (Handles Firebase Sync + Memory)
            // This ensures data goes to: Local Storage ('nora_memory') AND Firebase ('students/{id}')
            const { aiService } = require('../services/AIService'); 
            aiService.setUserProfile(userProfile);

            // 3. Save for Legacy UI components (HomeScreen displays)
            const userData = {
                name: name.trim(),
                level: 1,
                points: 0,
                avatar: '🦁', // Default avatar
                grade: selectedGrade.label
            };
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            // Navigate to Home
            console.log('✅ Student Setup Complete & Synced:', userProfile);
            navigation.replace('Home');
        } catch (error) {
            console.error('Failed to save setup:', error);
            Alert.alert('خطأ', 'حدث خطأ في حفظ البيانات');
        }
    };

    const renderStep1 = () => (
        <View style={[styles.stepContainer, { width }]}>
            <View style={styles.card}>
                <Text style={styles.emoji}>👋</Text>
                <Text style={styles.title}>مرحباً بك يا بطل!</Text>
                <Text style={styles.subtitle}>ما هو اسمك الجميل؟</Text>

                <TextInput
                    style={styles.input}
                    placeholder="اكتب اسمك هنا..."
                    placeholderTextColor="#BDC3C7"
                    value={name}
                    onChangeText={setName}
                    textAlign="center"
                    autoFocus={false}
                />

                <BouncyButton onPress={handleNext} style={styles.nextButton}>
                    <Text style={styles.buttonText}>التالي ⬅️</Text>
                </BouncyButton>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={[styles.stepContainer, { width }]}>
            <View style={[styles.card, styles.cardWide]}>
                <Text style={styles.title}>في أي صف أنت؟ 🎓</Text>
                <Text style={styles.subtitle}>اختر صفك لنبدأ التعلم!</Text>

                <View style={styles.grid}>
                    {GRADES.map((grade) => {
                        const isSelected = selectedGrade?.id === grade.id;
                        return (
                            <TouchableOpacity
                                key={grade.id}
                                style={[
                                    styles.gradeCard,
                                    { borderColor: grade.color, backgroundColor: isSelected ? grade.color : 'white' }
                                ]}
                                onPress={() => setSelectedGrade(grade)}
                            >
                                <Text style={styles.gradeIcon}>{grade.icon}</Text>
                                <Text style={[
                                    styles.gradeLabel,
                                    { color: isSelected ? 'white' : grade.color }
                                ]}>{grade.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.footerButtons}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Text style={styles.backButtonText}>رجوع</Text>
                    </TouchableOpacity>

                    <BouncyButton
                        onPress={finishSetup}
                        style={[styles.finishButton, !selectedGrade && styles.disabledBtn]}
                        disabled={!selectedGrade}
                    >
                        <Text style={styles.buttonText}>ابـدأ الرحـلـة! 🚀</Text>
                    </BouncyButton>
                </View>
            </View>
        </View>
    );

    return (
        <ImageBackground
            source={{ uri: 'https://img.freepik.com/free-vector/cartoon-kids-playing-background_1308-37834.jpg' }}
            style={styles.background}
            imageStyle={{ opacity: 0.2 }}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => React.Keyboard && React.Keyboard.dismiss()}
                style={{ flex: 1 }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <Animated.View style={[styles.slider, { transform: [{ translateX: slideAnim }] }]}>
                        {renderStep1()}
                        {renderStep2()}
                    </Animated.View>
                </KeyboardAvoidingView>
            </TouchableOpacity>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: '#E3F2FD', // Soft Blue
    },
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    slider: {
        flexDirection: I18nManager.isRTL ? 'row' : 'row', // Keep it 'row'. In RTL this means 1 (Right) -> 2 (Left).
        width: width * 2,
        // In RTL: View starts at right edge. [Step1][Step2]. Step 2 is at -width (relative to Step 1?? No, relative to container).
        // Actually, let's keep it simple.
    },
    stepContainer: {
        width: width,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 30,
        padding: 30,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    cardWide: {
        maxWidth: 500,
    },
    emoji: {
        fontSize: 60,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: '#7F8C8D',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        backgroundColor: '#F7F9F9',
        borderRadius: 15,
        padding: 20,
        fontSize: 20,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        color: '#2C3E50',
        marginBottom: 30,
        fontWeight: 'bold',
    },
    nextButton: {
        width: '100%',
        backgroundColor: theme.colors.primary,
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
    },
    finishButton: {
        flex: 2,
        backgroundColor: theme.colors.secondary,
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginLeft: 10,
    },
    backButton: {
        flex: 1,
        padding: 18,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#7F8C8D',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 30,
    },
    gradeCard: {
        width: '45%',
        padding: 15,
        borderRadius: 20,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    gradeIcon: {
        fontSize: 32,
        marginBottom: 5,
    },
    gradeLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    footerButtons: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
    },
    disabledBtn: {
        backgroundColor: '#BDC3C7',
        opacity: 0.7,
    }
});

export default StudentSetupScreen;
