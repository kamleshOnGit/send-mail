import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private router: Router) {}

  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    // Check expiry stored alongside the token
    const expiresAt = localStorage.getItem('token_expires_at');
    if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {
      this.clearSession();
      return false;
    }
    return true;
  }

  saveToken(token: string, expiresInSeconds: number = 3600): void {
    localStorage.setItem('access_token', token);
    localStorage.setItem(
      'token_expires_at',
      (Date.now() + expiresInSeconds * 1000).toString()
    );
  }

  clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_expires_at');
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }
}
