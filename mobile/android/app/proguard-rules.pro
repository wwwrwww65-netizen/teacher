# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.fabric.** { *; }
-keep class com.tinyteacher.** { *; }

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# React Native Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# React Native Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# React Native SVG
-keep class com.horcrux.svg.** { *; }

# React Native Sound Player
-keep class com.johnsonsu.rnsoundplayer.** { *; }

# React Native Voice
-keep class com.wenkesj.voice.** { *; }

# React Native TTS
-keep class net.no_mad.tts.** { *; }

# Axios
-keep class axios.** { *; }

# General React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.yoga.** { *; }
-keep class com.facebook.soloader.** { *; }

# OkHttp
-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**

# Okio
-keep class okio.** { *; }
-dontwarn okio.**
