import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.css',
})
export class AuthCallbackComponent implements OnInit {
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.handleOAuthCallback();
  }

  private handleOAuthCallback(): void {
    // Google's implicit flow returns the token in the URL hash fragment:
    // /auth-callback#access_token=ya29.xxx&token_type=Bearer&expires_in=3600
    //
    // window.location.hash gives us "#access_token=..." — strip the leading "#"
    // and parse it as URLSearchParams.
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;

    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');

    if (accessToken) {
      this.authService.saveToken(
        accessToken,
        expiresIn ? parseInt(expiresIn, 10) : 3600
      );
      // Clear the hash from the URL so the token isn't visible in the address bar
      window.history.replaceState(null, '', window.location.pathname);
      this.router.navigate(['/inbox']);
    } else {
      // No token found — send back to login
      this.router.navigate(['/login']);
    }
  }
}
