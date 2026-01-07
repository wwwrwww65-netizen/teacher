import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle, Path, Line } from 'react-native-svg';
import { theme } from '../config/theme';

const { width, height } = Dimensions.get('window');

const SmartBackground = ({ type = 'map', children, style }) => {

    const renderMapBackground = () => (
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
            <Defs>
                <LinearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#81C784" stopOpacity="1" />
                    <Stop offset="1" stopColor="#AED581" stopOpacity="1" />
                </LinearGradient>
                <LinearGradient id="riverGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#4FC3F7" stopOpacity="1" />
                    <Stop offset="1" stopColor="#29B6F6" stopOpacity="1" />
                </LinearGradient>
            </Defs>

            {/* Base Grass */}
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#grassGrad)" />

            {/* River Stream path decoration */}
            <Path
                d={`M0,${height * 0.8} C${width / 3},${height * 0.7} ${width / 2},${height * 0.9} ${width},${height * 0.7} V${height} H0 Z`}
                fill="url(#riverGrad)"
                opacity="0.6"
            />
            <Path
                d={`M0,${height * 0.2} C${width / 2},${height * 0.1} ${width / 2},${height * 0.4} ${width},${height * 0.2} V0 H0 Z`}
                fill="#C5E1A5" // Lighter grass patches
                opacity="0.4"
            />
        </Svg>
    );

    const renderSkyBackground = () => (
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
            <Defs>
                <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#4FC3F7" stopOpacity="1" />
                    <Stop offset="1" stopColor="#E1F5FE" stopOpacity="1" />
                </LinearGradient>
                <LinearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#FFF176" stopOpacity="1" />
                    <Stop offset="1" stopColor="#FFD54F" stopOpacity="1" />
                </LinearGradient>
            </Defs>

            {/* Sky */}
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#skyGrad)" />

            {/* Sun */}
            <Circle cx={width * 0.85} cy={height * 0.1} r={40} fill="url(#sunGrad)" opacity="0.8" />

            {/* Clouds (Simple Circles) */}
            <Circle cx={width * 0.2} cy={height * 0.15} r={30} fill="white" opacity="0.8" />
            <Circle cx={width * 0.25} cy={height * 0.18} r={35} fill="white" opacity="0.8" />
            <Circle cx={width * 0.15} cy={height * 0.18} r={25} fill="white" opacity="0.8" />

            <Circle cx={width * 0.7} cy={height * 0.3} r={40} fill="white" opacity="0.6" />
            <Circle cx={width * 0.8} cy={height * 0.35} r={30} fill="white" opacity="0.6" />

            {/* Hill at bottom */}
            <Path
                d={`M0,${height} L0,${height * 0.85} Q${width / 2},${height * 0.75} ${width},${height * 0.9} V${height} Z`}
                fill="#81C784"
            />
        </Svg>
    );

    const renderRoomBackground = () => (
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
            <Defs>
                <LinearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#FFF9C4" stopOpacity="1" />
                    <Stop offset="1" stopColor="#FFF176" stopOpacity="1" />
                </LinearGradient>
                <LinearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#D7CCC8" stopOpacity="1" />
                    <Stop offset="1" stopColor="#8D6E63" stopOpacity="1" />
                </LinearGradient>
            </Defs>

            {/* Wall */}
            <Rect x="0" y="0" width="100%" height="80%" fill="url(#wallGrad)" />

            {/* Floor */}
            <Path
                d={`M0,${height * 0.8} L${width},${height * 0.8} V${height} H0 Z`}
                fill="url(#floorGrad)"
            />

            {/* Floor board lines */}
            <Line x1="0" y1={height * 0.8} x2={width} y2={height * 0.8} stroke="#8D6E63" strokeWidth="4" />
        </Svg>
    );

    const renderBackground = () => {
        switch (type) {
            case 'map': return renderMapBackground();
            case 'sky': return renderSkyBackground();
            case 'room': return renderRoomBackground();
            default: return renderSkyBackground();
        }
    };

    return (
        <View style={[styles.container, style]}>
            <View style={StyleSheet.absoluteFill}>
                {renderBackground()}
            </View>
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        // zIndex ensures content is above the absolute SVG
        zIndex: 1
    }
});

export default SmartBackground;
