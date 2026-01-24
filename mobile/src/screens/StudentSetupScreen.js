import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Dimensions,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Keyboard,
    Modal,
    FlatList,
    ScrollView,
    Image,
    StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../config/theme';
import { authService } from '../services/AuthService';
import { firebaseService } from '../services/FirebaseService';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const GRADES = [
    { id: 'KG1', label: 'روضة 1 (KG1)', icon: '🧸', color: '#FF9800' },
    { id: 'KG2', label: 'روضة 2 (KG2)', icon: '🎨', color: '#4CAF50' },
    { id: 'Grade1', label: 'الصف الأول', icon: '✏️', color: '#2196F3' },
    { id: 'Grade2', label: 'الصف الثاني', icon: '📚', color: '#9C27B0' },
    { id: 'Grade3', label: 'الصف الثالث', icon: '🏫', color: '#F44336' },
];

const StudentSetupScreen = ({ navigation }) => {
    const [step, setStep] = useState(1);
    
    // Guardian Info
    const [guardianName, setGuardianName] = useState('');
    const [country, setCountry] = useState('');
    
    // Country Selection
    const [modalVisible, setModalVisible] = useState(false);
    
    // Student Info
    const [studentName, setStudentName] = useState('');
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [studentAge, setStudentAge] = useState(null);
    const [gender, setGender] = useState(null); // 'boy' or 'girl'
    
    const AGES = [4, 5, 6, 7, 8, 9, 10, 11, 12];

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    
    const scrollViewRef = useRef(null);

    useEffect(() => {
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
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);
    
    // List of Arab Countries
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
                    if (data.guardianName) setGuardianName(data.guardianName);
                    if (data.country) setCountry(data.country);
                    
                    if (data.guardianName && data.country) {
                        console.log('⏩ [SETUP] Guardian info found, jumping to Step 2');
                        setStep(2);
                    }
                }
            } catch (e) {
                console.log('Error fetching partial data:', e);
            }
        };
        fetchPartial();
    }, []);

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
            setStep(2);
        } else if (step === 2) {
            if (studentName.trim().length < 2) {
                 Alert.alert('تنبيه', 'الرجاء كتابة اسم الطالب (البطل)');
                 return;
            }
            if (!studentAge) {
                 Alert.alert('تنبيه', 'كم عمر البطل؟ 🎂');
                 return;
            }
            if (!gender) {
                 Alert.alert('تنبيه', 'هل البطل ولد أم بنت؟');
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
                age: studentAge,
                gender: gender,
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
                gender: gender,
                level: 1,
                points: 0,
                avatar: gender === 'boy' ? '👦' : '👧',
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

    return (
        <View style={styles.container}>
            {/* Animated Gradient Background */}
            <LinearGradient
                colors={['#667eea', '#764ba2', '#f093fb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Circles */}
            <View style={StyleSheet.absoluteFill}>
                <View style={[styles.circle, { top: -50, right: -50, width: 200, height: 200, opacity: 0.1 }]} />
                <View style={[styles.circle, { bottom: -80, left: -80, width: 250, height: 250, opacity: 0.08 }]} />
                <View style={[styles.circle, { top: '40%', left: -30, width: 150, height: 150, opacity: 0.06 }]} />
            </View>

            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    bounces={true}
                    overScrollMode="always"
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header Section */}
                    <Animated.View 
                        style={[
                            styles.headerContainer,
                            { 
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
                            }
                        ]}
                        renderToHardwareTextureAndroid={true}
                    >
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <LinearGradient
                                colors={['#FFD700', '#FFA500']}
                                style={styles.iconGradient}
                            >
                                <Image 
                                    source={
                                        step === 1 ? require('../assets/guardian_logo.png') :
                                        step === 2 ? require('../assets/student_logo.png') :
                                        require('../assets/teacher_logo.png')
                                    }
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </LinearGradient>
                        </Animated.View>
                        <Text style={styles.title}>
                            {step === 1 ? 'بيانات ولي الأمر' : step === 2 ? 'يا أهلاً بالبطل!' : 'في أي صف أنت؟'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {step === 1 ? 'لنتعرف عليك أولاً' : step === 2 ? 'الاسم والعمر؟' : 'اختر صفك لنبدأ التعلم!'}
                        </Text>
                    </Animated.View>

                    {/* Form Card */}
                    <Animated.View 
                        style={[
                            styles.cardContainer,
                            { 
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                        renderToHardwareTextureAndroid={true}
                    >
                        <View style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
                            {step === 1 && (
                                <>
                                    {/* Guardian Name */}
                                    <View style={styles.inputWrapper}>
                                        <View style={styles.labelRow}>
                                            <Ionicons name="person" size={18} color="#667eea" />
                                            <Text style={styles.label}>اسم ولي الأمر</Text>
                                        </View>
                                        <View style={styles.inputContainer}>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="الاسم الكامل"
                                                placeholderTextColor="rgba(0,0,0,0.5)"
                                                value={guardianName}
                                                onChangeText={setGuardianName}
                                                textAlign="right"
                                            />
                                        </View>
                                    </View>

                                    {/* Country */}
                                    <View style={styles.inputWrapper}>
                                        <View style={styles.labelRow}>
                                            <Ionicons name="globe" size={18} color="#667eea" />
                                            <Text style={styles.label}>البلد</Text>
                                        </View>
                                        <TouchableOpacity 
                                            style={[styles.input, styles.countrySelector]}
                                            onPress={() => setModalVisible(true)}
                                        >
                                            <Ionicons name="chevron-down" size={20} color="rgba(0,0,0,0.4)" style={{ position: 'absolute', left: 15 }} />
                                            <Text style={[styles.countrySelectedText, !country && { color: 'rgba(0,0,0,0.5)' }]}>
                                                {country || "اختر دولتك"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Next Button */}
                                    <TouchableOpacity
                                        onPress={handleNext}
                                        activeOpacity={0.8}
                                        style={styles.nextButtonContainer}
                                    >
                                        <LinearGradient
                                            colors={['#4ECDC4', '#44A08D']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.nextButton}
                                        >
                                            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', width: '100%', paddingHorizontal: 15 }}>
                                                <Text style={[styles.buttonText, { flex: 1 }]}>التالي</Text>
                                                <Ionicons name="arrow-back" size={20} color="#FFF" />
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    {/* Student Name */}
                                    <View style={styles.inputWrapper}>
                                        <View style={styles.labelRow}>
                                            <Ionicons name="happy" size={18} color="#667eea" />
                                            <Text style={styles.label}>اسم الطالب</Text>
                                        </View>
                                        <View style={styles.inputContainer}>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="اكتب اسم البطل هنا..."
                                                placeholderTextColor="rgba(0,0,0,0.5)"
                                                value={studentName}
                                                onChangeText={setStudentName}
                                                textAlign="right"
                                            />
                                        </View>
                                    </View>

                                    {/* Age Selection */}
                                    <View style={styles.inputWrapper}>
                                        <View style={[styles.labelRow, { justifyContent: 'space-between' }]}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Ionicons name="calendar" size={18} color="#667eea" />
                                                <Text style={styles.label}>العمر (سنوات)</Text>
                                            </View>
                                            <TouchableOpacity 
                                                onPress={() => {
                                                    scrollViewRef.current?.scrollTo({ x: 100, animated: true });
                                                }}
                                                activeOpacity={0.5}
                                            >
                                                <Animated.View style={{ transform: [{ scale: pulseAnim }, { translateX: 20 }], flexDirection: 'row', alignItems: 'center' }}>
                                                    <Ionicons name="arrow-back" size={20} color="#4ECDC4" />
                                                </Animated.View>
                                            </TouchableOpacity>
                                        </View>
                                        <ScrollView 
                                            ref={scrollViewRef}
                                            horizontal 
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={styles.ageScrollContent}
                                            style={{ flexGrow: 0 }}
                                        >
                                            {AGES.map((age) => (
                                                <TouchableOpacity
                                                    key={age}
                                                    onPress={() => setStudentAge(age)}
                                                    activeOpacity={0.7}
                                                    style={[
                                                        styles.ageCard,
                                                        studentAge === age && styles.ageCardSelected
                                                    ]}
                                                >
                                                    <Text style={[
                                                        styles.ageNumber,
                                                        studentAge === age && styles.ageNumberSelected
                                                    ]}>{age}</Text>
                                                    <Text 
                                                        style={[
                                                            styles.ageLabel,
                                                            studentAge === age && styles.ageLabelSelected,
                                                            { width: '100%', textAlign: 'center' }
                                                        ]}
                                                    >سنوات  </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>

                                    {/* Gender Selection */}
                                    <View style={styles.inputWrapper}>
                                        <View style={styles.labelRow}>
                                            <Ionicons name="people" size={18} color="#667eea" />
                                            <Text style={styles.label}>الجنس</Text>
                                        </View>
                                        <View style={styles.genderContainer}>
                                            <TouchableOpacity 
                                                style={[
                                                    styles.genderButton, 
                                                    gender === 'boy' && [styles.genderButtonSelected, { borderColor: '#63B3ED', backgroundColor: '#EBF8FF' }]
                                                ]}
                                                onPress={() => setGender('boy')}
                                                activeOpacity={0.7}
                                            >
                                                <Image 
                                                    source={require('../assets/boy_avatar.png')} 
                                                    style={styles.genderImage}
                                                    resizeMode="contain"
                                                />
                                                <Text 
                                                    style={[
                                                        styles.genderText, 
                                                        gender === 'boy' && { color: '#2B6CB0' },
                                                        { width: '100%', textAlign: 'center' }
                                                    ]}
                                                >ولد  </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity 
                                                style={[
                                                    styles.genderButton, 
                                                    gender === 'girl' && [styles.genderButtonSelected, { borderColor: '#F687B3', backgroundColor: '#FFF5F7' }]
                                                ]}
                                                onPress={() => setGender('girl')}
                                                activeOpacity={0.7}
                                            >
                                                <Image 
                                                    source={require('../assets/girl_avatar.png')} 
                                                    style={styles.genderImage}
                                                    resizeMode="contain"
                                                />
                                                <Text 
                                                    style={[
                                                        styles.genderText, 
                                                        gender === 'girl' && { color: '#B83280' },
                                                        { width: '100%', textAlign: 'center' }
                                                    ]}
                                                >بنت  </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Buttons */}
                                    <View style={styles.footerButtons}>
                                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                                            <Text style={styles.backButtonText}>رجوع</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleNext}
                                            activeOpacity={0.8}
                                            style={[styles.nextButtonContainer, { flex: 2 }]}
                                        >
                                            <LinearGradient
                                                colors={['#4ECDC4', '#44A08D']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.nextButton}
                                            >
                                                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', width: '100%', paddingHorizontal: 15 }}>
                                                    <Text style={[styles.buttonText, { flex: 1 }]}>التالي</Text>
                                                    <Ionicons name="arrow-back" size={20} color="#FFF" />
                                                </View>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    {/* Grade Selection */}
                                    <View style={styles.gradeGrid}>
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
                                                    <View style={{ width: '100%', alignItems: 'center' }}>
                                                        <Text style={[
                                                            styles.gradeLabel,
                                                            { color: isSelected ? 'white' : grade.color, textAlign: 'center', width: '100%' }
                                                        ]}>{grade.label}  </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    {/* Buttons */}
                                    <View style={styles.footerButtons}>
                                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                                            <Text style={styles.backButtonText}>رجوع</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={finishSetup}
                                            activeOpacity={0.8}
                                            disabled={!selectedGrade}
                                            style={[styles.nextButtonContainer, { flex: 2 }]}
                                        >
                                            <LinearGradient
                                                colors={selectedGrade ? ['#FFD93D', '#F9C449'] : ['#BDC3C7', '#95A5A6']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.nextButton}
                                            >
                                                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', width: '100%', paddingHorizontal: 15 }}>
                                                    <Text style={[styles.buttonText, { flex: 1 }]}>ابدأ الرحلة!</Text>
                                                    <Ionicons name="rocket" size={20} color="#FFF" />
                                                </View>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

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
                                <Ionicons name="close" size={28} color="#7F8C8D" />
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    circle: { position: 'absolute', borderRadius: 1000, backgroundColor: '#FFF' },
    scrollContent: { 
        padding: 20, 
        paddingTop: 100, 
        paddingBottom: 40,
        minHeight: '100%',
    },
    headerContainer: { alignItems: 'center', marginBottom: 30 },
    iconGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
        overflow: 'hidden',
    },
    logoImage: {
        width: 80,
        height: 80,
    },
    title: { 
        fontSize: 32, 
        fontWeight: 'bold', 
        color: '#FFF', 
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        textAlign: 'center',
        width: '100%',
        paddingHorizontal: 20,
    },
    subtitle: { 
        fontSize: 16, 
        color: '#FFFFFF',
        textAlign: 'center',
        width: '100%',
        paddingHorizontal: 5,
        marginTop: 5,
    },
    cardContainer: {
        borderRadius: 30,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 20,
    },
    card: { padding: 25, borderRadius: 30 },
    inputWrapper: { marginBottom: 20 },
    labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6, justifyContent: 'flex-start' },
    label: { fontSize: 14, fontWeight: '600', color: '#333', flex: 1, textAlign: 'left' },
    inputContainer: { position: 'relative' },
    input: {
        backgroundColor: '#F7FAFC',
        borderRadius: 15,
        padding: 15,
        fontSize: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        color: '#333',
        textAlign: 'right',
    },
    countrySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    countrySelectedText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        textAlign: 'right',
    },
    ageScrollContent: {
        paddingVertical: 10,
        gap: 8,
        flexDirection: 'row',
        paddingHorizontal: 10,
    },
    ageCard: {
        width: 80,
        height: 85,
        borderRadius: 20, // Softer corners
        backgroundColor: '#F8F9FA', // Very light greyish white
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EDF2F7',
        elevation: 1,
        shadowColor: '#A0AEC0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        marginHorizontal: 0,
    },
    ageCardSelected: {
        backgroundColor: '#E0F2F1', // Very light teal
        borderColor: '#4ECDC4',
        borderWidth: 2,
        transform: [{ scale: 1.05 }],
        elevation: 4,
        shadowColor: '#4ECDC4',
        shadowOpacity: 0.3,
    },
    ageNumber: {
        fontSize: 26,
        fontWeight: '800', // Extra bold
        color: '#718096', // Soft dark grey
    },
    ageNumberSelected: {
        color: '#319795', // Darker teal
    },
    ageLabel: {
        fontSize: 11,
        color: '#A0AEC0',
        marginTop: 2,
        fontWeight: '600',
    },
    ageLabelSelected: {
        color: '#38B2AC',
    },
    genderContainer: {
        flexDirection: 'row-reverse',
        justifyContent: 'center',
        gap: 25,
        marginTop: 15,
    },
    genderButton: {
        width: 110,
        padding: 15,
        borderRadius: 25,
        backgroundColor: '#F7FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EDF2F7',
        elevation: 1,
        shadowColor: '#CBD5E0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    genderButtonSelected: {
        backgroundColor: '#FFF', // Will be overridden in render based on gender
        borderWidth: 2,
        elevation: 4,
        transform: [{ scale: 1.05 }],
    },
    genderImage: {
        width: 60,
        height: 60,
        marginBottom: 8,
    },
    genderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#718096',
    },
    genderTextSelected: {
        color: '#2D3748', // Darker text when selected
    },
    gradeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 20,
        width: '100%',
    },
    gradeCard: {
        width: '45%',
        padding: 10,
        borderRadius: 20,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradeIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    gradeLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    nextButtonContainer: {
        marginTop: 10,
        borderRadius: 15,
        elevation: 2,
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    nextButton: {
        height: 60,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 25,
    },
    buttonText: { 
        color: '#fff', 
        fontSize: 18, 
        fontWeight: 'bold',
        textAlign: 'center',
        paddingHorizontal: 15,
    },
    footerButtons: {
        flexDirection: 'row-reverse',
        width: '100%',
        alignItems: 'center',
        marginTop: 10,
        gap: 10,
    },
    backButton: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
        borderRadius: 15,
        backgroundColor: '#F5F5F5',
    },
    backButtonText: {
        color: '#7F8C8D',
        fontSize: 16,
        fontWeight: 'bold',
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
        fontWeight: 'bold',
        color: '#2C3E50',
        flex: 1,
        textAlign: 'right',
    },
    closeBtn: {
        padding: 5,
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
