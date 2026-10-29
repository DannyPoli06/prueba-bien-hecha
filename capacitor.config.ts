import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'incidentes-urbanos',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0, //cuanto tiempo se muestra el splash screen
      launchAutoHide: true,
      //launchFadeOutDuration: 500, //desvanecimiento del splash screen
      backgroundColor: '#0284c7',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    }
  }
};

export default config;
