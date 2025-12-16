import React from 'react';
import { View, StyleSheet, ImageBackground, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ClassroomScene = ({ children }) => {
    return (
        <View style={styles.container}>
            {/* Background Image */}
            <ImageBackground
                source={null} // require('../../assets/classroom-bg.png')
                style={styles.background}
                resizeMode="cover"
            >
                {/* Overlay for better contrast */}
                <View style={styles.overlay} />

                {/* Content (Avatar, Whiteboard, etc.) */}
                <View style={styles.content}>
                    {children}
                </View>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.05)', // Slight darkening for better readability
    },
    content: {
        flex: 1,
        zIndex: 1,
    },
});

export default ClassroomScene;
