import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    StatusBar
} from 'react-native';
// import { StatusBar } from 'expo-status-bar';
import ClassroomScene from '../components/ClassroomScene';
import TeacherAvatar from '../components/avatar/TeacherAvatar';
import ChalkboardWhiteboard from '../components/ChalkboardWhiteboard';
import Button from '../components/Button';
import { theme } from '../config/theme';
import arabicVoiceService from '../services/ArabicVoiceService';

const LessonDetailScreen = ({ route, navigation }) => {
    const { lesson } = route.params;
    const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [feedback, setFeedback] = useState('');

    const avatarRef = useRef(null);
    const whiteboardRef = useRef(null);

    const currentTopic = lesson.topics?.[currentTopicIndex] || {};

    useEffect(() => {
        // Initialize voice service
        arabicVoiceService.initialize();
        return () => {
            arabicVoiceService.stop();
        };
    }, []);

    const handlePlay = async () => {
        if (isPlaying) return;
        setIsPlaying(true);
        setFeedback('');

        try {
            // 1. Clear board
            whiteboardRef.current?.clear();

            // 2. Avatar speaks content
            await avatarRef.current?.speakArabic(currentTopic.content);

            // 3. Point to board
            avatarRef.current?.pointToBoard();
            await new Promise(r => setTimeout(r, 500));

            // 4. Draw on board
            if (currentTopic.draw) {
                whiteboardRef.current?.write(currentTopic.draw, 2000);
                await new Promise(r => setTimeout(r, 2000));
            }

            // 5. Ask Question (Interaction)
            if (currentTopic.question) {
                await new Promise(r => setTimeout(r, 1000));
                avatarRef.current?.resetPosition();

                // Ask
                await avatarRef.current?.speakArabic(currentTopic.question);

                // Listen
                setIsListening(true);
                setFeedback('🎤 استمع إليك...');

                try {
                    const userSpeech = await arabicVoiceService.listen('ar-SA');
                    setIsListening(false);
                    setFeedback(`سمعت: "${userSpeech}"`);

                    // Validate Answer
                    const isCorrect = validateAnswer(userSpeech, currentTopic.keywords);

                    if (isCorrect) {
                        // Success
                        await avatarRef.current?.speakArabic(currentTopic.successResponse || "أحسنت! إجابة صحيحة.");
                        setFeedback('✅ إجابة صحيحة!');
                    } else {
                        // Fail
                        await avatarRef.current?.speakArabic(currentTopic.failResponse || "حاول مرة أخرى.");
                        setFeedback('❌ حاول مرة أخرى');
                    }

                } catch (error) {
                    console.log('Voice error:', error);
                    setIsListening(false);
                    await avatarRef.current?.speakArabic("لم أسمعك جيداً، هل يمكنك الإعادة؟");
                }
            }

        } catch (error) {
            console.error(error);
        } finally {
            setIsPlaying(false);
            avatarRef.current?.resetPosition();
        }
    };

    const validateAnswer = (speech, keywords) => {
        if (!speech || !keywords) return false;
        const lowerSpeech = speech.toLowerCase();
        return keywords.some(keyword => lowerSpeech.includes(keyword.toLowerCase()));
    };

    const handleNext = () => {
        if (currentTopicIndex < lesson.topics.length - 1) {
            setCurrentTopicIndex(currentTopicIndex + 1);
            whiteboardRef.current?.clear();
            setFeedback('');
        } else {
            navigation.goBack();
        }
    };

    const handlePrevious = () => {
        if (currentTopicIndex > 0) {
            setCurrentTopicIndex(currentTopicIndex - 1);
            whiteboardRef.current?.clear();
            setFeedback('');
        }
    };

    return (
        <ClassroomScene>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.lessonTitle}>{lesson.title}</Text>
                        <Text style={styles.topicProgress}>
                            {currentTopicIndex + 1} / {lesson.topics.length}
                        </Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${((currentTopicIndex + 1) / lesson.topics.length) * 100}%` }
                        ]}
                    />
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                >
                    {/* Topic Title */}
                    <Text style={styles.topicTitle}>{currentTopic.title}</Text>

                    {/* Chalkboard */}
                    <ChalkboardWhiteboard ref={whiteboardRef} />

                    {/* Teacher Avatar */}
                    <View style={styles.avatarContainer}>
                        <TeacherAvatar ref={avatarRef} />

                        {/* Feedback Bubble */}
                        {(feedback !== '' || isListening) && (
                            <View style={styles.feedbackBubble}>
                                {isListening && <ActivityIndicator size="small" color={theme.colors.primary} />}
                                <Text style={styles.feedbackText}>{feedback}</Text>
                            </View>
                        )}
                    </View>

                    {/* Content Text */}
                    <View style={styles.contentCard}>
                        <Text style={styles.contentText}>{currentTopic.content}</Text>
                        {currentTopic.question && (
                            <Text style={styles.questionText}>❓ {currentTopic.question}</Text>
                        )}
                    </View>
                </ScrollView>

                {/* Controls */}
                <View style={styles.controls}>
                    <Button
                        title="السابق"
                        onPress={handlePrevious}
                        variant="outline"
                        disabled={currentTopicIndex === 0 || isPlaying}
                        style={styles.controlButton}
                    />

                    <Button
                        title={isPlaying ? (isListening ? "أستمع..." : "جاري الشرح...") : "▶️ ابدأ الدرس"}
                        onPress={handlePlay}
                        disabled={isPlaying}
                        style={styles.playButton}
                        variant={isPlaying ? "secondary" : "primary"}
                    />

                    <Button
                        title={currentTopicIndex === lesson.topics.length - 1 ? "إنهاء" : "التالي"}
                        onPress={handleNext}
                        disabled={isPlaying}
                        style={styles.controlButton}
                    />
                </View>
            </SafeAreaView>
        </ClassroomScene>
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
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
    backButton: {
        fontSize: 30,
        color: theme.colors.text,
    },
    headerInfo: {
        flex: 1,
        alignItems: 'center',
    },
    lessonTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    topicProgress: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        marginHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.round,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: theme.spacing.xxl,
    },
    topicTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginVertical: theme.spacing.lg,
        marginHorizontal: theme.spacing.lg,
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    avatarContainer: {
        alignItems: 'center',
        marginVertical: theme.spacing.lg,
    },
    feedbackBubble: {
        position: 'absolute',
        top: -40,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        ...theme.shadows.md,
    },
    feedbackText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    contentCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.lg,
        ...theme.shadows.sm,
    },
    contentText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 10,
    },
    questionText: {
        fontSize: theme.fontSize.md,
        fontWeight: 'bold',
        color: theme.colors.primary,
        textAlign: 'center',
        marginTop: 10,
    },
    controls: {
        flexDirection: 'row',
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        ...theme.shadows.lg,
    },
    controlButton: {
        flex: 1,
    },
    playButton: {
        flex: 2,
    },
});

export default LessonDetailScreen;
