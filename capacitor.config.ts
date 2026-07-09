import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'autisim-app',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#f1f5f1",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    }
  }
};

export default config;
