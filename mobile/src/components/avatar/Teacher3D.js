import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, AppState } from 'react-native';
import { WebView } from 'react-native-webview';

const Teacher3D = forwardRef((props, ref) => {
    const webViewRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const iframeRef = useRef(null); // For Web

    // CACHE BUSTER: Compute once on mount
    const [sourceUri] = useState(() => {
        const timestamp = Date.now();
        return Platform.OS === 'web'
            ? `classroom.html?t=${timestamp}`
            : { uri: `file:///android_asset/classroom.html?v=${timestamp}` };
    });

    // Bridge to send commands to Three.js
    const sendMessage = (type, data = {}) => {
        const payload = JSON.stringify({ type, ...data });

        if (Platform.OS === 'web') {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                // Post to iframe
                iframeRef.current.contentWindow.postMessage(JSON.stringify({ type, ...data }), '*');
            }
        } else {
            const script = `
                window.dispatchEvent(new CustomEvent('teacher-control', { 
                    detail: ${payload} 
                }));
            `;
            webViewRef.current?.injectJavaScript(script);
        }
    };

    useImperativeHandle(ref, () => ({
        startTalking: () => sendMessage('startTalking'),
        stopTalking: () => sendMessage('stopTalking'),
        setEmotion: (emotion) => sendMessage('setEmotion', { emotion }),
        laugh: () => sendMessage('playAnimation', { name: 'laugh' }),
        walkToBoard: () => sendMessage('walkToBoard'),
        walkToCenter: () => sendMessage('walkToCenter'),
        lookAtUser: () => sendMessage('lookAtUser'),
        speakVisually: (viseme) => sendMessage('viseme', { value: viseme }),
        pauseMusic: () => sendMessage('pauseMusic'),
        resumeMusic: () => sendMessage('resumeMusic')
    }));

    // Native Implementation
    useEffect(() => {
        if (Platform.OS === 'web') return;

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                console.log('📱 App backgrounded, pausing music...');
                sendMessage('pauseMusic');
            } else if (nextAppState === 'active') {
                console.log('📱 App foregrounded, resuming music...');
                sendMessage('resumeMusic');
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    if (Platform.OS === 'web') {
        useEffect(() => {
            const handleMessage = (event) => {
                try {
                    if (typeof event.data === 'string') {
                        const data = JSON.parse(event.data);
                        if (data.type === 'READY') setIsLoaded(true);
                    }
                } catch (e) { /* ignore parse error */ }
            };
            window.addEventListener('message', handleMessage);
            return () => window.removeEventListener('message', handleMessage);
        }, []);

        return (
            <View style={styles.container}>
                <iframe
                    ref={iframeRef}
                    src={sourceUri}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        background: 'transparent'
                    }}
                // onLoad={() => setIsLoaded(true)}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                style={[styles.webview, { opacity: isLoaded ? 1 : 0 }]}
                source={sourceUri}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                allowFileAccess={true}
                allowFileAccessFromFileURLs={true}
                allowingReadAccessToURL={true}
                mediaPlaybackRequiresUserAction={false} // FIX: Enable Auto-Play Audio/Video on Android
                // onLoadEnd={() => setIsLoaded(true)} // REMOVED: Wait for READY message
                onMessage={(event) => {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.type === 'LOG') console.log('ThreeJS:', data.message);
                    if (data.type === 'READY') setIsLoaded(true);
                }}
            />
            {!isLoaded && (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loading: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default Teacher3D;
