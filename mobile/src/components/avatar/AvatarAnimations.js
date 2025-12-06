import { useEffect } from 'react';
import {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';

export const useAvatarAnimations = () => {
    // Shared Values
    const bodyScale = useSharedValue(1);
    const headRotation = useSharedValue(0);
    const leftArmRotation = useSharedValue(0);
    const rightArmRotation = useSharedValue(0);
    const mouthOpenness = useSharedValue(0); // 0: closed, 1: open

    // Idle Animation
    const startIdle = () => {
        // Breathing effect
        bodyScale.value = withRepeat(
            withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );

        // Slight head bob
        headRotation.value = withRepeat(
            withSequence(
                withTiming(2, { duration: 2000 }),
                withTiming(-2, { duration: 2000 })
            ),
            -1,
            true
        );
    };

    // Talking Animation
    const startTalking = () => {
        // Random mouth movement simulation
        mouthOpenness.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 150 }),
                withTiming(0.2, { duration: 150 }),
                withTiming(0.8, { duration: 150 }),
                withTiming(0, { duration: 150 })
            ),
            -1,
            true
        );

        // Hand gestures while talking
        rightArmRotation.value = withRepeat(
            withSequence(
                withTiming(-10, { duration: 500 }),
                withTiming(0, { duration: 500 })
            ),
            -1,
            true
        );
    };

    const stopTalking = () => {
        cancelAnimation(mouthOpenness);
        mouthOpenness.value = withTiming(0, { duration: 200 });
        rightArmRotation.value = withTiming(0, { duration: 500 });
    };

    // Pointing Animation
    const pointToBoard = () => {
        rightArmRotation.value = withTiming(-45, { duration: 500, easing: Easing.bounce });
    };

    const resetPosition = () => {
        rightArmRotation.value = withTiming(0, { duration: 500 });
        leftArmRotation.value = withTiming(0, { duration: 500 });
    };

    // Animated Styles
    const bodyStyle = useAnimatedStyle(() => ({
        transform: [{ scale: bodyScale.value }]
    }));

    const headStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${headRotation.value}deg` }]
    }));

    // We return the raw shared values for rotation because we're passing them as props to the SVG components
    // which handle their own transform origin logic.

    return {
        startIdle,
        startTalking,
        stopTalking,
        pointToBoard,
        resetPosition,
        bodyStyle,
        headStyle,
        leftArmRotation,
        rightArmRotation,
        mouthOpenness
    };
};
