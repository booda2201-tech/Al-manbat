import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';
import { routes } from './app.routes';
import { apiInterceptor } from './api/api.interceptor';
import { CatalogService } from './services/catalog.service';
import { StoreService } from './services/store.service';

export function bootstrapShop(catalog: CatalogService, store: StoreService) {
  return () => firstValueFrom(catalog.load().pipe(tap(() => store.hydrateFromApi())));
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([apiInterceptor])),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })
    ),
    provideNoopAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: bootstrapShop,
      deps: [CatalogService, StoreService],
      multi: true,
    },
  ],
};
