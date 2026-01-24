import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const CustomAlert = ({ visible, title, message, onCancel, onConfirm, confirmText = 'موافق', cancelText = 'إلغاء', icon = 'alert-circle', singleButton = false }) => {
    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <TouchableWithoutFeedback onPress={onCancel}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.alertContainer}>
                            <View style={styles.iconContainer}>
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    style={styles.iconGradient}
                                >
                                    <Ionicons name={icon} size={32} color="#FFF" />
                                </LinearGradient>
                            </View>

                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.message}>{message}</Text>

                            <View style={styles.buttonContainer}>
                                {!singleButton && (
                                    <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                                        <Text style={styles.cancelText}>{cancelText}</Text>
                                    </TouchableOpacity>
                                )}
                                
                                <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                                    <LinearGradient
                                        colors={['#4ECDC4', '#44A08D']}
                                        style={styles.confirmGradient}
                                    >
                                        <Text style={styles.confirmText}>{confirmText}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    alertContainer: {
        width: width * 0.85,
        backgroundColor: '#FFF',
        borderRadius: 25,
        padding: 25,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    iconContainer: {
        marginBottom: 15,
        marginTop: -10,
    },
    iconGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 15,
        width: '100%',
        justifyContent: 'center',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 15,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#888',
    },
    confirmButton: {
        flex: 1,
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 3,
    },
    confirmGradient: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
});

export default CustomAlert;
