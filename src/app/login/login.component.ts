import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SocialAuthService,
  GoogleSigninButtonModule,
  GoogleLoginProvider,
} from '@abacritt/angularx-social-login';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, GoogleSigninButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  constructor(private authService: SocialAuthService) {}
  ngOnInit(): void {
    this.authService.authState.subscribe((user) => {
      console.log(user);
      //perform further logics
    });
  }
  refreshToken(): void {
    this.authService.refreshAuthToken(GoogleLoginProvider.PROVIDER_ID);
  }
}
