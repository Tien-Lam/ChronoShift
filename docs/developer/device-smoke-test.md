# Real-Device Smoke Test

Run this before recommending a new model in `model-manifest.json`, and after changing `ModelRepository`, `ModelDownloader`, `LiteRtExtractor`, or Settings model controls.

## Prerequisites

- Android device or emulator visible in `adb devices`
- Enough free device storage for the model download
- Network connection on the device

```powershell
$env:JAVA_HOME = 'C:/Program Files/Android/Android Studio/jbr'
$env:ANDROID_HOME = "$env:LOCALAPPDATA/Android/Sdk"
$adb = "$env:ANDROID_HOME/platform-tools/adb.exe"
& $adb devices
```

## Install Fresh

```powershell
./gradlew assembleDebug
& $adb install -r app/build/outputs/apk/debug/app-debug.apk
& $adb shell pm clear com.chronoshift
& $adb shell monkey -p com.chronoshift 1
```

Expected:

- App launches without a model installed.
- Settings shows the Gemma model name and either update availability or a non-blocking update-check warning.
- Main conversion still works using Stage 1.

## Stage 1 Fallback

In the app, convert:

```text
10am to noon PST
```

Expected:

- The app returns two ordered results.
- No LiteRT model is required.
- No crash appears in logcat:

```powershell
& $adb logcat -d -t 300 | Select-String "FATAL EXCEPTION|AndroidRuntime|ChronoShift"
```

## Download And LiteRT Path

In Settings:

1. Tap **Download Model** or **Update Model**.
2. Wait for completion.
3. Confirm Settings shows the model as installed with a non-zero size.

Then convert:

```text
Flight UA123 departs SFO at 7:00 AM PST, arrives JFK at 3:30 PM EST
```

Expected:

- Results include both departure and arrival times.
- Stage 2 can merge in without duplicating correct Stage 1 results.
- Logcat contains LiteRT initialization for the selected `.litertlm` file and no fatal exception.

## Delete And Fallback Again

In Settings:

1. Tap **Delete Model**.
2. Confirm the model shows as not installed.
3. Convert `Movie night starts at 8pm EST (5pm PST)`.

Expected:

- The app still returns Stage 1 results.
- LiteRT is unavailable but non-fatal.
- Download controls remain available.
