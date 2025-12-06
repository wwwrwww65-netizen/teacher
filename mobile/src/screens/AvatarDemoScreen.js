import React, { useRef } from 'react';
import { View, StyleSheet, Button, Text } from 'react-native';
import Avatar from '../components/avatar/Avatar';

const AvatarDemoScreen = () => {
    const avatarRef = useRef(null);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Tiny Teacher Avatar Demo</Text>

            <View style={styles.avatarContainer}>
                <Avatar ref={avatarRef} />
            </View>

            <View style={styles.controls}>
                <View style={styles.row}>
                    <Button title="Idle" onPress={() => avatarRef.current?.startIdle()} />
                    <Button title="Talk" onPress={() => avatarRef.current?.speak("Hello children! Today we will learn about numbers.")} />
                </View>
                <View style={styles.row}>
                    <Button title="Point" onPress={() => avatarRef.current?.pointToBoard()} />
                    <Button title="Reset" onPress={() => avatarRef.current?.resetPosition()} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f8ff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#2c3e50',
    },
    avatarContainer: {
        marginBottom: 50,
    },
    controls: {
        width: '100%',
        gap: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
});

export default AvatarDemoScreen;
