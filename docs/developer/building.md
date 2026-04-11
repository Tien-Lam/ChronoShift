# Building

## Prerequisites

- **Android Studio** (any recent version with bundled JBR 21)
- **Android SDK** (installed via Android Studio SDK Manager)
  - Compile SDK 35, Min SDK 26

Java and Gradle do **not** need to be installed separately. The project uses the Gradle wrapper (`gradlew`) and Android Studio's bundled JBR.

## Environment

The build requires two environment variables because neither Java nor Gradle is on PATH:

```bash
export JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"
export ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"
```

Set these before every Gradle command, or add them to your shell profile.

## Build Commands

```bash
# Debug APK
./gradlew assembleDebug

# Release APK (uses debug signing by default)
./gradlew assembleRelease

# Run unit tests
./gradlew testDebugUnitTest
```

The debug APK is written to `app/build/outputs/apk/debug/app-debug.apk`.

## CI

GitHub Actions runs unit tests on every push to `main` and on pull requests. The workflow uses JetBrains JDK 21 (required by Kotlin 2.2 + AGP 9.1).

Releases are triggered by pushing a version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

This runs tests, builds a release APK, and creates a GitHub Release with the APK attached.

## Project Structure

Single-module app. All source code lives under `app/`:

```
app/
  src/main/
    assets/chrono.js          # Bundled chrono-node (251KB, esbuild)
    java/com/chronoshift/
      MainActivity.kt         # Compose entry point
      ProcessTextActivity.kt  # ACTION_PROCESS_TEXT handler
      conversion/             # TimeConverter, data classes
      di/                     # Hilt modules and qualifiers
      nlp/                    # NLP pipeline (extractors, parsers, merger)
      ui/                     # Compose screens, theme, components
    res/                      # Android resources
  src/test/                   # Unit tests (381 tests, 11 suites)
```

## ProGuard

Release builds have `isMinifyEnabled = true`. ProGuard rules are in `app/proguard-rules.pro`. If adding new reflection-based libraries, add keep rules there.
