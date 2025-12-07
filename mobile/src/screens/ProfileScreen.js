import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    StatusBar
} from 'react-native';
// import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../components/Card';
import Button from '../components/Button';
import { theme } from '../config/theme';

const ProfileScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        navigation.replace('Login');
    };

    const stats = [
        { label: 'الدروس المكتملة', value: '12', icon: '📚' },
        { label: 'الاختبارات', value: '8', icon: '🎯' },
        { label: 'الوقت المستغرق', value: '2.5 ساعة', icon: '⏱️' },
        { label: 'النجوم', value: '45', icon: '⭐' },
    ];

    const achievements = [
        { title: 'مبتدئ', description: 'أكمل أول درس', icon: '🎖️', unlocked: true },
        { title: 'متعلم سريع', description: 'أكمل 5 دروس', icon: '🚀', unlocked: true },
        { title: 'خبير الحروف', description: 'أتقن جميع الحروف', icon: '🏆', unlocked: false },
        { title: 'عبقري الأرقام', description: 'أتقن جميع الأرقام', icon: '🧮', unlocked: false },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>الملف الشخصي</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                    <Text style={styles.settingsButton}>⚙️</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card */}
                <Card style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarLarge}>
                            <Text style={styles.avatarLargeText}>{user?.avatar || '👤'}</Text>
                        </View>
                        <Text style={styles.name}>{user?.name || 'مستخدم'}</Text>
                        <Text style={styles.email}>{user?.email}</Text>

                        <View style={styles.levelBadge}>
                            <Text style={styles.levelBadgeText}>المستوى {user?.level || 1}</Text>
                        </View>

                        <View style={styles.pointsContainer}>
                            <Text style={styles.pointsLabel}>النقاط الكلية</Text>
                            <Text style={styles.pointsValue}>{user?.points || 0}</Text>
                        </View>
                    </View>
                </Card>

                {/* Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>الإحصائيات</Text>
                    <View style={styles.statsGrid}>
                        {stats.map((stat, index) => (
                            <Card key={index} style={styles.statCard}>
                                <Text style={styles.statIcon}>{stat.icon}</Text>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </Card>
                        ))}
                    </View>
                </View>

                {/* Achievements */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>الإنجازات</Text>
                    {achievements.map((achievement, index) => (
                        <Card
                            key={index}
                            style={[
                                styles.achievementCard,
                                !achievement.unlocked && styles.achievementLocked
                            ]}
                        >
                            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                            <View style={styles.achievementInfo}>
                                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                                <Text style={styles.achievementDescription}>
                                    {achievement.description}
                                </Text>
                            </View>
                            {achievement.unlocked && (
                                <Text style={styles.checkmark}>✓</Text>
                            )}
                        </Card>
                    ))}
                </View>

                {/* Logout Button */}
                <Button
                    title="تسجيل الخروج"
                    onPress={handleLogout}
                    variant="outline"
                    fullWidth
                    style={styles.logoutButton}
                />
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
    settingsButton: {
        fontSize: 24,
    },
    content: {
        flex: 1,
        padding: theme.spacing.lg,
    },
    profileCard: {
        marginBottom: theme.spacing.lg,
    },
    profileHeader: {
        alignItems: 'center',
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: theme.borderRadius.round,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
    },
    avatarLargeText: {
        fontSize: 50,
    },
    name: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    email: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
    },
    levelBadge: {
        backgroundColor: theme.colors.secondary,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.round,
        marginBottom: theme.spacing.md,
    },
    levelBadgeText: {
        color: theme.colors.textLight,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.bold,
    },
    pointsContainer: {
        alignItems: 'center',
    },
    pointsLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    pointsValue: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.primary,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    statIcon: {
        fontSize: 30,
        marginBottom: theme.spacing.sm,
    },
    statValue: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    statLabel: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    achievementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    achievementLocked: {
        opacity: 0.5,
    },
    achievementIcon: {
        fontSize: 40,
        marginRight: theme.spacing.md,
    },
    achievementInfo: {
        flex: 1,
    },
    achievementTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    achievementDescription: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    checkmark: {
        fontSize: 24,
        color: theme.colors.success,
    },
    logoutButton: {
        marginBottom: theme.spacing.xl,
    },
});

export default ProfileScreen;
