/**
 * Auth Service — React Native / Expo
 * Uses AsyncStorage instead of localStorage. All token ops are async.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";
const KEY_ACCESS  = "budget_access_token";
const KEY_REFRESH = "budget_refresh_token";
const KEY_USER    = "budget_user";

export async function getAccessToken()  { return AsyncStorage.getItem(KEY_ACCESS); }
export async function getRefreshToken() { return AsyncStorage.getItem(KEY_REFRESH); }
export async function getStoredUser() {
  const raw = await AsyncStorage.getItem(KEY_USER);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

async function storeTokens({ accessToken, refreshToken, user }) {
  await AsyncStorage.multiSet([
    [KEY_ACCESS,  accessToken],
    [KEY_REFRESH, refreshToken],
    [KEY_USER,    JSON.stringify(user)],
  ]);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([KEY_ACCESS, KEY_REFRESH, KEY_USER]);
}

function isExpired(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const p = JSON.parse(atob(parts[1]));
    if (!p.exp || typeof p.exp !== 'number') return true;
    return Date.now() / 1000 > p.exp - 30;
  } catch { return true; }
}

export async function authRequest(path, options = {}) {
  let token = await getAccessToken();
  if (!token || isExpired(token)) {
    try {
      token = await refreshAccessToken();
    } catch (err) {
      if (err.code === "AUTH_EXPIRED") throw err;
      throw Object.assign(new Error("Session expired. Please log in again."), { code: "AUTH_EXPIRED" });
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });

  if (res.status === 401) {
    await clearTokens();
    throw Object.assign(new Error("Session expired. Please log in again."), { code: "AUTH_EXPIRED" });
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

export async function register({ name, email, password }) {
  const res  = await fetch(`${API_BASE}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  await storeTokens(data);
  return data.user;
}

export async function login({ email, password }) {
  const res  = await fetch(`${API_BASE}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  await storeTokens(data);
  return data.user;
}

export async function logout() {
  const refreshToken = await getRefreshToken();
  try { await fetch(`${API_BASE}/auth/logout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }) }); } catch {}
  await clearTokens();
}

export async function refreshAccessToken() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");
  const res  = await fetch(`${API_BASE}/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }) });
  const data = await res.json();
  if (!res.ok) { await clearTokens(); throw Object.assign(new Error("Session expired"), { code: "AUTH_EXPIRED" }); }
  await AsyncStorage.multiSet([[KEY_ACCESS, data.accessToken], [KEY_REFRESH, data.refreshToken]]);
  return data.accessToken;
}

export async function deleteAccount(password) {
  await authRequest("/auth/account", { method: "DELETE", body: JSON.stringify({ password }) });
  await clearTokens();
}

export async function changePassword({ currentPassword, newPassword }) {
  return authRequest("/auth/password", { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) });
}
