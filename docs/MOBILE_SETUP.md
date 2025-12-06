# Mobile App Setup Guide

## Quick Start

```bash
cd mobile
npm install
npm start
```

## Running on Android

### Option 1: Expo Go (Easiest)

1. Install Expo Go from Google Play Store
2. Run `npm start`
3. Scan QR code with Expo Go

### Option 2: Android Emulator

1. Install Android Studio
2. Create an Android Virtual Device (AVD)
3. Run `npm run android`

### Option 3: Physical Device (USB)

1. Enable USB Debugging on your Android device
2. Connect via USB
3. Run `npm run android`

## Building APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

The APK will be available for download after build completes.

## Configuration

### API URL

Edit `mobile/src/services/api.js`:

```javascript
// For Android Emulator
const API_URL = 'http://10.0.2.2:5000/api';

// For Physical Device (use your computer's local IP)
const API_URL = 'http://192.168.1.100:5000/api';
```

To find your local IP:
- Windows: `ipconfig`
- Mac/Linux: `ifconfig`

## Features

- ✅ Native Android & iOS support
- ✅ Arabic RTL support
- ✅ Offline token storage
- ✅ Pull to refresh
- ✅ Smooth animations
- ✅ Material Design UI

## Troubleshooting

### Cannot connect to backend

1. Make sure backend is running on port 5000
2. Check firewall settings
3. Use correct IP address for physical devices

### Build fails

1. Clear cache: `expo start -c`
2. Delete node_modules: `rm -rf node_modules && npm install`
3. Check Expo version compatibility
