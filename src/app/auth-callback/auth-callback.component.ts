import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.css',
})
export class AuthCallbackComponent implements OnInit {
  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      console.log('Router Event:', event);
    });
  }

  ngOnInit(): void {
    this.getAccessTokenFromUrl();
  }

  // Function to extract access token from the URL
  getAccessTokenFromUrl(): void {
    const url = window.location.href;
    const params = new URLSearchParams(url.split('#')[1]);
    const accessToken = params.get('access_token');

    if (accessToken) {
      // Save the access token to local storage or any other storage method
      localStorage.setItem('access_token', accessToken);
      console.log('Access Token saved:', accessToken);

      // Navigate to the desired page after saving the token
       this.router
         .navigate(['/inbox'])
         .then((success) => {
           console.log('Navigation to /inbox successful:', success);
         })
         .catch((err) => {
           console.error('Navigation Error:', err);
         });
    } else {
      console.log('Access Token not found in the URL.');
      // Handle the error or redirect as needed
      this.router.navigate(['/login']);
    }
  }

 
  
}
