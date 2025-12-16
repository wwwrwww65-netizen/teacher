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

## 🌟 Key Features

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

## 📱 Running on Android

To run on a real device or Android Emulator:

1.  **Start Metro Bundler**:
    ```bash
    npx react-native start
    ```
2.  **Run on Android**:
    ```bash
    npx react-native run-android
    ```

> **Note**: Ensure you have an Android device connected or an emulator running.

---

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
