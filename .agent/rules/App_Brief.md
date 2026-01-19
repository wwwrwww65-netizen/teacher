# App_Brief.md - Technical Project Summary

## 1. Project Identity
*   **App Name:** Tiny Teacher (المعلمة نورا)
*   **Package Name:** `com.tinyteacher`
*   **Description:** An interactive educational application for children featuring an AI tutor "Teacher Nora". The app leverages Generative AI (Gemini Live) for real-time conversational learning, utilizing advanced voice processing, handwriting recognition, and interactive visual aids (Chalkboard/Whiteboard) to teach Arabic, Quran, and other subjects.

## 2. Tech Stack & Key Libraries (Current Versions)
*   **Framework:** React Native `0.73.4`
*   **Core UI:** React `18.2.0`
*   **Navigation:** React Navigation (Native Stack `^6.9.17`)
*   **AI Integration:**
    *   `@anthropic-ai/sdk`: `^0.71.2`
    *   Gemini Live API (via Custom WebSocket/WebView Bridge)
*   **Audio & Voice:**
    *   `@react-native-voice/voice`: `^3.2.4` (STT/VAD)
    *   `react-native-audio-recorder-player`: `^3.6.14`
    *   `react-native-sound-player`: `^0.14.5`
    *   `react-native-tts`: `^4.1.1`
    *   `react-native-live-audio-stream`: `^1.1.1`
*   **Storage:** `@react-native-async-storage/async-storage`: `1.21.0`
*   **Network:** `axios`: `^1.13.2`
*   **Graphics/SVG:** `react-native-svg`: `14.1.0`

## 3. Environment Configuration (Android)
*   **Min SDK Version:** 23
*   **Target SDK Version:** 34
*   **Compile SDK Version:** 34
*   **Build Tools Version:** 34.0.0
*   **Kotlin Version:** 1.8.0
*   **Gradle Plugin:** 8.1.1

## 4. Architecture & Structure
The project follows a **Service-Oriented Component-Based Architecture**:
*   **`src/screens`**: Contains main functional views (e.g., `ClassroomScreen`, `DashboardScreen`, `LessonDetailScreen`). Logic is often locally managed via `useState`/`useRef` but heavily relies on shared singleton services.
*   **`src/services`**: Centralized business logic and external integrations.
    *   `AIService`: Orchestrates general AI queries and logic.
    *   `GeminiLiveService`: Manages the real-time Gemini session.
    *   `ArabicVoiceService` & `SoundService`: Handle text-to-speech and sound effects.
*   **`src/components`**: Reusable UI elements (e.g., `Teacher3D`, `ChalkboardWhiteboard`, `HandwritingModal`).
*   **`src/data`**: Static data definitions (e.g., lessons).
*   **`src/utils`**: Helper functions (e.g., `normalize` for Arabic text).

## 5. Key Integrations & Complexity
*   **Gemini Live:** Implemented using a hybrid approach. It utilizes a `LiveAudioBridge` (likely WebView-based) to handle audio streaming and communication with the Gemini Live API, bypassing limitations of the native environment for this specific API.
*   **Voice Processing:**
    *   **STT (Speech-to-Text):** Uses `@react-native-voice/voice` for recognition.
    *   **VAD (Voice Activity Detection):** Logic exists to distinguish user speech from system audio/AI speech (preventing self-talk loops), managing microphone state (`pauseMic`/`resumeMic`) dynamically via `liveAudioBridgeRef` and service instances.
*   **Arabic Language Support:** Extensive custom logic (`ArabicDiacriticsService`, `normalize` functions) to handle Arabic-specific challenges like diacritics (tashkeel), letter unification (Alef variants), and preventing character corruption in TTS and AI responses.
*   **Interactive Multimodal Triggers:** The `ClassroomScreen` implements "smart triggers" that parse the AI's textual output (or function calls) to execute actions like `drawOnBoard` (displaying visuals on the chalkboard) or `showQuiz` (opening interactive modals), linking the conversational AI directly to UI state changes.
