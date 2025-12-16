import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { theme } from '../config/theme';
import { soundService } from '../services/SoundService';

/**
 * BouncyButton
 * A button that scales down when pressed and plays a sound.
 * Replaces standard TouchableOpacity for main actions.
 */
const BouncyButton = ({
    onPress,
    style,
    children,
    scaleTo = 0.95,
    soundName = 'pop',
    disabled = false,
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        if (disabled) return;
        scale.value = withSpring(scaleTo, {
            damping: 15,
            stiffness: 300,
        });
        soundService.play(soundName);
    };

    const handlePressOut = () => {
        if (disabled) return;
        scale.value = withSpring(1, {
            damping: 15,
            stiffness: 300,
        });
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1} // Disable default opacity change, we use scale
            disabled={disabled}
            style={[styles.wrapper, style]}
        >
            <Animated.View style={[styles.content, animatedStyle]}>
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        // No default styles
    },
    content: {
        // Ensure content can be animated
    }
});

export default BouncyButton;
