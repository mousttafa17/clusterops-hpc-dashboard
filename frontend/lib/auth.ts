import { setAuthToken } from "./api";

const TOKEN_KEY = "clusterops_token";
const USER_KEY = "clusterops_user";

export type StoredUser = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

export function saveAuth(token: string, user: StoredUser) {
  if (typeof window === "undefined") return;

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setAuthToken(token);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;

  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
}

export function loadAuthFromStorage() {
  const token = getToken();
  if (token) {
    setAuthToken(token);
  }
  return token;
}

export function logout() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  setAuthToken(null);
  window.location.href = "/login";
}

export function extractAuthPayload(responseData: unknown) {
  const responseObject =
    responseData && typeof responseData === "object"
      ? (responseData as { data?: unknown })
      : null;
  const payload = responseObject?.data || responseData;
  const payloadObject =
    payload && typeof payload === "object"
      ? (payload as { token?: unknown; user?: unknown })
      : null;

  if (
    typeof payloadObject?.token !== "string" ||
    !payloadObject.user ||
    typeof payloadObject.user !== "object"
  ) {
    throw new Error("Login response did not include a valid token and user.");
  }

  return {
    token: payloadObject.token,
    user: payloadObject.user as StoredUser,
  };
}
