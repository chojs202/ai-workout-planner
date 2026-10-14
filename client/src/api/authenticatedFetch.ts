export const AUTH_EXPIRED_EVENT = "auth:expired";

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);

  if (response.status === 401) {
    window.dispatchEvent(
      new Event(AUTH_EXPIRED_EVENT),
    );
  }

  return response;
}