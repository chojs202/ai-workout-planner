import { translations } from "../i18n/translations";
import type { TranslationKey } from "../i18n/translations";
import { authenticatedFetch } from "./authenticatedFetch";
import { beginRequestLoading } from "../utils/requestLoading";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiRequestError extends Error {
  readonly translationKey: TranslationKey;
  readonly status: number | undefined;

  constructor(
    translationKey: TranslationKey,
    status?: number,
  ) {
    super(translations.ko[translationKey]);

    this.name = "ApiRequestError";
    this.translationKey = translationKey;
    this.status = status;
  }
}

function getErrorKey(
  status: number,
  fallbackKey: TranslationKey,
): TranslationKey {
  if (status === 400 || status === 422) {
    return "apiInvalidRequest";
  }

  if (status === 401) {
    return "authLoginRequired";
  }

  if (status === 404) {
    return "apiResourceNotFound";
  }

  if (status === 409) {
    return "apiRequestConflict";
  }

  if (status === 429) {
    return "tooManyRequests";
  }

  if (status >= 500) {
    return "serverUnavailable";
  }

  return fallbackKey;
}

export async function translatedRequest(
  path: string,
  requestInit: RequestInit,
  fallbackKey: TranslationKey,
  responseMode: "json" | "noContent" = "json",
): Promise<unknown> {
  if (!API_BASE_URL) {
    throw new ApiRequestError("serviceNotConfigured");
  }

  const isReadRequest =
    (requestInit.method ?? "GET").toUpperCase() === "GET";

  const finishLoading = isReadRequest
    ? beginRequestLoading()
    : () => {};

  try {
    let response: Response;

    try {
      response = await authenticatedFetch(
        `${API_BASE_URL}${path}`,
        {
          ...requestInit,
          credentials: "include",
        },
      );
    } catch {
      throw new ApiRequestError("networkError");
    }

    if (!response.ok) {
      throw new ApiRequestError(
        getErrorKey(response.status, fallbackKey),
        response.status,
      );
    }

    if (responseMode === "noContent") {
      if (response.status !== 204) {
        throw new ApiRequestError(
          "invalidServerResponse",
          response.status,
        );
      }

      return undefined;
    }

    try {
      const data: unknown = await response.json();
      return data;
    } catch {
      throw new ApiRequestError(
        "invalidServerResponse",
        response.status,
      );
    }
  } finally {
    finishLoading();
  }
}