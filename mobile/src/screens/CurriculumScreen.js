import React, { useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Animated,
    Dimensions 
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../config/theme';

const { width } = Dimensions.get('window');

const CurriculumScreen = ({ navigation }) => {
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 🎈 Float animation for particles
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -15,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const subjects = [
        {
            id: 'arabic',
            title: 'اللغة العربية',
            icon: '📖',
            description: 'الحروف والقراءة والكتابة',
            initialMessage: 'أهلاً بك يا بطل! اليوم سنتعلم الحروف العربية الجميلة. دعنا نبدأ بحرف الألف.',
            targetItem: 'أ',
            gradient: ['#667eea', '#764ba2'],
            shadowColor: '#667eea'
        },
        {
            id: 'quran',
            title: 'القرآن الكريم',
            icon: '📿',
            description: 'التلاوة والحفظ والتجويد',
            initialMessage: 'السلام عليكم! سنتعلم اليوم قراءة القرآن الكريم بطريقة صحيحة وجميلة.',
            targetItem: null,
            gradient: ['#11998e', '#38ef7d'],
            shadowColor: '#11998e'
        },
        {
            id: 'english',
            title: 'اللغة الإنجليزية',
            icon: '🔤',
            description: 'الحروف والكلمات الأساسية',
            initialMessage: 'Hello! اليوم سنتعلم الحروف الإنجليزية. لنبدأ بأول حرف (A).',
            targetItem: null,
            gradient: ['#f093fb', '#f5576c'],
            shadowColor: '#f093fb'
        },
        {
            id: 'math',
            title: 'الرياضيات',
            icon: '🔢',
            description: 'الأرقام والعمليات الحسابية',
            initialMessage: 'مرحباً! اليوم سنتعلم الأرقام والحساب. هل تعرف كيف تعد؟ لنبدأ بالرقم واحد.',
            targetItem: '1',
            gradient: ['#4facfe', '#00f2fe'],
            shadowColor: '#4facfe'
        },
        {
            id: 'science',
            title: 'العلوم',
            icon: '🔬',
            description: 'الطبيعة والتجارب العلمية',
            initialMessage: 'مرحباً أيها العالم الصغير! اليوم سنكتشف عجائب العلوم معاً.',
            targetItem: null,
            gradient: ['#FA8BFF', '#2BD2FF', '#2BFF88'],
            shadowColor: '#FA8BFF'
        },
        {
            id: 'islamic',
            title: 'التربية الإسلامية',
            icon: '🕌',
            description: 'العقيدة والعبادات والأخلاق',
            initialMessage: 'السلام عليكم! سنتعلم اليوم عن ديننا الإسلامي الجميل.',
            targetItem: null,
            gradient: ['#ffecd2', '#fcb69f'],
            shadowColor: '#ffecd2'
        },
        {
            id: 'history',
            title: 'التاريخ',
            icon: '📜',
            description: 'قصص الماضي والحضارات',
            initialMessage: 'أهلاً بك! سنسافر عبر الزمن لنتعلم قصص التاريخ المشوقة.',
            targetItem: null,
            gradient: ['#ee9ca7', '#ffdde1'],
            shadowColor: '#ee9ca7'
        },
        {
            id: 'geography',
            title: 'الجغرافيا',
            icon: '🌍',
            description: 'البلدان والخرائط والطبيعة',
            initialMessage: 'مرحباً! سنستكشف اليوم العالم من حولنا ونتعلم عن البلدان والقارات.',
            targetItem: null,
            gradient: ['#a8edea', '#fed6e3'],
            shadowColor: '#a8edea'
        }
    ];

    const handleSubjectPress = (subject) => {
        navigation.navigate('SubjectLessons', {
            subject: subject
        });
    };

    return (
        <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460', '#533483']}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {/* ✨ Floating particles effect */}
            <View style={StyleSheet.absoluteFill}>
                <Animated.View 
                    style={[
                        styles.particle, 
                        { 
                            top: '15%', 
                            left: '10%',
                            transform: [{ translateY: floatAnim }]
                        }
                    ]} 
                />
                <Animated.View 
                    style={[
                        styles.particle, 
                        { 
                            top: '35%', 
                            right: '12%',
                            width: 80,
                            height: 80,
                            transform: [{ 
                                translateY: floatAnim.interpolate({
                                    inputRange: [-15, 0],
                                    outputRange: [0, -15]
                                })
                            }]
                        }
                    ]} 
                />
                <Animated.View 
                    style={[
                        styles.particle, 
                        { 
                            bottom: '25%', 
                            left: '15%',
                            width: 60,
                            height: 60,
                            transform: [{ translateY: floatAnim }]
                        }
                    ]} 
                />
            </View>

            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                        style={styles.backButtonGradient}
                    >
                        <Text style={styles.backIcon}>➡️</Text>
                    </LinearGradient>
                </TouchableOpacity>
                
                <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                    style={styles.headerTitleContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.headerTitle}>اختر مادة للتعلم</Text>
                    <Text style={styles.headerEmoji}>📚</Text>
                </LinearGradient>
            </View>

            <ScrollView 
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {subjects.map((subject, index) => (
                    <SubjectCard
                        key={subject.id}
                        subject={subject}
                        index={index}
                        onPress={() => handleSubjectPress(subject)}
                    />
                ))}
                
                <View style={styles.footer}>
                    <Text style={styles.footerText}>✨ اختر المادة التي تريد تعلمها ✨</Text>
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const SubjectCard = ({ subject, index, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pressAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                delay: index * 150,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                delay: index * 150,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(pressAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(pressAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View
            style={[
                styles.cardWrapper,
                {
                    opacity: fadeAnim,
                    transform: [
                        { scale: Animated.multiply(scaleAnim, pressAnim) },
                    ],
                },
            ]}
        >
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
            >
                <LinearGradient
                    colors={subject.gradient}
                    style={[
                        styles.card,
                        {
                            shadowColor: subject.shadowColor,
                        },
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {/* Glassmorphism overlay */}
                    <View style={styles.glassOverlay}>
                        <View style={styles.cardContent}>
                            <View style={styles.iconContainer}>
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
                                    style={styles.iconBox}
                                >
                                    <Text style={styles.icon}>{subject.icon}</Text>
                                </LinearGradient>
                            </View>
                            
                            <View style={styles.info}>
                                <Text style={styles.title}>{subject.title}</Text>
                            </View>
                            
                            <View style={styles.arrowContainer}>
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                                    style={styles.arrowBox}
                                >
                                    <Text style={styles.arrow}>👈</Text>
                                </LinearGradient>
                            </View>
                        </View>
                    </View>
                    
                    {/* Shine effect */}
                    <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.shineEffect}
                    />
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    gradientBackground: {
        flex: 1,
    },
    particle: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        gap: 12,
    },
    backButton: {
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButtonGradient: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    backIcon: { 
        fontSize: 28,
    },
    headerTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    headerEmoji: {
        fontSize: 24,
    },
    container: {
        padding: 20,
        gap: 20,
        paddingBottom: 40,
    },
    cardWrapper: {
        marginBottom: 5,
    },
    card: {
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    glassOverlay: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        padding: 20,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: 15,
    },
    iconBox: {
        width: 70,
        height: 70,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    icon: { 
        fontSize: 36,
    },
    info: { 
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    description: {
        fontSize: 15,
        color: '#ffffff',
        opacity: 0.95,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    arrowContainer: {
        marginLeft: 10,
    },
    arrowBox: {
        width: 45,
        height: 45,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrow: { 
        fontSize: 26,
    },
    shineEffect: {
        position: 'absolute',
        top: 0,
        left: -width,
        width: width,
        height: '100%',
        opacity: 0.5,
    },
    footer: {
        marginTop: 20,
        padding: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
        textAlign: 'center',
        opacity: 0.9,
    },
});

export default CurriculumScreen;
