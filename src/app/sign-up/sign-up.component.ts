import { Component } from '@angular/core';
import { IUser } from '../../user';
import { Router } from '@angular/router';
import { CognitoService } from '../cognito.service';
import { HttpClient, HttpClientModule, HttpHandler } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [HttpClientModule, FormsModule, NgClass, NgIf],
  providers: [CognitoService, HttpClient],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  isConfirm: boolean = false;
  user: IUser = {} as IUser;
  errorMessage: string = '';
  isSignIn = true;
  constructor(private router: Router, private cognitoService: CognitoService,private httpClient:HttpClient) {
  }

  public signUp(): void {
    this.user.role = 'user';
    this.cognitoService
      .signUp(this.user)
      .then(() => {
        this.isConfirm = true;
        this.isSignIn = false; 
      })
      .catch((error) => {
        alert(error);
      });
  }

  public confirmSignUp(): void {
    this.user.role = 'user';
    this.cognitoService
      .confirmSignup(this.user)
      .then(() => {
        // Switch to the Sign-In section after successful sign-up confirmation
        this.isConfirm = false;
        this.isSignIn = true;
      })
      .catch((error) => {
        alert(error);
      });
  }

  // Sign-In Function
  public signIn(): void {
    this.cognitoService.signIn(this.user).then(() => {
      this.cognitoService.notifyAuthStatus(true);
      this.cognitoService.getUser(); // Fetch user details immediately after sign-in
      this.router.navigate(['/profile']);
    }).catch((error) => {
      alert(error);
    });
  }

  // Toggle Forms
  public toggleSignIn(): void {
    this.isSignIn = true;
    this.isConfirm = false;
  }

  public toggleSignUp(): void {
    this.isSignIn = false;
    this.isConfirm = false;
  }

}
