# BetIQ Mobile App Build Guide

## Prerequisites
- Node.js 18+
- For iOS: Mac with Xcode 15+ and Apple Developer account ($99/year)
- For Android: Android Studio

## Setup (one-time)

```bash
# Clone your repo and install dependencies
git clone https://github.com/YOUR_USERNAME/betiq.git
cd betiq
npm install

# Initialize Capacitor (already configured via capacitor.config.json)
npx cap add ios
npx cap add android
```

## Building

The app loads directly from https://betiq-nine.vercel.app so no build step needed.

```bash
# Sync config to native projects
npx cap sync
```

## iOS

```bash
# Open in Xcode
npx cap open ios

# In Xcode:
# 1. Select your Apple Developer Team (Signing & Capabilities)
# 2. Set Bundle ID: com.betiq.app
# 3. Connect iPhone or select simulator
# 4. Press Run (▶) to test
# 5. For App Store: Product → Archive → Distribute App
```

## Android

```bash
# Open in Android Studio
npx cap open android

# In Android Studio:
# 1. Wait for Gradle sync
# 2. Run on emulator or connected device
# 3. For Play Store: Build → Generate Signed Bundle/APK
```

## App Store / Play Store requirements

### iOS App Store
- App icon: 1024x1024 PNG (no transparency) → assets/icon.png
- Screenshots for 6.5" and 5.5" iPhones
- Privacy Policy URL (required): https://betiq-nine.vercel.app/#terms
- Apple Developer account: https://developer.apple.com

### Google Play Store  
- App icon: 512x512 PNG
- Feature graphic: 1024x500 PNG
- Screenshots (min 2)
- Privacy Policy URL: https://betiq-nine.vercel.app/#terms
- Google Play Console: https://play.google.com/console

## App Icons

Generate icons from a single 1024x1024 source:
- https://www.appicon.co/ (free, generates all sizes)
- Place iOS icons in ios/App/App/Assets.xcassets/AppIcon.appiconset/
- Place Android icons in android/app/src/main/res/

## Push Notifications (optional)

For future match reminders, add Firebase:
1. Create project at https://console.firebase.google.com
2. npm install @capacitor/push-notifications
3. Add google-services.json (Android) and GoogleService-Info.plist (iOS)
