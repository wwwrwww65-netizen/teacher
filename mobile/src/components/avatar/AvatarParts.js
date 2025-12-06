import React from 'react';
import Svg, { Path, Circle, Rect, G, Ellipse } from 'react-native-svg';
import Animated from 'react-native-reanimated';

// Create Animated components for SVG elements
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

export const AvatarParts = {
    // Shadow
    Shadow: ({ style }) => (
        <AnimatedG style={style}>
            <Ellipse cx="100" cy="280" rx="60" ry="10" fill="rgba(0,0,0,0.2)" />
        </AnimatedG>
    ),

    // Legs
    Legs: ({ style }) => (
        <AnimatedG style={style}>
            {/* Left Leg */}
            <Rect x="70" y="200" width="20" height="60" rx="10" fill="#2c3e50" />
            <Path d="M70 260 L90 260 L95 270 L65 270 Z" fill="#34495e" /> {/* Foot */}

            {/* Right Leg */}
            <Rect x="110" y="200" width="20" height="60" rx="10" fill="#2c3e50" />
            <Path d="M110 260 L130 260 L135 270 L105 270 Z" fill="#34495e" /> {/* Foot */}
        </AnimatedG>
    ),

    // Body (Torso)
    Body: ({ style }) => (
        <AnimatedG style={style}>
            {/* Main Body */}
            <Rect x="60" y="120" width="80" height="90" rx="15" fill="#3498db" />
            {/* Belly Patch */}
            <Rect x="75" y="135" width="50" height="60" rx="10" fill="#ecf0f1" />
            {/* Buttons/Details */}
            <Circle cx="100" cy="150" r="3" fill="#e74c3c" />
            <Circle cx="100" cy="165" r="3" fill="#f1c40f" />
        </AnimatedG>
    ),

    // Arms
    LeftArm: ({ style }) => (
        <AnimatedG style={style}>
            <Rect x="40" y="130" width="20" height="70" rx="10" fill="#3498db" />
            <Circle cx="50" cy="200" r="12" fill="#ecf0f1" /> {/* Hand */}
        </AnimatedG>
    ),

    RightArm: ({ style }) => (
        <AnimatedG style={style}>
            <Rect x="140" y="130" width="20" height="70" rx="10" fill="#3498db" />
            <Circle cx="150" cy="200" r="12" fill="#ecf0f1" /> {/* Hand */}
        </AnimatedG>
    ),

    // Head
    Head: ({ style, mouthState = 'closed' }) => (
        <AnimatedG style={style}>
            {/* Neck */}
            <Rect x="90" y="110" width="20" height="15" fill="#bdc3c7" />

            {/* Face Shape */}
            <Rect x="60" y="40" width="80" height="75" rx="20" fill="#3498db" />

            {/* Screen/Face Area */}
            <Rect x="70" y="50" width="60" height="55" rx="10" fill="#ecf0f1" />

            {/* Eyes */}
            <G>
                {/* Left Eye */}
                <Circle cx="85" cy="70" r="8" fill="white" stroke="#2c3e50" strokeWidth="2" />
                <Circle cx="85" cy="70" r="3" fill="black" />

                {/* Right Eye */}
                <Circle cx="115" cy="70" r="8" fill="white" stroke="#2c3e50" strokeWidth="2" />
                <Circle cx="115" cy="70" r="3" fill="black" />

                {/* Glasses (Optional) */}
                <Path d="M75 70 L95 70 M105 70 L125 70 M95 70 Q100 65 105 70" stroke="#2c3e50" strokeWidth="2" fill="none" />
            </G>

            {/* Mouth - Dynamic based on state */}
            <Mouth state={mouthState} />
        </AnimatedG>
    ),
};

const Mouth = ({ state }) => {
    // Simple mouth shapes
    switch (state) {
        case 'open':
            return <Circle cx="100" cy="90" r="8" fill="#e74c3c" />;
        case 'wide':
            return <Ellipse cx="100" cy="90" rx="10" ry="5" fill="#e74c3c" />;
        case 'half':
            return <Path d="M92 90 Q100 95 108 90" stroke="#e74c3c" strokeWidth="3" fill="none" />;
        case 'closed':
        default:
            return <Path d="M92 90 Q100 95 108 90" stroke="#2c3e50" strokeWidth="2" fill="none" />;
    }
};
