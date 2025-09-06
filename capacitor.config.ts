import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tscompany.moviloi',
  appName: 'moviloi',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#000000',
    // iPhone çentiği için ek ayarlar
    safeArea: true,
    statusBarOverlaysWebView: false,
    statusBarStyle: 'dark',
    statusBarBackgroundColor: '#000000'
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
      style: 'dark',
      backgroundColor: '#000000',
      overlaysWebView: false,
      // iPhone çentiği için ek ayarlar
      safeArea: true,
      statusBarOverlaysWebView: false
    }
  }
};

export default config;
