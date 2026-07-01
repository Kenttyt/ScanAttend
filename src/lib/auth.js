const TOKEN_KEY = 'sat_token';
const USER_KEY = 'sat_user';

export async function login(loginId, password) {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Invalid credentials' }));
      return { error: error.message || 'Invalid credentials' };
    }

    const data = await response.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return { user: data.user, token: data.token };
  } catch {
    return { error: 'Cannot connect to server' };
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
