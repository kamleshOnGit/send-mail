import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

import { Router } from '@angular/router';
import { FooterComponent } from '../shared/footer/footer.component';
import { HeaderComponent } from '../shared/header/header.component';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'], // Corrected here
  providers: [AuthService],
  imports: [CommonModule, FooterComponent, HeaderComponent],
})
export class LoginComponent {
  params: any;
  constructor(
    private authServiceCustom: AuthService, // Renamed for clarity
    private router: Router
  ) {}

  ngOnInit(): void {}

  signOut(): void {
    this.authServiceCustom.logout();
  }

  oauthSignIn() {
    // Google's OAuth 2.0 endpoint for requesting an access token
    const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

    // Create <form> element to submit parameters to OAuth 2.0 endpoint.
    const form = document.createElement('form');
    form.setAttribute('method', 'GET'); // Send as a GET request.
    form.setAttribute('action', oauth2Endpoint);

    // Parameters to pass to OAuth 2.0 endpoint.
    this.params = {
      client_id:
        '462804174068-i6mo9v0eg6aq2sja08f4q8a2g6admi2d.apps.googleusercontent.com',
      redirect_uri: 'http://localhost:4200/auth-callback', // Make sure this matches your Google Cloud Console settings
      response_type: 'token',
      discoveryDocs: [
        'https://sheets.googleapis.com/$discovery/rest?version=v4',
        'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
      ],
      scope:
        'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.metadata.readonly',
      include_granted_scopes: 'true',
      state: 'pass-through value', // Optional: can be used to pass state information
    };

    // Add form parameters as hidden input values.
    for (const p in this.params) {
      const input = document.createElement('input');
      input.setAttribute('type', 'hidden');
      input.setAttribute('name', p);
      input.setAttribute('value', this.params[p]);
      form.appendChild(input);
    }

    // Add form to page and submit it to open the OAuth 2.0 endpoint.
    document.body.appendChild(form);
    form.submit();
  }
}
