// import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';
// import { Amplify } from 'aws-amplify';
// import { FormsModule } from '@angular/forms';
// import { AuthServiceService } from './auth-service.service';


// Amplify.configure({
//     Auth: {
//       Cognito:{
//       userPoolId: 'ap-south-1_okOPE3fpV',
//       userPoolClientId: '59pa9qtbg3907fc984a3ncg0nl'
//     },
//     }
//   });

// @Component({
//   selector: 'app-auth',
//   standalone: true,
//   imports: [AmplifyAuthenticatorModule, FormsModule],
//   providers: [AuthServiceService],
//   templateUrl: './auth.component.html',
//   styleUrl: './auth.component.scss',
//   schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
// })
// export class AuthComponent {

//   formFields = {
//     signUp: {
//       name: {
//         order: 1
//       },
//       email: {
//         order: 2
//       },
//       password: {
//         order: 3
//       },
//       confirm_password: {
//         order: 4
//       }
//     },
//   };

// }
