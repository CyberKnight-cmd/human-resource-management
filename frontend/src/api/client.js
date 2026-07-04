const BASE_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'aether_hr_tokens';

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function getTokens() {
  const raw = localStorage.getItem(TOKEN_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setTokens(tokens) {
  if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  else localStorage.removeItem(TOKEN_KEY);
}

function rawFetch(path, method, body) {
  const tokens = getTokens();
  const headers = { 'Content-Type': 'application/json' };
  if (tokens?.access_token) headers.Authorization = `Bearer ${tokens.access_token}`;
  return fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

// Refresh-on-401 is single-flight: concurrent requests that all 401 at once
// share one refresh call instead of racing the backend with N refresh attempts.
let refreshInFlight = null;

async function refreshAccessToken() {
  const tokens = getTokens();
  if (!tokens?.refresh_token) throw new ApiError('INVALID_TOKEN', 'No refresh token available', 401);

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });
  if (!res.ok) {
    setTokens(null);
    throw new ApiError('INVALID_TOKEN', 'Session expired, please sign in again', 401);
  }
  const newTokens = await res.json();
  setTokens(newTokens);
  return newTokens;
}

async function parseResponse(res) {
  if (res.status === 204) return null;
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const err = data?.error || { code: 'APP_ERROR', message: 'Something went wrong' };
    throw new ApiError(err.code, err.message, res.status);
  }
  return data;
}

export async function request(path, { method = 'GET', body, isRetry = false } = {}) {
  const res = await rawFetch(path, method, body);

  if (res.status === 401 && !isRetry && path !== '/auth/login') {
    if (!refreshInFlight) {
      refreshInFlight = refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
    }
    await refreshInFlight;
    return request(path, { method, body, isRetry: true });
  }

  return parseResponse(res);
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
};
