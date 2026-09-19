import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prestameesta.app',
  appName: 'PrestameEsta',
  webDir: 'dist/sistema-prestamos-web/browser',
  android: {
    // HTTP local is allowed only when syncing an explicit debug build.
    allowMixedContent: process.env['CAPACITOR_ALLOW_MIXED_CONTENT'] === 'true',
    webContentsDebuggingEnabled: process.env['CAPACITOR_ALLOW_MIXED_CONTENT'] === 'true',
  },
};

export default config;
