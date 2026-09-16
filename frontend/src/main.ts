import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';
import { bootstrapApplication } from '@angular/platform-browser';
import 'zone.js';

import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

registerLocaleData(localeEsPe);

bootstrapApplication(AppComponent, appConfig).catch((error: unknown) => {
  console.error('No se pudo iniciar la aplicación.', error);
});
