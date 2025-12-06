import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../config/theme';

const Card = ({ children, title, subtitle, onPress, style }) => {
    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container
            style={[styles.card, style]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            {(title || subtitle) && (
                <View style={styles.header}>
                    {title && <Text style={styles.title}>{title}</Text>}
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
            )}
            {children}
        </Container>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        ...theme.shadows.md,
    },
    header: {
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
});

export default Card;
