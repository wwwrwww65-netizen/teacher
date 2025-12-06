import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Card from '../components/Card';
import { theme } from '../config/theme';
import { lessons } from '../data/lessons';

const LessonsScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>الدروس</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {lessons.map((lesson) => (
                    <Card
                        key={lesson.id}
                        style={styles.lessonCard}
                        onPress={() => navigation.navigate('LessonDetail', { lesson })}
                    >
                        <View style={styles.lessonContent}>
                            <Text style={styles.lessonIcon}>{lesson.icon}</Text>
                            <View style={styles.lessonInfo}>
                                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                                <Text style={styles.lessonTitleEn}>{lesson.titleEn}</Text>
                                <Text style={styles.lessonDescription}>{lesson.description}</Text>
                                <View style={styles.lessonMeta}>
                                    <Text style={styles.lessonDuration}>⏱️ {lesson.duration}</Text>
                                    <Text style={styles.lessonLevel}>
                                        {lesson.level === 'beginner' ? '🟢 مبتدئ' : '🟡 متوسط'}
                                    </Text>
                                    <Text style={styles.lessonTopics}>
                                        📝 {lesson.topics.length} موضوع
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.arrow}>→</Text>
                        </View>
                    </Card>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    backButton: {
        fontSize: 30,
        color: theme.colors.text,
    },
    title: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    content: {
        flex: 1,
        padding: theme.spacing.lg,
    },
    lessonCard: {
        marginBottom: theme.spacing.md,
    },
    lessonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lessonIcon: {
        fontSize: 50,
        marginRight: theme.spacing.md,
    },
    lessonInfo: {
        flex: 1,
    },
    lessonTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    lessonTitleEn: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    lessonDescription: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    lessonMeta: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        flexWrap: 'wrap',
    },
    lessonDuration: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
    },
    lessonLevel: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
    },
    lessonTopics: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
    },
    arrow: {
        fontSize: 24,
        color: theme.colors.textSecondary,
        marginLeft: theme.spacing.sm,
    },
});

export default LessonsScreen;
