import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  CreateUserErrorResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserNameRequest,
  UpdateUserNameResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  DeleteUserAccountRequest,
  DeleteUserAccountResponse,
} from "../types/user";
import { authenticatedFetch } from "./authenticatedFetch";
import type { TranslationKey } from "../i18n/translations";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export class UserRequestError extends Error {
  readonly translationKey: TranslationKey;
  readonly status: number | undefined;

  constructor(
    translationKey: TranslationKey,
    status?: number,
  ) {
    super(translationKey);
    this.name = "UserRequestError";
    this.translationKey = translationKey;
    this.status = status;
  }
}

function getUserRequestError(
  status: number,
  fallbackKey: TranslationKey,
  invalidInputKey: TranslationKey,
): UserRequestError {
  let key = fallbackKey;

  if (status === 400) {
    key = invalidInputKey;
  } else if (status === 401) {
    key = "authLoginRequired";
  } else if (status === 429) {
    key = "tooManyRequests";
  } else if (status >= 500) {
    key = "serverUnavailable";
  }

  return new UserRequestError(key, status);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCreateUserResponse(
  data: unknown,
): data is CreateUserResponse {
  if (!isRecord(data) || !isRecord(data.user)) {
    return false;
  }

  return (
    typeof data.user.id === "string" &&
    typeof data.user.name === "string" &&
    typeof data.user.email === "string"
  );
}

function isCreateUserErrorResponse(
  data: unknown,
): data is CreateUserErrorResponse {
  return isRecord(data) && typeof data.message === "string";
}

export async function createUser(
  userData: CreateUserRequest,
): Promise<CreateUserResponse> {
  if (!API_BASE_URL) {
    throw new UserRequestError("serviceNotConfigured");
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      },
    );
  } catch {
    throw new UserRequestError("networkError");
  }

  if (!response.ok) {
    if (response.status === 409) {
      throw new UserRequestError(
        "signupDuplicateEmail",
        response.status,
      );
    }

    throw getUserRequestError(
      response.status,
      "signupFailed",
      "signupInvalidRequest",
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new UserRequestError("invalidServerResponse");
  }

  if (!isCreateUserResponse(data)) {
    throw new UserRequestError("invalidServerResponse");
  }

  return data;
}

export async function updateUserName(
  requestData: UpdateUserNameRequest,
): Promise<UpdateUserNameResponse> {
  if (!API_BASE_URL) {
    throw new UserRequestError("serviceNotConfigured");
  }

  let response: Response;

  try {
    response = await authenticatedFetch(
      `${API_BASE_URL}/api/users/me/name`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      },
    );
  } catch {
    throw new UserRequestError("networkError");
  }

  if (!response.ok) {
    throw getUserRequestError(
      response.status,
      "profileNameFailed",
      "loginInvalidRequest",
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new UserRequestError("invalidServerResponse");
  }

  if (!isCreateUserResponse(data)) {
    throw new UserRequestError("invalidServerResponse");
  }

  return data;
}

export async function changePassword(
  requestData: ChangePasswordRequest,
): Promise<ChangePasswordResponse> {
  if (!API_BASE_URL) {
    throw new UserRequestError("serviceNotConfigured");
  }

  let response: Response;

  try {
    response = await authenticatedFetch(
      `${API_BASE_URL}/api/users/me`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      },
    );
  } catch {
    throw new UserRequestError("networkError");
  }

  if (!response.ok) {
    throw getUserRequestError(
      response.status,
      "profilePasswordFailed",
      "profilePasswordRejected",
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new UserRequestError("invalidServerResponse");
  }

  if (!isRecord(data) || typeof data.message !== "string") {
    throw new UserRequestError("invalidServerResponse");
  }

  return { message: data.message };
}

export async function updateUserProfile(
  requestData: UpdateUserProfileRequest,
): Promise<UpdateUserProfileResponse> {
  if (!API_BASE_URL) {
    throw new UserRequestError("serviceNotConfigured");
  }

  let response: Response;

  try {
    response = await authenticatedFetch(
      `${API_BASE_URL}/api/users/me/profile`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      },
    );
  } catch {
    throw new UserRequestError("networkError");
  }

  if (!response.ok) {
    if (response.status === 409) {
      throw new UserRequestError(
        "apiRequestConflict",
        response.status,
      );
    }

    const includesPassword =
      requestData.newPassword !== undefined;

    throw getUserRequestError(
      response.status,
      includesPassword
        ? "profilePasswordFailed"
        : "profileNameFailed",
      includesPassword
        ? "profilePasswordRejected"
        : "loginInvalidRequest",
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new UserRequestError("invalidServerResponse");
  }

  if (!isCreateUserResponse(data)) {
    throw new UserRequestError("invalidServerResponse");
  }

  return data;
}

export async function deleteUserAccount(
  requestData: DeleteUserAccountRequest,
): Promise<DeleteUserAccountResponse> {
  if (!API_BASE_URL) {
    throw new UserRequestError("serviceNotConfigured");
  }

  let response: Response;

  try {
    response = await authenticatedFetch(
      `${API_BASE_URL}/api/users/me`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      },
    );
  } catch {
    throw new UserRequestError("networkError");
  }

  if (!response.ok) {
    if (response.status === 409) {
      throw new UserRequestError(
        "apiRequestConflict",
        response.status,
      );
    }

    throw getUserRequestError(
      response.status,
      "profileDeleteFailed",
      "profileDeletePasswordRejected",
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new UserRequestError("invalidServerResponse");
  }

  if (!isRecord(data) || typeof data.message !== "string") {
    throw new UserRequestError("invalidServerResponse");
  }

  return {
    message: data.message,
  };
}