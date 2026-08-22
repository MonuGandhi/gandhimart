# Preserve line number information for debugging stack traces
-keepattributes SourceFile,LineNumberTable,Signature,InnerClasses,EnclosingMethod,*Annotation*

# Capacitor Core Keep Rules
-keep class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.BridgeActivity { *; }

# Codetrix Studio Capacitor Google Auth Keep Rules
-keep class com.codetrixstudio.capacitor.** { *; }
-keep class com.codetrixstudio.capacitor.GoogleAuth { *; }

# Google Play Services & Auth Keep Rules
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.google.android.gms.common.** { *; }
-keep class com.google.android.gms.tasks.** { *; }
-keep class com.google.android.gms.identity.** { *; }

# Firebase Auth & Firestore Keep Rules
-keep class com.google.firebase.** { *; }
-keep class androidx.credentials.** { *; }
-keep class androidx.credentials.playservices.** { *; }

