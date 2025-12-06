import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G } from 'react-native-svg';
import Animated, {
    useAnimatedStyle,
    useDerivedValue,
    runOnJS,
    useAnimatedReaction
} from 'react-native-reanimated';
import Tts from 'react-native-tts';
import { AvatarParts } from './AvatarParts';
import { useAvatarAnimations } from './AvatarAnimations';

// Create a wrapper component for the whole body group to apply the breathing animation
const AnimatedG = Animated.createAnimatedComponent(G);

const Avatar = forwardRef((props, ref) => {
    const {
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
    } = useAvatarAnimations();

    const [mouthState, setMouthState] = useState('closed');

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        startIdle,
        startTalking,
        stopTalking,
        pointToBoard,
        resetPosition,
        speak: (text) => {
            // Stop any previous speech
            Tts.stop();
            // Speak new text
            Tts.speak(text);
        }
    }));

    // Initialize TTS and Animations
    useEffect(() => {
        startIdle();

        // Configure TTS
        Tts.setDefaultLanguage('en-US');
        Tts.setDefaultRate(0.5);

        // TTS Event Listeners for Lip Sync
        const onStart = Tts.addEventListener('tts-start', () => {
            startTalking();
        });
        const onFinish = Tts.addEventListener('tts-finish', () => {
            stopTalking();
        });
        const onCancel = Tts.addEventListener('tts-cancel', () => {
            stopTalking();
        });

        return () => {
            // Cleanup
            onStart.remove();
            onFinish.remove();
            onCancel.remove();
        };
    }, []);

    // Map mouth openness to discrete states for SVG switching
    useAnimatedReaction(
        () => mouthOpenness.value,
        (value) => {
            let newState = 'closed';
            if (value > 0.8) newState = 'wide';
            else if (value > 0.5) newState = 'open';
            else if (value > 0.2) newState = 'half';

            if (newState !== mouthState) {
                runOnJS(setMouthState)(newState);
            }
        },
        [mouthState]
    );

    // Arm Styles with Pivot Points
    // Left Arm Pivot: (50, 130) - Top center of the arm rect
    const leftArmStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: 50 },
            { translateY: 130 },
            { rotate: `${leftArmRotation.value}deg` },
            { translateX: -50 },
            { translateY: -130 }
        ]
    }));

    // Right Arm Pivot: (150, 130) - Top center of the arm rect
    const rightArmStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: 150 },
            { translateY: 130 },
            { rotate: `${rightArmRotation.value}deg` },
            { translateX: -150 },
            { translateY: -130 }
        ]
    }));

    return (
        <View style={styles.container}>
            <Svg width="200" height="300" viewBox="0 0 200 300">
                <AvatarParts.Shadow />
                <AvatarParts.Legs />

                {/* Animated Body Group - Moves everything attached to torso */}
                <AnimatedG style={bodyStyle}>
                    <AvatarParts.Body />

                    {/* Head is child of Body in hierarchy, but here sibling. 
              If Body scales, Head should move? 
              The pivot for body scale is center. 
              If we scale the group, everything scales.
          */}

                    <AvatarParts.Head style={headStyle} mouthState={mouthState} />

                    <AvatarParts.LeftArm style={leftArmStyle} />
                    <AvatarParts.RightArm style={rightArmStyle} />
                </AnimatedG>
            </Svg>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: 200,
        height: 300,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default Avatar;
