import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Patch console.error to suppress harmless Supabase lock errors in dev mode
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (args.length > 0 &&
    (args[0]?.name === 'NavigatorLockAcquireTimeoutError' ||
      (typeof args[0] === 'string' && args[0].includes('NavigatorLockAcquireTimeoutError')))) {
    return;
  }
  originalConsoleError(...args);
};

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
