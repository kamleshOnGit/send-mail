import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SocialAuthServiceConfig } from '@abacritt/angularx-social-login';
import { GoogleLoginProvider } from '@abacritt/angularx-social-login';
import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideStore } from '@ngrx/store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    {
        provide: 'SocialAuthServiceConfig',
        useValue: {
            autoLogin: false,
            providers: [
                {
                    id: GoogleLoginProvider.PROVIDER_ID,
                    provider: new GoogleLoginProvider('462804174068-l8s7ruqglrojdn01e44to46qifd76pp5.apps.googleusercontent.com'),
                },
            ],
            onError: (error) => {
                console.error(error);
            },
        } as SocialAuthServiceConfig,
    },
    provideStore()
],
};
