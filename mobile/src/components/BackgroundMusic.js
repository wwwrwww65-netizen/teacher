import React, { useEffect, useRef } from 'react';
import { View, Platform, AppState } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * BackgroundMusic Component
 * Uses a hidden WebView to play audio independently of the native SoundPlayer singleton.
 * This ensures music continues playing even when the teacher is speaking.
 */
const BackgroundMusic = ({ volume = 0.005, playing = true }) => {
    const webViewRef = useRef(null);
    const lastVolume = useRef(volume);
    const lastPlaying = useRef(playing);

    // HTML with embedded audio player - STABLE
    const html = React.useMemo(() => `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>body { background: transparent; overflow: hidden; margin: 0; padding: 0; }</style>
        </head>
        <body>
            <audio id="bgMusic" loop preload="auto">
                <source src="file:///android_asset/classroom_music.mp3" type="audio/mp3">
            </audio>
            <script>
                const audio = document.getElementById('bgMusic');
                audio.volume = ${volume};
                let shouldPlay = true;
                
                function play() { 
                    shouldPlay = true;
                    audio.play().catch(e => {
                        console.log("Play failed", e);
                    }); 
                }
                function pause() { 
                    shouldPlay = false;
                    audio.pause(); 
                }
                function setVolume(v) { 
                    audio.volume = v; 
                }

                // RESILIENCE: If the system/WebView pauses the audio (e.g. on audio focus loss during STT)
                // we force it to resume immediately if shouldPlay is still true.
                audio.addEventListener('pause', () => {
                    if (shouldPlay) {
                        requestAnimationFrame(() => {
                            if (shouldPlay) audio.play().catch(() => {});
                        });
                    }
                });

                window.onload = () => {
                   play();
                };
            </script>
        </body>
        </html>
    `, []); // Empty dependency array = NEVER changes

    // Memoize the source object to prevent WebView reloads
    const source = React.useMemo(() => ({
        html,
        baseUrl: 'file:///android_asset/'
    }), [html]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                webViewRef.current?.injectJavaScript('pause();');
            } else if (nextAppState === 'active') {
                webViewRef.current?.injectJavaScript('play();');
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        if (webViewRef.current && lastPlaying.current !== playing) {
            if (playing) {
                webViewRef.current.injectJavaScript('play();');
            } else {
                webViewRef.current.injectJavaScript('pause();');
            }
            lastPlaying.current = playing;
        }
    }, [playing]);

    useEffect(() => {
        if (webViewRef.current && volume !== lastVolume.current) {
            webViewRef.current.injectJavaScript(`setVolume(${volume});`);
            lastVolume.current = volume;
        }
    }, [volume]);

    if (Platform.OS === 'web') return null;

    return (
        <View style={{ width: 0, height: 0, position: 'absolute', top: -100, left: -100, opacity: 0 }}>
            <WebView
                ref={webViewRef}
                source={source}
                originWhitelist={['*']}
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('BackgroundMusic WebView HTTP error: ', nativeEvent);
                }}
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('BackgroundMusic WebView error: ', nativeEvent);
                }}
            />
        </View>
    );
};

export default BackgroundMusic;
