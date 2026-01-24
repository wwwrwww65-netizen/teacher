import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    Modal,
    TextInput,
    Alert,
    Image, // Added Image import
    KeyboardAvoidingView, // Added for keyboard handling
    Platform // Added for platform check
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker'; // Added Image Picker
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { curriculumSearchService } from '../services/CurriculumSearchService';
import { firebaseService } from '../services/FirebaseService';

const { width } = Dimensions.get('window');

const SubjectLessonsScreen = ({ route, navigation }) => {
    const { subject } = route.params;
    const [lessons, setLessons] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonDescription, setNewLessonDescription] = useState('');
    const [lessonType, setLessonType] = useState('curriculum'); // 'curriculum' or 'custom'
    const [isSearching, setIsSearching] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [lessonImages, setLessonImages] = useState([]); // 📸 State for selected images (Array)

    const handleImagePick = async (type) => {
        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 1024,
            maxWidth: 1024,
            quality: 0.8,
            selectionLimit: 0, // 0 means unlimited (for gallery)
        };

        const callback = (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorCode) {
                console.log('ImagePicker Error: ', response.errorMessage);
                Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة');
            } else if (response.assets && response.assets.length > 0) {
                // Append new images to existing list
                setLessonImages(prev => [...prev, ...response.assets]);
                // If user picks an image, default to 'custom' type
                setLessonType('custom'); 
            }
        };

        if (type === 'camera') {
            launchCamera(options, callback);
        } else {
            launchImageLibrary(options, callback);
        }
    };
    
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadLessons();
        loadUserProfile();
        
        // Float animation for particles
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
    }, [subject.id]);

    const loadUserProfile = async () => {
        try {
            const profile = await firebaseService.getStudentData();
            setUserProfile(profile);
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    };

    const loadLessons = async () => {
        try {
            const storedLessons = await AsyncStorage.getItem(`lessons_${subject.id}`);
            if (storedLessons) {
                setLessons(JSON.parse(storedLessons));
            } else {
                // Default lessons for each subject
                setLessons([]);
            }
        } catch (error) {
            console.error('Error loading lessons:', error);
        }
    };

    const saveLessons = async (updatedLessons) => {
        try {
            await AsyncStorage.setItem(`lessons_${subject.id}`, JSON.stringify(updatedLessons));
            setLessons(updatedLessons);
        } catch (error) {
            console.error('Error saving lessons:', error);
        }
    };

    const handleCreateLesson = async () => {
        if (!newLessonTitle.trim()) {
            Alert.alert('تنبيه', 'الرجاء إدخال عنوان الدرس');
            return;
        }

        const newLesson = {
            id: Date.now().toString(),
            title: newLessonTitle.trim(),
            description: newLessonDescription.trim() || 'درس جديد',
            createdAt: new Date().toISOString(),
            completed: false,
            type: lessonType,
            images: lessonImages.length > 0 ? lessonImages.map(img => img.uri) : [] // 📸 Save images array
        };

        // أولوية 1: إذا كان هناك صور، نقوم بتحليلها أولاً (VISION)
        if (lessonImages.length > 0) {
            setIsSearching(true);
            try {
                console.log('📸 Starting Vision Analysis...');
                const imageUris = lessonImages.map(img => img.uri);
                const analysisResult = await curriculumSearchService.analyzeImages(imageUris, newLesson.title);

                if (analysisResult.success) {
                    newLesson.curriculumContent = analysisResult.content;
                    newLesson.searchStrategy = analysisResult.searchStrategy;
                    console.log('✅ Vision Analysis completed');
                    
                    Alert.alert('تم التحليل! 👁️', 'تم استخراج محتوى الدرس من الصور بنجاح.');
                } else {
                    console.warn('⚠️ Vision Analysis failed:', analysisResult.error);
                    Alert.alert('تنبيه', 'فشل تحليل الصور، سيتم حفظ الدرس بالصور فقط.');
                }
            } catch (error) {
                console.error('❌ Vision Error:', error);
            }
            setIsSearching(false);
            saveNewLesson(newLesson);
            return;
        }

        // أولوية 2: إذا كان نوع الدرس "منهج دراسي" ولا توجد صور، نبحث في المنهج (TEXT)
        if (lessonType === 'curriculum') {
            setIsSearching(true);
            
            try {
                console.log('🔍 Starting curriculum search...');
                
                const searchResult = await curriculumSearchService.searchCurriculum({
                    lessonTitle: newLesson.title,
                    lessonDescription: newLesson.description,
                    country: userProfile?.country || 'غير محدد',
                    grade: userProfile?.grade || 'الصف الأول',
                    subject: subject.id
                });

                if (searchResult.success) {
                    newLesson.curriculumContent = searchResult.content;
                    newLesson.sources = searchResult.sources;
                    newLesson.searchStrategy = searchResult.searchStrategy;
                    
                    console.log('✅ Curriculum content fetched successfully');
                    
                    Alert.alert(
                        'تم! ✅',
                        `تم جلب محتوى الدرس من ${searchResult.searchStrategy.name}`,
                        [{ text: 'حسناً' }]
                    );
                } else {
                    console.warn('⚠️ Curriculum search failed:', searchResult.error);
                    
                    Alert.alert(
                        'تنبيه',
                        'لم نتمكن من جلب المحتوى من المنهج. سيتم إنشاء درس مخصص بناءً على الوصف.',
                        [
                            { text: 'إلغاء', style: 'cancel', onPress: () => {
                                setIsSearching(false);
                                return;
                            }},
                            { text: 'متابعة', onPress: () => {
                                newLesson.type = 'custom';
                                saveNewLesson(newLesson);
                            }}
                        ]
                    );
                    setIsSearching(false);
                    return;
                }
            } catch (error) {
                console.error('❌ Error searching curriculum:', error);
                Alert.alert('خطأ', 'حدث خطأ أثناء البحث في المنهج');
                setIsSearching(false);
                return;
            }
            
            setIsSearching(false);
        }

        saveNewLesson(newLesson);
    };

    const saveNewLesson = (newLesson) => {
        const updatedLessons = [...lessons, newLesson];
        saveLessons(updatedLessons);
        
        setNewLessonTitle('');
        setNewLessonDescription('');
        setLessonType('curriculum');
        setLessonImages([]); // Reset images
        setShowCreateModal(false);
        
        if (newLesson.type === 'custom') {
            Alert.alert('تم!', 'تم إنشاء درس مخصص ✨');
        }
    };

    const handleLessonPress = (lesson) => {
        navigation.navigate('Classroom', {
            mode: 'lesson',
            // تمرير عنوان الدرس
            lessonTitle: lesson.title,
            // تمرير نوع الدرس (curriculum / custom)
            lessonType: lesson.type,
            // تمرير محتوى المنهج المحفوظ (مهم جداً!)
            curriculumContent: lesson.curriculumContent,
            initialMessage: `مرحباً! سنبدأ الآن درس "${lesson.title}". ${subject.initialMessage}`,
            targetItem: subject.targetItem,
            subject: subject.id,
            lessonId: lesson.id,
            lessonImages: lesson.images || (lesson.image ? [lesson.image] : []) // 📸 Pass images array (fallback for old lessons)
        });
    };

    const handleDeleteLesson = (lessonId) => {
        Alert.alert(
            'حذف الدرس',
            'هل أنت متأكد من حذف هذا الدرس؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: () => {
                        const updatedLessons = lessons.filter(l => l.id !== lessonId);
                        saveLessons(updatedLessons);
                    }
                }
            ]
        );
    };

    return (
        <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460', '#533483']}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {/* Floating particles */}
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
            </View>

            {/* Header */}
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
                    colors={subject.gradient}
                    style={styles.headerTitleContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.headerIcon}>{subject.icon}</Text>
                    <Text style={styles.headerTitle}>   {subject.title}   </Text>
                </LinearGradient>
            </View>

            <ScrollView 
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Create Lesson Button */}
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => setShowCreateModal(true)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#4facfe', '#00f2fe']}
                        style={styles.createButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="add-circle" size={28} color="#fff" />
                        <Text style={styles.createButtonText}>إنشاء درس جديد   </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Lessons List */}
                <View style={styles.lessonsContainer}>
                    <Text style={styles.sectionTitle}>
                        {lessons.length > 0 ? `الدروس (${lessons.length})` : 'لا توجد دروس بعد'}
                    </Text>
                    
                    {lessons.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📚</Text>
                            <Text style={styles.emptyText}>ابدأ بإنشاء درسك الأول!</Text>
                            <Text style={styles.emptySubtext}>اضغط على زر "إنشاء درس جديد" أعلاه</Text>
                        </View>
                    ) : (
                        lessons.map((lesson, index) => (
                            <LessonCard
                                key={lesson.id}
                                lesson={lesson}
                                index={index}
                                gradient={subject.gradient}
                                onPress={() => handleLessonPress(lesson)}
                                onDelete={() => handleDeleteLesson(lesson.id)}
                            />
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Create Lesson Modal */}
            <Modal
                visible={showCreateModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView contentContainerStyle={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled">
                        <LinearGradient
                            colors={['#2c3e50', '#34495e']}
                            style={styles.modalGradient}
                        >
                            <Text style={styles.modalTitle}>إنشاء درس جديد ✨   </Text>
                            
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>عنوان الدرس *   </Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="مثال: الحروف الأبجدية"
                                    placeholderTextColor="#999"
                                    value={newLessonTitle}
                                    onChangeText={setNewLessonTitle}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>وصف الدرس (اختياري)</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="وصف مختصر للدرس..."
                                    placeholderTextColor="#999"
                                    value={newLessonDescription}
                                    onChangeText={setNewLessonDescription}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            {/* Lesson Type Selection */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>نوع الدرس</Text>
                                
                                <TouchableOpacity
                                    style={[
                                        styles.lessonTypeOption,
                                        lessonType === 'curriculum' && styles.lessonTypeSelected
                                    ]}
                                    onPress={() => setLessonType('curriculum')}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.radioButton}>
                                        {lessonType === 'curriculum' && (
                                            <View style={styles.radioButtonInner} />
                                        )}
                                    </View>
                                    <View style={styles.lessonTypeContent}>
                                        <Text style={styles.lessonTypeTitle}>📚 المنهج الدراسي</Text>
                                        <Text style={styles.lessonTypeDesc}>بحث تلقائي في المنهج الرسمي</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.lessonTypeOption,
                                        lessonType === 'custom' && styles.lessonTypeSelected
                                    ]}
                                    onPress={() => setLessonType('custom')}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.radioButton}>
                                        {lessonType === 'custom' && (
                                            <View style={styles.radioButtonInner} />
                                        )}
                                    </View>
                                    <View style={styles.lessonTypeContent}>
                                        <Text style={styles.lessonTypeTitle}>✏️ مخصص</Text>
                                        <Text style={styles.lessonTypeDesc}>بناءً على الوصف أو صورة</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* 📸 Image Upload Section (New) */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>صورة الدرس (اختياري)</Text>
                                <Text style={styles.inputSubLabel}>صور صفحات من الكتاب أو أوراق العمل</Text>
                                
                                {/* 📸 Images List */}
                                {lessonImages.length > 0 && (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesList}>
                                        {lessonImages.map((img, index) => (
                                            <View key={index} style={styles.imageSnippet}>
                                                <Image source={{ uri: img.uri }} style={styles.imageSnippetPreview} />
                                                <TouchableOpacity 
                                                    style={styles.removeSnippetButton}
                                                    onPress={() => {
                                                        const newImages = [...lessonImages];
                                                        newImages.splice(index, 1);
                                                        setLessonImages(newImages);
                                                    }}
                                                >
                                                    <Ionicons name="close-circle" size={20} color="#ff6b6b" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>
                                )}

                                {/* Buttons - Always visible to add more */}
                                <View style={styles.imageButtonsRow}>
                                    <TouchableOpacity 
                                        style={styles.imageButton}
                                        onPress={() => handleImagePick('camera')}
                                    >
                                        <LinearGradient
                                            colors={['#FF9A9E', '#FECFEF']}
                                            style={styles.imageButtonGradient}
                                        >
                                            <Ionicons name="camera" size={20} color="#fff" />
                                            <Text style={styles.imageButtonText}>الكاميرا</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={styles.imageButton}
                                        onPress={() => handleImagePick('gallery')}
                                    >
                                        <LinearGradient
                                            colors={['#a18cd1', '#fbc2eb']}
                                            style={styles.imageButtonGradient}
                                        >
                                            <Ionicons name="images" size={20} color="#fff" />
                                            <Text style={styles.imageButtonText}>المعرض</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => {
                                        setShowCreateModal(false);
                                        setNewLessonTitle('');
                                        setNewLessonDescription('');
                                        setLessonType('curriculum');
                                        setLessonImage(null);
                                    }}
                                    disabled={isSearching}
                                >
                                    <Text style={styles.cancelButtonText}>إلغاء</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.confirmButton]}
                                    onPress={handleCreateLesson}
                                    disabled={isSearching}
                                >
                                    <LinearGradient
                                        colors={isSearching ? ['#95a5a6', '#7f8c8d'] : ['#4facfe', '#00f2fe']}
                                        style={styles.confirmButtonGradient}
                                    >
                                        {isSearching ? (
                                            <View style={styles.searchingContainer}>
                                                <Text style={styles.confirmButtonText}>جاري البحث...</Text>
                                            </View>
                                        ) : (
                                            <Text style={styles.confirmButtonText}>إنشاء</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
};

const LessonCard = ({ lesson, index, gradient, onPress, onDelete }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                delay: index * 100,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                delay: index * 100,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.lessonCard,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.9}
                style={{ flex: 1 }}
            >
                <LinearGradient
                    colors={gradient}
                    style={styles.lessonCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.lessonCardOverlay}>
                        <View style={styles.lessonCardContent}>
                            <View style={styles.lessonInfo}>
                                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                                {lesson.description && (
                                    <Text style={styles.lessonDescription} numberOfLines={2}>
                                        {lesson.description}
                                    </Text>
                                )}
                                <Text style={styles.lessonDate}>
                                    📅 {new Date(lesson.createdAt).toLocaleDateString('ar-EG')}
                                </Text>
                            </View>
                            
                            <View style={styles.lessonActions}>
                                <TouchableOpacity
                                    onPress={onDelete}
                                    style={styles.deleteButton}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                                </TouchableOpacity>
                                <Ionicons name="chevron-back" size={24} color="#fff" />
                            </View>
                        </View>
                    </View>
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
        shadowOpacity: 0.3,
        shadowRadius: 4,
        gap: 10,
    },
    headerIcon: {
        fontSize: 28,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        flexShrink: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    createButton: {
        marginBottom: 25,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#4facfe',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
    },
    createButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 10,
    },
    createButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    lessonsContainer: {
        gap: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 15,
        textAlign: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 80,
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
    },
    lessonCard: {
        marginBottom: 15,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    lessonCardGradient: {
        borderRadius: 20,
    },
    lessonCardOverlay: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        padding: 16,
    },
    lessonCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    lessonInfo: {
        flex: 1,
    },
    lessonTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 6,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    lessonDescription: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 8,
    },
    lessonDate: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    lessonActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    deleteButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 10,
    },
    modalGradient: {
        padding: 25,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 25,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: '#ffffff',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    cancelButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        paddingVertical: 14,
    },
    confirmButton: {
        elevation: 3,
    },
    confirmButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    lessonTypeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    lessonTypeSelected: {
        backgroundColor: 'rgba(79, 172, 254, 0.2)',
        borderColor: '#4facfe',
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ffffff',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4facfe',
    },
    lessonTypeContent: {
        flex: 1,
    },
    lessonTypeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    lessonTypeDesc: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
    },
    searchingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // 📸 Image Picker Styles
    inputSubLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 10,
        marginTop: -5,
    },
    imageButtonsRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 10,
    },
    imageButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
    },
    imageButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    imageButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    imagePreviewContainer: {
        width: '100%',
        height: 150, // Reduced height
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 15,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeImageButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    imageName: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 8,
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
    },
    // New Styles for Multiple Images
    imagesList: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    imageSnippet: {
        width: 100,
        height: 100, // Small square snippet
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 10,
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    imageSnippetPreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeSnippetButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
});

export default SubjectLessonsScreen;
