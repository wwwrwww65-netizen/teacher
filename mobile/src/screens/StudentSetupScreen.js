import React, { useState, useRef, useEffect } from 'react';
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
    Keyboard,
    Modal,
    FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../config/theme';
import BouncyButton from '../components/BouncyButton';
import { authService } from '../services/AuthService';
import { firebaseService } from '../services/FirebaseService';

const { width } = Dimensions.get('window');

const GRADES = [
    { id: 'KG1', label: 'روضة 1 (KG1)', icon: '🧸', color: '#FF9800' },
    { id: 'KG2', label: 'روضة 2 (KG2)', icon: '🎨', color: '#4CAF50' },
    { id: 'Grade1', label: 'الصف الأول', icon: '✏️', color: '#2196F3' },
    { id: 'Grade2', label: 'الصف الثاني', icon: '📚', color: '#9C27B0' },
    { id: 'Grade3', label: 'الصف الثالث', icon: '🏫', color: '#F44336' },
];

const StudentSetupScreen = ({ navigation }) => {
    const [step, setStep] = useState(1); // 1: Guardian, 2: Student, 3: Grade
    
    // Guardian Info
    const [guardianName, setGuardianName] = useState('');
    const [country, setCountry] = useState('');
    
    // Country Selection
    const [modalVisible, setModalVisible] = useState(false);
    
    // Student Info
    const [studentName, setStudentName] = useState('');
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [studentAge, setStudentAge] = useState(null); // New State for Age
    
    const AGES = [4, 5, 6, 7, 8, 9, 10, 11, 12];

    const slideAnim = useRef(new Animated.Value(0)).current;
    
    // List of Arab Countries (Priority)
    const ARAB_COUNTRIES = [
        "السعودية 🇸🇦", "الإمارات 🇦🇪", "مصر 🇪🇬", "الكويت 🇰🇼", "قطر 🇶🇦", 
        "البحرين 🇧🇭", "عمان 🇴🇲", "الأردن 🇯🇴", "العراق 🇮🇶", "اليمن 🇾🇪", 
        "فلسطين 🇵🇸", "سوريا 🇸🇾", "لبنان 🇱🇧", "السودان 🇸🇩", "ليبيا 🇱🇾", 
        "تونس 🇹🇳", "الجزائر 🇩🇿", "المغرب 🇲🇦", "موريتانيا 🇲🇷", "الصومال 🇸🇴", 
        "جيبوتي 🇩🇯", "جزر القمر 🇰🇲"
    ];

    const OTHER_COUNTRIES = [
        "الولايات المتحدة 🇺🇸", "بريطانيا 🇬🇧", "فرنسا 🇫🇷", "ألمانيا 🇩🇪", 
        "كندا 🇨🇦", "أستراليا 🇦🇺", "تركيا 🇹🇷", "إسبانيا 🇪🇸", "إيطاليا 🇮🇹", 
        "روسيا 🇷🇺", "الصين 🇨🇳", "الهند 🇮🇳", "اليابان 🇯🇵", "كوريا الجنوبية 🇰🇷"
    ];

    useEffect(() => {
        const user = authService.getCurrentUser();
        if (user && user.displayName) {
             setGuardianName(user.displayName);
        }
        
        const fetchPartial = async () => {
            try {
                const data = await firebaseService.getStudentData();
                if (data) {
                    if (data.guardianName && !guardianName) setGuardianName(data.guardianName);
                    if (data.country) setCountry(data.country);
                }
            } catch (e) {
                console.log('Error fetching partial data:', e);
            }
        };
        fetchPartial();
    }, []);

    // ... keep variable definitions

    const handleNext = () => {
        Keyboard.dismiss();
        if (step === 1) {
            if (guardianName.trim().length < 2) {
                Alert.alert('تنبيه', 'الرجاء كتابة اسم ولي الأمر');
                return;
            }
            if (!country || country.trim().length < 2) {
                Alert.alert('تنبيه', 'الرجاء اختيار الدولة');
                setModalVisible(true);
                return;
            }
            setStep(2); // Direct state change, no animation
        } else if (step === 2) {
            if (studentName.trim().length < 2) {
                 Alert.alert('تنبيه', 'الرجاء كتابة اسم الطالب (البطل)');
                 return;
            }
            if (!studentAge) {
                 Alert.alert('تنبيه', 'كم عمر البطل؟ 🎂');
                 return;
            }
            setStep(3);
        } else {
            finishSetup();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };
    
    const finishSetup = async () => {
        if (!selectedGrade) {
            Alert.alert('تنبيه', 'اختر صفك الدراسي!');
            return;
        }

        try {
            const userProfile = {
                guardianName: guardianName.trim(),
                country: country.trim(),
                name: studentName.trim(), 
                age: studentAge, // Save Age
                grade: selectedGrade.label,
                gradeId: selectedGrade.id,
                gradeVerified: true,
                interests: [],
                isFirstTime: true
            };

            const { aiService } = require('../services/AIService'); 
            const { firebaseService } = require('../services/FirebaseService');
            
            aiService.setUserProfile(userProfile);
            await firebaseService.saveStudentData(userProfile);

            const userData = {
                name: studentName.trim(),
                age: studentAge,
                level: 1,
                points: 0,
                avatar: '🦁',
                grade: selectedGrade.label
            };
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            console.log('✅ Student Setup Complete & Synced:', userProfile);
            navigation.replace('Home');
        } catch (error) {
            console.error('Failed to save setup:', error);
            Alert.alert('خطأ', 'حدث خطأ في حفظ البيانات');
        }
    };

    const renderCountryItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.countryItem} 
            onPress={() => {
                setCountry(item);
                setModalVisible(false);
            }}
        >
            <Text style={styles.countryText}>{item}</Text>
        </TouchableOpacity>
    );

    const renderStep1 = () => (
        <View style={[styles.stepContainer, { width }]}>
            <View style={styles.card}>
                <Text style={styles.emoji}>👨‍👩‍👧‍👦</Text>
                <Text style={styles.title}>بيانات ولي الأمر</Text>
                <Text style={styles.subtitle}>لنتعرف عليك أولاً</Text>

                <View style={{width: '100%', marginBottom: 15}}>
                    <Text style={styles.label}>الاسم (ولي الأمر)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="الاسم الكامل"
                        placeholderTextColor="#BDC3C7"
                        value={guardianName}
                        onChangeText={setGuardianName}
                        textAlign="right"
                        writingDirection="rtl"
                    />
                </View>

                <View style={{width: '100%', marginBottom: 20}}>
                     <Text style={styles.label}>البلد</Text>
                    <TouchableOpacity 
                        style={[styles.input, { 
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center' 
                        }]} 
                        onPress={() => setModalVisible(true)}
                    >
                         <Text style={{ 
                             position: 'absolute', 
                             left: 15, 
                             fontSize: 14, 
                             color: '#BDC3C7' 
                         }}>▼</Text>
                         
                        <Text style={{ 
                            color: country ? '#2C3E50' : '#BDC3C7', 
                            fontSize: 18, 
                            fontWeight: 'bold',
                            flex: 1,
                            textAlign: 'right' 
                        }}>
                            {country || "اختر دولتك"} 
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Country Selection Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>اختر دولتك</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                    <Text style={styles.closeButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <FlatList
                                data={[...ARAB_COUNTRIES, "--- دول أخرى ---", ...OTHER_COUNTRIES]}
                                keyExtractor={(item) => item}
                                renderItem={({ item }) => {
                                    if (item === "--- دول أخرى ---") {
                                        return <Text style={styles.separator}>{item}</Text>;
                                    }
                                    return renderCountryItem({ item });
                                }}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                initialNumToRender={20}
                            />
                        </View>
                    </View>
                </Modal>

                <BouncyButton onPress={handleNext} style={styles.nextButton}>
                    <Text style={styles.buttonText}>التالي ⬅️</Text>
                </BouncyButton>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={[styles.stepContainer, { width }]}>
            <View style={styles.card}>
                <Text style={styles.emoji}>🎂</Text>
                <Text style={styles.title}>يا أهلاً بالبطل!</Text>
                <Text style={styles.subtitle}>الاسم والعمر؟</Text>

                <View style={{width: '100%', marginBottom: 15}}>
                    <Text style={styles.label}>اسم الطالب</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="اكتب اسم البطل هنا..."
                        placeholderTextColor="#BDC3C7"
                        value={studentName}
                        onChangeText={setStudentName}
                        textAlign="right"
                        writingDirection="rtl"
                    />
                </View>

                <View style={{width: '100%', marginBottom: 20}}>
                    <Text style={styles.label}>العمر (سنوات)</Text>
                    <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
                        {AGES.map((age) => (
                            <TouchableOpacity
                                key={age}
                                onPress={() => setStudentAge(age)}
                                style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 25,
                                    backgroundColor: studentAge === age ? theme.colors.primary : '#F0F3F4',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: 2,
                                    borderColor: studentAge === age ? theme.colors.primary : '#E0E0E0'
                                }}
                            >
                                <Text style={{
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                    color: studentAge === age ? 'white' : '#7F8C8D'
                                }}>{age}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.footerButtons}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Text style={styles.backButtonText}>رجوع</Text>
                    </TouchableOpacity>
                    <BouncyButton onPress={handleNext} style={[styles.nextButton, {flex: 2, marginTop: 0}]}>
                        <Text style={styles.buttonText}>التالي ⬅️</Text>
                    </BouncyButton>
                </View>
            </View>
        </View>
    );

    const renderStep3 = () => (
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
    
    // RENDER: Simple Conditional View
    return (
        <ImageBackground
            source={{ uri: 'https://img.freepik.com/free-vector/cartoon-kids-playing-background_1308-37834.jpg' }}
            style={styles.background}
            imageStyle={{ opacity: 0.2 }}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => Keyboard.dismiss()}
                style={{ flex: 1 }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    {/* Render ONLY the current step */}
                    <View style={styles.stepWrapper}>
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                    </View>
                </KeyboardAvoidingView>
            </TouchableOpacity>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: '#E3F2FD', 
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center', // Center everything
    },
    stepWrapper: {
        width: width,
        alignItems: 'center',
        justifyContent: 'center',
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
    // ... inside styles
    title: {
        fontSize: 30, // Increased slightly for Baloo
        fontFamily: 'BalooBhaijaan2-Bold', // New Playful Font
        color: '#2C3E50',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        fontFamily: 'BalooBhaijaan2-Medium', 
        color: '#7F8C8D',
        marginBottom: 25,
        textAlign: 'center',
        lineHeight: 28,
    },
    label: {
        fontSize: 18, // Baloo needs to be a bit bigger to be readable as label
        fontFamily: 'BalooBhaijaan2-Bold',
        color: '#34495E',
        marginBottom: 10,
        textAlign: 'left', 
        width: '100%',      
        alignSelf: 'stretch',
    },
    input: {
        width: '100%',
        backgroundColor: '#F7F9F9',
        borderRadius: 15,
        padding: 18, 
        fontSize: 20, // Bigger input text
        fontFamily: 'BalooBhaijaan2-Medium',
        borderWidth: 1.5, 
        borderColor: '#E0E0E0', 
        color: '#2C3E50',
        marginBottom: 15,
        textAlign: 'right'
    },
    nextButton: {
        width: '100%',
        backgroundColor: theme.colors.primary,
        padding: 15, // Baloo is tall, adjust padding if needed
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10
    },
    finishButton: {
        flex: 2,
        backgroundColor: theme.colors.secondary,
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    backButton: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#7F8C8D',
        fontSize: 20,
        fontFamily: 'BalooBhaijaan2-Bold',
    },
    buttonText: {
        color: 'white',
        fontSize: 22,
        fontFamily: 'BalooBhaijaan2-Bold',
        letterSpacing: 1,
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
        fontSize: 15,
        fontFamily: 'Tajawal-Bold', // New Font
        textAlign: 'center',
    },
    footerButtons: {
        flexDirection: 'row-reverse',
        width: '100%',
        alignItems: 'center',
        marginTop: 10,
        gap: 10
    },
    disabledBtn: {
        backgroundColor: '#BDC3C7',
        opacity: 0.7,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 20,
        height: '70%',
    },
    modalHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ECF0F1',
        paddingBottom: 15,
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: 'Tajawal-Bold', // New Font
        color: '#2C3E50',
    },
    closeBtn: {
        padding: 5,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#7F8C8D',
        fontWeight: 'bold',
    },
    countryItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    countryText: {
        fontSize: 18,
        color: '#2C3E50',
        textAlign: 'right',
        fontFamily: 'Tajawal-Regular', // New Font
    },
    separator: {
        textAlign: 'center',
        color: '#95A5A6',
        fontWeight: 'bold',
        marginVertical: 10,
        fontSize: 16,
    }
});

export default StudentSetupScreen;
