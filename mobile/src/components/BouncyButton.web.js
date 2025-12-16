import React, { useRef } from 'react';
import { Animated, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';
import { soundService } from '../services/SoundService';

const BouncyButton = ({ onPress, children, style, soundName = 'pop' }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.95,
            useNativeDriver: false,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: false,
        }).start();
    };

    const handlePress = () => {
        if (soundName) {
            try {
                if (soundName === 'pop') soundService.playPop();
                else if (soundName === 'success') soundService.playSuccess();
                else if (soundName === 'click') soundService.playClick();
            } catch (error) {
                console.log('Sound error', error);
            }
        }
        if (onPress) onPress();
    };

    return (
        <TouchableWithoutFeedback
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
        >
            <Animated.View style={[style, { transform: [{ scale }] }]}>
                {children}
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

export default BouncyButton;
