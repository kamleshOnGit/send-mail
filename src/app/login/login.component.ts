import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

import { Router } from '@angular/router';
import { FooterComponent } from '../shared/footer/footer.component';
import { environment } from '../../environment/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FooterComponent],
})
export class LoginComponent {
  params: any;
  redirectUri = `${window.location.origin}/auth-callback`;
  constructor(
    private authServiceCustom: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  signOut(): void {
    this.authServiceCustom.logout();
  }

  oauthSignIn() {
    const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

    const form = document.createElement('form');
    form.setAttribute('method', 'GET');
    form.setAttribute('action', oauth2Endpoint);

    this.params = {
      client_id: environment.googleClientId,
      redirect_uri: this.redirectUri,
      response_type: 'token',
      scope:
        'https://www.googleapis.com/auth/gmail.settings.basic https://www.googleapis.com/auth/gmail.settings.sharing https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/drive.metadata.readonly',
      include_granted_scopes: 'true',
      state: 'pass-through value',
    };

    for (const p in this.params) {
      const input = document.createElement('input');
      input.setAttribute('type', 'hidden');
      input.setAttribute('name', p);
      input.setAttribute('value', this.params[p]);
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }
}
