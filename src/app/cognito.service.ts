import { EventEmitter, Injectable } from '@angular/core';
import { Amplify } from 'aws-amplify';
import { IUser } from '../user';
import Auth, { confirmSignUp, signUp, signIn, getCurrentUser, updateUserAttributes, updateUserAttribute, signOut, fetchUserAttributes } from '@aws-amplify/auth';
import awsConfig from '../aws-exports';

@Injectable({
  providedIn: 'root'
})
export class CognitoService {

  public authNotifier: EventEmitter<any> = new EventEmitter<any>();
  constructor() {
    Amplify.configure({
          Auth: {
            Cognito:{
            userPoolId: 'ap-south-1_okOPE3fpV',
            userPoolClientId: '59pa9qtbg3907fc984a3ncg0nl'
          },
          
          }
        });
  }

  notifyAuthStatus(status:boolean){
    this.authNotifier.next(status);
  }

  signUp(user: IUser): Promise<any> {
    return signUp({
      username: user.email,
      password: user.password,
      options:{
       userAttributes:{
        email: user.email,  // Ensure email is passed here
        name: 'Default Name', 
        'custom:role': user.role
       }
      }
      
    })
  }
  confirmSignup(user: IUser): Promise<any> {
    return confirmSignUp({
      username: user.email,
      confirmationCode: user.code
    });
  }

  signIn(user: IUser): Promise<any> {
    console.log(user);
    return signIn({username:user.email, password: user.password});
  }

  getUser(): Promise<any> {

     return getCurrentUser()
      .then((user) => {
        console.log('User retrieved:', user);
        return user;
      })
      .catch((error) => {
        console.error('Error fetching user:', error);
        throw error; // Rethrow the error to handle it in the component
      });
  }

  // updateUser(user: IUser): Promise<any> {
  //   return currentUserPoolUser().then((cognitoUser: any) => {
  //     return updateUserAttributes(cognitoUser, user);
  //   })
  // }

  signOut(): Promise<any> {
    return signOut();
  }

  getRole(): Promise<any> {
    return fetchUserAttributes()
      .then((user) => {
        const role = user['custom:role'];
        
        return role;
      })
      .catch((error) => {
        console.error('Error fetching role:', error);
        return ''; // Return empty string if role retrieval fails
      });
  }
}
