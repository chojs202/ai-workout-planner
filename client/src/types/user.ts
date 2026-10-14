export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
}

export interface CreateUserResponse {
  user: User;
}

export interface CreateUserErrorResponse {
  message: string;
}

export interface UpdateUserNameRequest {
  name: string;
}

export interface UpdateUserNameResponse {
  user: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export type UpdateUserProfileRequest = {
  name?: string;
} & (
    | {
      currentPassword: string;
      newPassword: string;
    }
    | {
      currentPassword?: never;
      newPassword?: never;
    }
  );

export interface UpdateUserProfileResponse {
  user: User;
}

export interface DeleteUserAccountRequest {
  currentPassword: string;
}

export interface DeleteUserAccountResponse {
  message: string;
}