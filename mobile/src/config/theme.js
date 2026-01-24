export const theme = {
    colors: {
        // Primary Colors (Vibrant & Playful)
        primary: '#4CC9F0',      // Electric Blue
        primaryDark: '#3A9FD1',
        primaryLight: '#8DE1F8',

        // Secondary Colors (Warm & Inviting)
        secondary: '#FFD93D',    // Sunshine Yellow
        secondaryDark: '#E6C22C',
        secondaryLight: '#FFE570',

        // Accent Colors (For fun elements)
        accent: '#FF6B6B',       // Candy Apple Red
        purple: '#9B72F2',       // Fun Purple
        green: '#6BCB77',        // Fresh Green

        // Success & Error
        success: '#6BCB77',
        error: '#FF6B6B',
        warning: '#FFD93D',
        info: '#4CC9F0',

        // Backgrounds
        background: '#F7F9FC',   // Very light cool gray
        backgroundAlt: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceDark: '#252A3F',

        // Text
        text: '#2D3436',         // Soft Black
        textSecondary: '#636E72',
        textLight: '#FFFFFF',
        textDark: '#2D3436',

        // Borders & Dividers
        border: '#DFE6E9',
        divider: '#F1F2F6',

        // Special
        overlay: 'rgba(0, 0, 0, 0.5)',
        shadow: 'rgba(0, 0, 0, 0.1)',

        // Gradients (Start/End pairs for react-native-svg)
        gradients: {
            primary: ['#4CC9F0', '#4895EF'],
            secondary: ['#FFD93D', '#F9C449'],
            accent: ['#FF6B6B', '#EE5253'],
            purple: ['#9B72F2', '#8344E0'],
            green: ['#6BCB77', '#4DAD49'],
        }
    },

    spacing: {
        xs: 6,
        sm: 12,
        md: 18,
        lg: 24,
        xl: 32,
        xxl: 50,
    },

    borderRadius: {
        sm: 12,
        md: 18,
        lg: 24,
        xl: 32,
        round: 999,
        blob: 40, // For "blob" shape UI elements
    },

    fontSize: {
        xs: 14,
        sm: 16,
        md: 18,
        lg: 22,
        xl: 28,
        xxl: 36,
        xxxl: 48,
    },

    fontWeight: {
        regular: '400',
        medium: '600', // Bumped up legibility
        semibold: '700',
        bold: '800',   // Extra chunky
    },

    shadows: {
        sm: {
            shadowColor: '#4CC9F0',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 3,
        },
        md: {
            shadowColor: '#2D3436',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 6,
        },
        lg: {
            shadowColor: '#4CC9F0',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.2,
            shadowRadius: 24,
            elevation: 10,
        },
        // Specialized "Game" shadow for buttons
        button: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 0, // Hard shadow for 3D feel
            elevation: 4,
        }
    },
    
    fonts: {
        regular: 'Almarai', // Changed from Almarai-Regular
        bold: 'Almarai',
        extraBold: 'Almarai',
    },
};
