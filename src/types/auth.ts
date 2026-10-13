import { UserModel } from './user';

export interface AuthResponse {
  token: string;
  user: UserModel;
}

export interface LoginPayload {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  nama: string;
  username: string;
  email: string;
  password: string;
  no_hp?: string;
}

export interface GoogleLoginPayload {
  idToken: string;
}
