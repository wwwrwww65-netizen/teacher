import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import SmartBackground from '../components/SmartBackground';
import Card from '../components/Card';
import { theme } from '../config/theme';

const CurriculumScreen = ({ navigation }) => {
    const subjects = [
        {
            id: 'arabic',
            title: 'اللغة العربية',
            icon: '📖',
            description: 'تعلم الحروف الهجائية والقراءة',
            initialMessage: 'أهلاً بك يا بطل! اليوم سنتعلم الحروف العربية الجميلة. دعنا نبدأ بحرف الألف.',
            targetItem: 'أ',
            color: '#AED581'
        },
        {
            id: 'english',
            title: 'اللغة الإنجليزية',
            icon: '🔤',
            description: 'Learn ABCs and basic words',
            initialMessage: 'Hello! اليوم سنتعلم الحروف الإنجليزية. لنبدأ بأول حرف (A).',
            targetItem: null, // No English drawing paths yet, maybe add later? Or just skip drawing.
            color: '#4FC3F7'
        },
        {
            id: 'math',
            title: 'الأرقام والحساب',
            icon: '🔢',
            description: 'تعلم العد والأرقام الممتعة',
            initialMessage: 'مرحباً! اليوم سنتعلم الأرقام. هل تعرف كيف تعد؟ لنبدأ بالرقم واحد.',
            targetItem: '1',
            color: '#FFD54F'
        }
    ];

    const handleSubjectPress = (subject) => {
        navigation.navigate('Classroom', {
            mode: 'lesson',
            initialMessage: subject.initialMessage,
            targetItem: subject.targetItem,
            subject: subject.id
        });
    };

    return (
        <SmartBackground type="room">
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>⬅️</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>اختر مادة للتعلم 📚</Text>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                {subjects.map((subject) => (
                    <TouchableOpacity
                        key={subject.id}
                        onPress={() => handleSubjectPress(subject)}
                        activeOpacity={0.9}
                    >
                        <Card style={[styles.card, { borderLeftColor: subject.color, borderLeftWidth: 6 }]}>
                            <View style={styles.cardContent}>
                                <View style={[styles.iconBox, { backgroundColor: subject.color }]}>
                                    <Text style={styles.icon}>{subject.icon}</Text>
                                </View>
                                <View style={styles.info}>
                                    <Text style={styles.title}>{subject.title}</Text>
                                    <Text style={styles.description}>{subject.description}</Text>
                                </View>
                                <Text style={styles.arrow}>👈</Text>
                            </View>
                        </Card>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SmartBackground>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
    },
    backButton: { marginRight: 15 },
    backIcon: { fontSize: 30 },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#5D4037',
        backgroundColor: 'rgba(255,255,255,0.8)',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 15
    },
    container: {
        padding: 20,
        gap: 20
    },
    card: {
        padding: 15,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.95)',
        elevation: 4
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    icon: { fontSize: 30 },
    info: { flex: 1 },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5
    },
    description: {
        fontSize: 14,
        color: '#666'
    },
    arrow: { fontSize: 24 }
});

export default CurriculumScreen;
