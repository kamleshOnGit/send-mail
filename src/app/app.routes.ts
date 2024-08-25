import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth-gaurd.service';
import { LoginComponent } from './login/login.component';
import { MailboxComponent } from './mailbox/mailbox.component';
import { PagenotfoundComponent } from './pagenotfound/pagenotfound.component';
import { SendingMailComponent } from './sending-mail/sending-mail.component';
import { AuthCallbackComponent } from './auth-callback/auth-callback.component';
import { EmailDetailsComponent } from './email-details-component/email-details.component';

export const routes: Routes = [
  { path: 'inbox', component: MailboxComponent, canActivate: [AuthGuard] },
  {
    path: 'inbox/:id',
    component: EmailDetailsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'mailing',
    component: SendingMailComponent,
    canActivate: [AuthGuard],
  },
  { path: 'login', component: LoginComponent },
  { path: 'auth-callback', component: AuthCallbackComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', component: PagenotfoundComponent },
];
