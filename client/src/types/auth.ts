import type { User } from "./user";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
}

export interface LoginErrorResponse {
  message: string;
}

export type CurrentUserResponse = LoginResponse;

export interface LogoutResponse {
  message: string;
}