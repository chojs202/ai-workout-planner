import type {
  CurrentUserResponse,
  LoginErrorResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
} from "../types/auth";
import type { TranslationKey } from "../i18n/translations";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class AuthStatusError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);
    this.name = "AuthStatusError";
    this.status = status;
  }
}

export class AuthRequestError extends Error {
  readonly translationKey: TranslationKey;
  readonly status: number | undefined;

  constructor(
    translationKey: TranslationKey,
    status?: number,
  ) {
    super(translationKey);
    this.name = "AuthRequestError";
    this.translationKey = translationKey;
    this.status = status;
  }
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLoginResponse(
  data: unknown,
): data is LoginResponse {
  if (!isRecord(data) || !isRecord(data.user)) {
    return false;
  }

  return (
    typeof data.user.id === "string" &&
    typeof data.user.name === "string" &&
    typeof data.user.email === "string"
  );
}

function isLoginErrorResponse(
  data: unknown,
): data is LoginErrorResponse {
  return (
    isRecord(data) &&
    typeof data.message === "string"
  );
}

export async function login(
  loginData: LoginRequest,
): Promise<LoginResponse> {
  if (!API_BASE_URL) {
    throw new AuthRequestError("serviceNotConfigured");
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(loginData),
      },
    );
  } catch {
    throw new AuthRequestError("networkError");
  }

  if (!response.ok) {
    let translationKey: TranslationKey = "loginFailed";

    if (response.status === 400) {
      translationKey = "loginInvalidRequest";
    } else if (response.status === 401) {
      translationKey = "loginInvalidCredentials";

      let errorData: unknown;

      try {
        errorData = await response.json();
      } catch {
        errorData = undefined;
      }

      if (isRecord(errorData)) {
        if (errorData.code === "LOGIN_EMAIL_NOT_FOUND") {
          translationKey = "loginEmailNotFound";
        } else if (errorData.code === "LOGIN_INVALID_PASSWORD") {
          translationKey = "loginInvalidPassword";
        }
      }

    } else if (response.status === 429) {
      translationKey = "tooManyRequests";
    } else if (response.status >= 500) {
      translationKey = "serverUnavailable";
    }

    throw new AuthRequestError(
      translationKey,
      response.status,
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new AuthRequestError("invalidServerResponse");
  }

  if (!isLoginResponse(data)) {
    throw new AuthRequestError("invalidServerResponse");
  }

  return data;
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  if (!API_BASE_URL) {
    throw new AuthRequestError("serviceNotConfigured");
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/auth/me`,
      {
        method: "GET",
        credentials: "include",
      },
    );
  } catch {
    throw new AuthRequestError("networkError");
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new AuthStatusError(
        "authLoginRequired",
        response.status,
      );
    }

    let translationKey: TranslationKey = "authCheckFailed";

    if (response.status === 429) {
      translationKey = "tooManyRequests";
    } else if (response.status >= 500) {
      translationKey = "serverUnavailable";
    }

    throw new AuthRequestError(
      translationKey,
      response.status,
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new AuthRequestError("invalidServerResponse");
  }

  if (!isLoginResponse(data)) {
    throw new AuthRequestError("invalidServerResponse");
  }

  return data;
}

export async function logout(): Promise<LogoutResponse> {
  if (!API_BASE_URL) {
    throw new AuthRequestError("serviceNotConfigured");
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/auth/logout`,
      {
        method: "POST",
        credentials: "include",
      },
    );
  } catch {
    throw new AuthRequestError("networkError");
  }

  if (!response.ok) {
    let key: TranslationKey = "profileLogoutFailed";

    if (response.status === 429) {
      key = "tooManyRequests";
    } else if (response.status >= 500) {
      key = "serverUnavailable";
    }

    throw new AuthRequestError(key, response.status);
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new AuthRequestError("invalidServerResponse");
  }

  if (!isLoginErrorResponse(data)) {
    throw new AuthRequestError("invalidServerResponse");
  }

  return data;
}