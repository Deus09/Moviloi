import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tscompany.moviloi',
  appName: 'moviloi',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#171717',
    // iPhone çentiği için ek ayarlar
    },
    server: {
      iosScheme: 'https'
    },
    plugins: {
      PushNotifications: {
        presentationOptions: ["badge", "sound", "alert"]
      },
      Network: {
      // Network plugin configuration
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#171717',
      overlaysWebView: false,
      // iPhone çentiği için ek ayarlar
      safeArea: true,
      statusBarOverlaysWebView: false
    }
  }
};

export default config;
