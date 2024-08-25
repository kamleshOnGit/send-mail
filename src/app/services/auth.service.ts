import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
declare var google: any;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private router: Router, private ngZone: NgZone) {}
 
  isAuthenticated(){
   
    return localStorage.getItem('access_token');
    
  }

  // Logout method (if needed)
  logout(): void {
    // Remove the access token from local storage
    localStorage.removeItem('access_token');

    // Redirect to the login page or another desired page
    this.router.navigate(['/login']);
  }
}
