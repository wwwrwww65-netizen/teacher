import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming, 
    withSequence,
    withDelay
} from 'react-native-reanimated';
import { theme } from '../config/theme';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
    // Animation Values
    const logoScale = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const subTextOpacity = useSharedValue(0);
    const bgScale = useSharedValue(1);

    useEffect(() => {
        // 1. Logo Pop
        logoScale.value = withSpring(1, { damping: 10, stiffness: 100 });

        // 2. Text Fade In
        textOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
        subTextOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }));

        // 3. Navigate away after delay
        const timer = setTimeout(() => {
            // Check auth state via App.js logic usually, but here we just pass control
            navigation.replace('AuthCheck'); 
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const animatedLogoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }]
    }));

    const animatedTextStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: withTiming(textOpacity.value === 1 ? 0 : 20, { duration: 500 }) }]
    }));

     const animatedSubTextStyle = useAnimatedStyle(() => ({
        opacity: subTextOpacity.value
    }));

    return (
        <View style={styles.container}>
             {/* 🏜️ Warm Beige & Light Brown Gradient */}
             <LinearGradient
                colors={['#FFF8F0', '#E6CBA8']} // Cream to Warm Beige/Sand
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            
            {/* 🍂 Subtle Golden/Brown Glows */}
            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />
            <View style={[styles.circle, styles.circle3]} />

            <View style={styles.content}>
                <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
                    <Image 
                        source={require('../assets/splash_logo.png')} 
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </Animated.View>

                <Animated.View style={animatedTextStyle}>
                    <Text style={styles.title}>المعلمة نورا</Text>
                </Animated.View>

                <Animated.View style={animatedSubTextStyle}>
                    <Text style={styles.subtitle}>رفيقتك الذكية في رحلة التعلم</Text>
                </Animated.View>
            </View>
            
            <View style={styles.footer}>
                <Text style={styles.footerText}>Produced by Hash Jeeey</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5E6D3', // Fallback Beige
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    logoContainer: {
        width: 400,
        height: 400,
        marginBottom: 40,
        backgroundColor: 'transparent',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold', 
        color: '#5D4037', 
        marginBottom: 12,
        fontFamily: 'Almarai', // Updated to use our new global font
        textShadowColor: 'rgba(255, 255, 255, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 20,
        color: '#8D6E63', 
        fontWeight: '600',
        letterSpacing: 1,
        fontFamily: 'Almarai', // Updated to use our new global font
    },
    circle: {
        // ... (rest of styles remain unchanged)
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: '#FFFFFF',
    },
    circle1: {
        width: width * 1.2,
        height: width * 1.2,
        backgroundColor: '#D7CCC8', 
        opacity: 0.3,
        top: -width * 0.5,
        right: -width * 0.3,
    },
    circle2: {
        width: width * 0.9,
        height: width * 0.9,
        backgroundColor: '#FFF8E1', 
        opacity: 0.5,
        bottom: -width * 0.3,
        left: -width * 0.2,
    },
    circle3: {
        width: width * 0.4,
        height: width * 0.4,
        backgroundColor: '#8D6E63', 
        opacity: 0.1,
        top: height * 0.3,
        left: -width * 0.1,
    },
    footer: {
        position: 'absolute',
        bottom: 50,
    },
    footerText: {
        color: '#5D4037', // Slightly darker for better readability
        fontSize: 16,     // Slightly larger
        fontWeight: 'bold',
        letterSpacing: 1.5,
        opacity: 0.9,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', // Signature style font
        textTransform: 'uppercase'
    }
});

export default SplashScreen;
