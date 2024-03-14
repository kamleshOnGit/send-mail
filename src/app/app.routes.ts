import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { PagenotfoundComponent } from './pagenotfound/pagenotfound.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '**', component: PagenotfoundComponent },
];
