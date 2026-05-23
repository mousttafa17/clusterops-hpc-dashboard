import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("clusterops_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function getApiUrl() {
  return API_URL;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data;
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const errorData = data as { message?: unknown; error?: unknown };

  if (typeof errorData.message === "string") {
    return errorData.message;
  }

  if (typeof errorData.error === "string") {
    return errorData.error;
  }

  return fallback;
}
