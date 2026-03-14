export type ProfileRole = "parent" | "school" | "club";

export interface Profile {
  id: string;
  email: string;
  role: ProfileRole;
  fullName: string | null;
}

type AuthSession = {
  accessToken: string | null;
  profile: Profile | null;
};

type SessionListener = (session: AuthSession) => void;

type ApiFetchOptions = RequestInit & {
  retryOnAuthError?: boolean;
  redirectOnAuthError?: boolean;
};

type ApiError = {
  error: string;
};

type RefreshResponse = {
  accessToken: string;
};

const sessionListeners = new Set<SessionListener>();

let sessionState: AuthSession = {
  accessToken: null,
  profile: null,
};

let refreshPromise: Promise<AuthSession | null> | null = null;

function getApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  return apiUrl;
}

function notifySessionListeners() {
  const snapshot = { ...sessionState };

  for (const listener of sessionListeners) {
    listener(snapshot);
  }
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;

  return atob(normalized.padEnd(normalized.length + padding, "="));
}

function decodeAccessToken(accessToken: string): Profile {
  const [, payload] = accessToken.split(".");

  if (!payload) {
    throw new Error("Invalid access token");
  }

  const parsedPayload = JSON.parse(decodeBase64Url(payload)) as {
    sub?: string;
    email?: string;
    role?: string;
    fullName?: string | null;
  };

  if (
    typeof parsedPayload.sub !== "string" ||
    typeof parsedPayload.email !== "string" ||
    (parsedPayload.role !== "parent" &&
      parsedPayload.role !== "school" &&
      parsedPayload.role !== "club")
  ) {
    throw new Error("Invalid access token payload");
  }

  return {
    id: parsedPayload.sub,
    email: parsedPayload.email,
    role: parsedPayload.role,
    fullName:
      typeof parsedPayload.fullName === "string" ? parsedPayload.fullName : null,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const isJsonResponse = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = isJsonResponse ? await response.json() : null;

  if (!response.ok) {
    const errorMessage =
      (payload as ApiError | null)?.error ?? "Request failed";

    throw new Error(errorMessage);
  }

  return payload as T;
}

function executeRequest(path: string, options: RequestInit, accessToken: string | null) {
  const headers = new Headers(options.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
}

export function getSession() {
  return { ...sessionState };
}

export function setSession(nextSession: { accessToken: string; profile: Profile }) {
  sessionState = {
    accessToken: nextSession.accessToken,
    profile: nextSession.profile,
  };

  notifySessionListeners();
}

export function clearSession() {
  sessionState = {
    accessToken: null,
    profile: null,
  };

  notifySessionListeners();
}

export function subscribeToSession(listener: SessionListener) {
  sessionListeners.add(listener);

  return () => {
    sessionListeners.delete(listener);
  };
}

export async function refreshSession() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      clearSession();
      return null;
    }

    const data = (await response.json()) as RefreshResponse;
    const profile = decodeAccessToken(data.accessToken);

    setSession({
      accessToken: data.accessToken,
      profile,
    });

    return {
      accessToken: data.accessToken,
      profile,
    };
  })()
    .catch(() => {
      clearSession();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function logoutSession() {
  try {
    await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearSession();
  }
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}) {
  const response = await executeRequest(path, options, sessionState.accessToken);

  if (
    response.status === 401 &&
    sessionState.accessToken &&
    options.retryOnAuthError !== false &&
    path !== "/api/auth/login" &&
    path !== "/api/auth/register" &&
    path !== "/api/auth/refresh"
  ) {
    const nextSession = await refreshSession();

    if (nextSession?.accessToken) {
      const retryResponse = await executeRequest(path, options, nextSession.accessToken);
      return parseResponse<T>(retryResponse);
    }

    if (options.redirectOnAuthError !== false && typeof window !== "undefined") {
      window.location.href = "/auth/login/";
    }
  }

  return parseResponse<T>(response);
}
