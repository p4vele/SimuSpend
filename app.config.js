import 'dotenv/config';

export default {
  "expo": {
    "name": "SimuSpend",
    "slug": "SimuSpend",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "platforms": ["ios", "android"],
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "Allow access to your photo library",
        "NSPhotoLibraryUsageDescription": "Allow access to your photo library"
      }
    },
    "plugins": [
      [
        "expo-document-picker",
        {
          "iCloudContainerEnvironment": "Production"
        }
      ]
    ],
    "android": {
      "package": "com.SimuSpend",
      "versionCode": 1,
      "permissions": ["CAMERA_ROLL","READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"],
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "config": {
        "googleSignIn": {
          "apiKey": "your-google-signin-api-key",
          "certificateHash": "your-certificate-hash"
        }
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "firebaseApiKey": process.env.FIREBASE_API_KEY,
      "firebaseAuthDomain": process.env.FIREBASE_AUTH_DOMAIN,
      "firebaseProjectId": process.env.FIREBASE_PROJECT_ID,
      "firebaseStorageBucket": process.env.FIREBASE_STORAGE_BUCKET,
      "firebaseMessagingSenderId": process.env.FIREBASE_MESSAGING_SENDER_ID,
      "firebaseAppId": process.env.FIREBASE_APP_ID,
      "apiKey": process.env.OPENAI_API_KEY
    }
  }
};
