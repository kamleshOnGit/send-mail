import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { emailReducer } from './dataStore/reducers';
import { EmailEffects } from './dataStore/effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    // {
    //     provide: 'SocialAuthServiceConfig',
    //     useValue: {
    //         autoLogin: false,
    //         providers: [
    //             {
    //                 id: GoogleLoginProvider.PROVIDER_ID,
    //                 provider: new GoogleLoginProvider('462804174068-l8s7ruqglrojdn01e44to46qifd76pp5.apps.googleusercontent.com'),
    //             },
    //         ],
    //         onError: (error) => {
    //             console.error(error);
    //         },
    //     } as SocialAuthServiceConfig,
    // },
    provideStore({ email: emailReducer }),
    provideEffects([EmailEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
