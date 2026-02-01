import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ems.app',
  appName: 'EMS',
  webDir: 'dist',
  server: {
    androidScheme: 'http'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '741212345678-example.apps.googleusercontent.com', // MUST MATCH YOUR GCP CLIENT ID
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;