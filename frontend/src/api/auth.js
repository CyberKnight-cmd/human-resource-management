import { api, getTokens, setTokens } from './client';

export async function login(email, password) {
  const tokens = await api.post('/auth/login', { email, password });
  setTokens(tokens);
  return tokens;
}

export async function logout() {
  const tokens = getTokens();
  if (tokens?.refresh_token) {
    try {
      await api.post('/auth/logout', { refresh_token: tokens.refresh_token });
    } catch {
      // Best-effort server-side revoke — the local session clears either way.
    }
  }
  setTokens(null);
}
