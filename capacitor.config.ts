import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.construtor360.app',
  appName: 'Construtor360',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
