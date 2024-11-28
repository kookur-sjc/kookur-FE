import { Component } from '@angular/core';
import { Router } from '@angular/router';
import Auth from '@aws-amplify/auth';
import { IUser } from '../../user';
import { CognitoService } from '../cognito.service';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {


  user: IUser = {} as IUser;

  constructor(private router: Router, private cognitoService: CognitoService) {
  }

  public signIn(): void {
    this.cognitoService.signIn(this.user).then(() => {
      this.cognitoService.notifyAuthStatus(true);
      this.router.navigate(['/profile']);
    }).catch((error) => {
      alert(error);
    })

  }

}
