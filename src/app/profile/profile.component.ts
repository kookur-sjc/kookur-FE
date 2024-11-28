import { Component } from '@angular/core';
import { CognitoService } from '../cognito.service';
import { IUser } from '../../user';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IsAuthorizeDirective } from '../is-authorize.directive';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, NgClass, IsAuthorizeDirective],
  providers: [CognitoService, HttpClient, IsAuthorizeDirective],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {

  constructor(private cognitoService:CognitoService,private router:Router) {}
  user:IUser = {} as IUser;

  public ngOnInit(): void {
    this.cognitoService.getUser().then((user) => {
      console.log(user);
      this.user.email = user.signInDetails.loginId;
      // this.user = user.attributes;
      // this.user.role = user.attributes['custom:role'];
    })
  }

  // public update(): void {
  //   this.cognitoService.updateUser(this.user).then(() => {
  //     alert('Updated successfully.');
  //   }).catch((error) => {
  //     alert(error);
  //   });
  // }

  public getUser(): void {
    this.cognitoService.getUser().then((user) => {
      // this.user = user.signInDetails;
      console.log(user);
      this.user.email = user.signInUserSession.idToken.payload.email;
      // this.user.role = user.attributes['custom:role'];
    }).catch((error) => {
      alert(error);
    })
  }

  
  public signOut(): void {
    this.cognitoService.signOut().then(() => {
      // this.cognitoService.notifyAuthStatus(false);
      this.router.navigate(['/signup']);
    }).catch((error) => {
      alert(error);
    })

  }

}
