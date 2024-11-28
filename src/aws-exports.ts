export const awsConfig = {
    Auth: {
        Cognito:{
      region: 'ap-south-1',
      userPoolId: 'ap-south-1_XA74Ez9Ip',
      userPoolClientId: 'jha214uqug2pb0i8cv0vb62nn',
      oauth: {
        domain: 'kookur.auth.ap-south-1.amazoncognito.com',
        scope: ['email', 'openid', 'profile'],
        redirectSignIn: 'http://localhost:4200/',
        redirectSignOut: 'http://localhost:4200/',
        responseType: 'code', // or 'token' for implicit grant
      },
    },
    }
  };


  export default awsConfig;
  