export interface IUser {
  email: string;
  password: string;
  showPassword: boolean;
  code: string;
  role?: string; // Optional in case it's not always available
  userId?: string; // Optional for cases when this is used
  signInDetails?: { loginId?: string }; // Optional chaining compatible
}