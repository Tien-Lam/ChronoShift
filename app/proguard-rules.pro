# ML Kit
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.internal.mlkit_genai.** { *; }

# Zipline / QuickJS
-keep class app.cash.zipline.** { *; }

# kotlinx-datetime
-keep class kotlinx.datetime.** { *; }

# LiteRT
-keep class com.google.ai.edge.** { *; }

# Strip debug/verbose logs in release builds (removes string concatenation overhead too)
-assumenosideeffects class android.util.Log {
    public static int d(...);
    public static int v(...);
}

# Hilt / Dagger
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }
-keep class * extends dagger.hilt.android.internal.managers.ViewComponentManager$FragmentContextWrapper { *; }
-keep @dagger.hilt.android.AndroidEntryPoint class *
-keep @dagger.hilt.InstallIn class *
