import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => {
    console.error('Bootstrap error:', err);
    document.body.innerHTML = `<h1>Bootstrap Error</h1><pre>${JSON.stringify(err, null, 2)}</pre>`;
  });
