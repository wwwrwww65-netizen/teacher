import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../config/theme';

const Button = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    fullWidth = false,
    style
}) => {
    const getVariantStyle = () => {
        switch (variant) {
            case 'primary':
                return styles.primary;
            case 'secondary':
                return styles.secondary;
            case 'outline':
                return styles.outline;
            case 'ghost':
                return styles.ghost;
            default:
                return styles.primary;
        }
    };

    const getSizeStyle = () => {
        switch (size) {
            case 'sm':
                return styles.small;
            case 'md':
                return styles.medium;
            case 'lg':
                return styles.large;
            default:
                return styles.medium;
        }
    };

    const getTextStyle = () => {
        const baseStyle = [styles.text];
        if (variant === 'outline' || variant === 'ghost') {
            baseStyle.push(styles.textOutline);
        }
        if (size === 'sm') baseStyle.push(styles.textSmall);
        if (size === 'lg') baseStyle.push(styles.textLarge);
        return baseStyle;
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                getVariantStyle(),
                getSizeStyle(),
                fullWidth && styles.fullWidth,
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? '#fff' : theme.colors.primary} />
            ) : (
                <>
                    {icon && <>{icon}</>}
                    <Text style={getTextStyle()}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.borderRadius.md,
        gap: theme.spacing.sm,
    },
    primary: {
        backgroundColor: theme.colors.primary,
    },
    secondary: {
        backgroundColor: theme.colors.secondary,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    small: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
    },
    medium: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
    },
    large: {
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
    },
    text: {
        color: theme.colors.textLight,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
    },
    textOutline: {
        color: theme.colors.primary,
    },
    textSmall: {
        fontSize: theme.fontSize.sm,
    },
    textLarge: {
        fontSize: theme.fontSize.lg,
    },
    disabled: {
        opacity: 0.5,
    },
    fullWidth: {
        width: '100%',
    },
});

export default Button;
