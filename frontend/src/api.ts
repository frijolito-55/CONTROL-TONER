const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:8000`;

export function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
  });
}