// import { Injectable } from '@angular/core';
// import { signIn, signOut, signUp} from 'aws-amplify/auth';

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthServiceService {

//   async signUp(username: string, password: string): Promise<void> {
//     try {
//       const user = await signUp({ username, password});
//       console.log(user);
//     } catch (error) {
//       console.error('Error during sign-up:', error);
//     }
//   }

//   async signIn(username: string, password: string): Promise<void> {
//     try {
//       const user = await signIn({ username, password });
//       console.log(user);
//     } catch (error) {
//       console.error('Error during sign-in:', error);
//     }
//   }

//   async signOut(): Promise<void> {
//     try {
//       await signOut();
//     } catch (error) {
//       console.error('Error during sign-out:', error);
//     }
//   }
// }
