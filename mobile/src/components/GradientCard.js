import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { theme } from '../config/theme';
import BouncyButton from './BouncyButton';

/**
 * GradientCard
 * A card with a Linear Gradient background using SVG.
 */
const GradientCard = ({
    colors = theme.colors.gradients.primary,
    style,
    children,
    onPress,
    icon,
    title,
    subtitle,
}) => {
    // Basic ID for gradient to avoid collisions
    const gradientId = `grad-${colors.join('-')}`;

    const InnerContent = (
        <View style={styles.innerContainer}>
            <View style={StyleSheet.absoluteFill}>
                <Svg height="100%" width="100%">
                    <Defs>
                        <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0" stopColor={colors[0]} stopOpacity="1" />
                            <Stop offset="1" stopColor={colors[1]} stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} rx={theme.borderRadius.lg} ry={theme.borderRadius.lg} />
                </Svg>
            </View>

            <View style={styles.content}>
                {icon && <Text style={styles.icon}>{icon}</Text>}
                <View style={styles.textContainer}>
                    {title && <Text style={styles.title}>{title}</Text>}
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    {children}
                </View>
            </View>
        </View>
    );

    if (onPress) {
        return (
            <BouncyButton onPress={onPress} style={[styles.container, style]}>
                {InnerContent}
            </BouncyButton>
        );
    }

    return (
        <View style={[styles.container, style]}>
            {InnerContent}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: theme.borderRadius.lg,
        // ...theme.shadows.md, // SVG shadows are tricky, relying on native shadow on container
        shadowColor: theme.colors.text,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        marginBottom: theme.spacing.md,
        // Background color fallback
        backgroundColor: 'white',
    },
    innerContainer: {
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        minHeight: 120, // ensure enough height for fun cards
    },
    content: {
        padding: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        fontSize: 48,
        marginRight: theme.spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.textLight,
        marginBottom: theme.spacing.xs,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    subtitle: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        color: 'rgba(255,255,255,0.9)',
    }
});

export default GradientCard;
