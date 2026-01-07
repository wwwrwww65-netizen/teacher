# Tiny Teacher (المدرس الصغير) 🦁

A fun, interactive, and AI-powered educational application designed to make learning Arabic engaging for children.
Experience a magical classroom where the teacher talks to you, a smart whiteboard explains lessons, and learning feels like a game!

> **Note**: This application is built with **React Native** and features a custom **Web Simulator** (Webpack + React Native Web) for rapid development and testing without an Android emulator.

## 🚀 Build Instructions (Important)
Due to limited space on the C: drive, the Gradle cache must be redirected to `E:\.gradle`.

### Easy Way (Recommended)
Run the helper script from the project root:
```powershell
.\build_release.ps1
```

### Manual Way
If you prefer to run commands manually, always set the environment variable first:
```powershell
$env:GRADLE_USER_HOME='E:\.gradle'
cd android
.\gradlew assembleRelease
```

## � Environment & Paths Setup

To run this project smoothly, ensure your environment is configured correctly:

### 1. 📁 Critical Paths
-   **Gradle Cache**: MUST be redirected to `E:\.gradle` (due to low disk space on C:).
-   **Android SDK**: `C:\Users\lenovo\AppData\Local\Android\Sdk`
-   **ADB Tool**: Ensure `platform-tools` is in your System Path, or use the full path:
    -   `C:\Users\lenovo\AppData\Local\Android\Sdk\platform-tools\adb.exe`

### 2. 🔌 Ports & Network
-   **Metro Bundler**: Runs on port **8081**.
-   **Reverse Proxies**: React Native needs local ports reversed to the device:
    -   `adb reverse tcp:8081 tcp:8081` (For JS Bundle)
    -   `adb reverse tcp:9090 tcp:9090` (If using Reactotron)

### 3. 🛠️ Dependencies
-   **Node.js**: v18.0.0+
-   **Java JDK**: Version 17 (Required for React Native 0.73+)
-   **Python**: Version 3.10+ (For build scripts)

## �🌟 Key Features

### 🎮 Gamified UI/UX
- **Vibrant Theme**: "Electric Blue" and "Sunshine Yellow" palette with rounded, bubble-like buttons using `BouncyButton`.
- **Teacher Avatar**: A fully animated avatar (`TeacherAvatar`) that breathes, talks, and reacts emotionally (happy, thinking).
- **Immersive Classroom**: A fixed, full-screen classroom environment where the teacher stands next to a real chalkboard.
- **Gradient Cards**: Beautiful SVG-based cards for lessons and achievements.

### 🤖 AI Classroom (The Core Experience)
- **Interactive Teacher**: Chat with the teacher in Arabic using speech-to-text.
- **Smart Responses**: The teacher uses AI to generate age-appropriate responses.
- **Voice Interaction**: Full text-to-speech support (`ArabicVoiceService`) with lip-sync animation.
- **Visual Learning**: The teacher can walk to the whiteboard and "draw" shapes or letters.
- **Real-time Transcription**: See what the teacher says in a clear, white bubble at the bottom of the screen.

### 👓 Immersive & VR-Ready (Coming Soon)
- **Parallax Effect**: The classroom moves slightly as you tilt your phone or move your mouse, creating a 3D depth effect.
- **VR Mode**: Planned support for a fully immersive virtual reality mode.

### 📱 Screens
1.  **Login Screen**: Visual avatar picker (Lion, Cat, etc.) for easy child login.
2.  **Home Screen**: Dashboard showing progress, level, and quick actions.
3.  **Classroom Screen**: The main interactive space with the Teacher and Blackboard.
4.  **Profile Screen**: View achievements and collected badges.

---

## 🚀 Getting Started

### Prerequisites
- Node.js installed (v18+ recommended).
- React Native CLI environment set up (for Android/iOS).
- Python (for some build scripts).

### Installation
1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd tiny-teacher/mobile
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

---

## 🌐 Running the Web Simulator

We have configured a custom Webpack setup to run the React Native app in a web browser. This allows for fast UI iteration.

### Command
```bash
node server.js
```

### Access
Open your browser to: **[http://localhost:9091](http://localhost:9091)**

### Supported Features on Web
- **Rendering**: All screens (Login, Home, Classroom, Profile) render using `react-native-web`.
- **Navigation**: Custom navigation shim allows moving between screens.
- **Animations**: `react-native-reanimated` is fully configured.
- **Native Modules**: Key modules are **mocked** in `web/mocks.js`:
    - `react-native-tts`
    - `react-native-voice`
    - `react-native-sound-player`
    - `react-native-fs`
    - `AsyncStorage`

> **Tip**: If you see "Navigation not available" in the console, it's expected as some deep linking features are mocked.

---

## 📱 Running on Android (Advanced Guide)

### 1. Start Metro Bundler (Clear Cache)
It is highly recommended to start the bundler with cache reset to avoid styling or module graph errors:
```bash
npm start -- --reset-cache
```

### 2. Install/Run on Device
Use the gradle wrapper directly for a reliable install:
```bash
cd android
.\gradlew.bat installDebug
```

### 3. Connection Issues?
If the app cannot connect to the Metro server (Red Screen or Network Error), run this to reverse ports:
```bash
adb reverse tcp:8081 tcp:8081
```

### 4. Force Restart (If Stuck)
If the app crashes or behaves oddly, force stop it and restart:
```bash
adb shell am force-stop com.tinyteacher
adb shell monkey -p com.tinyteacher -c android.intent.category.LAUNCHER 1
```

### 5. Debugging with Logs
To see what's happening (Voice, AI, Music), use Logcat:
```bash
# Clear logs first
adb logcat -c
# View React Native Logs
adb logcat ReactNativeJS:* *:S
```

### 6. 🚇 Metro Bundler Troubleshooting
-   **Check Status**: To see if Metro is running, open `http://localhost:8081/status` in your browser. It should say "packager-status:running".
-   **Port In Use**: If you see `EADDRINUSE: address already in use :::8081`, kill the process:
    -   **Windows**: `netstat -ano | findstr :8081` then `taskkill /PID <PID> /F`
-   **Stuck/Frozen**: If Metro stops responding, simply close the terminal and run `npm start -- --reset-cache` again.

---

## 🎧 Audio & Live Mode Diagnostics

The app now features "Gemini Live"-like continuous interaction.

### ✅ Key Behaviors
1.  **Continuous Music**: Background music plays via `SoundPlayer` (Native) and stays on during speech.
2.  **No System Beep**: The annoying "Beep" sound is muted via `MainActivity.java` (System Notification Stream Muted).
3.  **Mute Button**: The microphone button acts as a **Mute Toggle** (Gray = Muted, Active = Listening).
4.  **Auto-Loop**: If you stop speaking, the app automatically retries listening.

### ⚠️ Troubleshooting Audio
-   **If Music is Too Loud**: The app tries to set volume to `0.02` (2%). If it's loud, it means `SoundPlayer` hasn't applied the volume yet. Restart the app.
-   **If App Crashes on Start**: Check for `StyleSheet` errors using `adb logcat`. Usually fixed by `npm start -- --reset-cache`.

## 🛠️ Project Structure

- `src/components`: Reusable UI components (`BouncyButton`, `GradientCard`, `TeacherAvatar`, `ChalkboardWhiteboard`).
- `src/screens`: Main application screens (`ClassroomScreen.js`, `HomeScreen.js`, etc.).
- `src/services`: Logic for AI, Voice, and Sound (`AIService`, `ArabicVoiceService`).
- `src/config`: Theme and global constants (`theme.js`).
- `web`: Webpack configuration and mocks (`mocks.js`, `index.html`) for the simulator.
- `index.web.js`: Entry point for the web simulator.

---

## 🎨 Theme System
The app uses a centralized theme in `src/config/theme.js`.
- **Primary Color**: `#4CC9F0` (Sky Blue)
- **Secondary Color**: `#FFD93D` (Yellow)
- **Accent Color**: `#FF6B6B` (Red)

---

## 📸 Snapshots

### Classroom Experience
The classroom features a fixed layout with a transparent board overlay, allowing the teacher to write "directly" on the background. The transcript text appears clearly at the bottom for readability.

---

## 🤝 Contributing
1.  Pick a task from `task.md`.
2.  Create a branch.
3.  Make your changes.
4.  Test on the Web Simulator first!
