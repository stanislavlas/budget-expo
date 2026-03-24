import { useState, useEffect, useCallback } from "react";
import {
  getStoredUser, getAccessToken, clearTokens,
  login as apiLogin, register as apiRegister,
  logout as apiLogout, deleteAccount as apiDeleteAccount,
  changePassword as apiChangePassword,
} from "../services/auth.js";

export function useAuth() {
  const [user, setUser]       = useState(null);
  const [ready, setReady]     = useState(false); // true once AsyncStorage is checked
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Rehydrate session from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      const [storedUser, token] = await Promise.all([getStoredUser(), getAccessToken()]);
      if (storedUser && token) setUser(storedUser);
      setReady(true);
    })();
  }, []);

  const isAuthenticated = !!(user);
  const clearError = () => setError(null);

  const login = useCallback(async (credentials) => {
    setLoading(true); setError(null);
    try { const u = await apiLogin(credentials); setUser(u); return u; }
    catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }, []);

  const register = useCallback(async (data) => {
    setLoading(true); setError(null);
    try { const u = await apiRegister(data); setUser(u); return u; }
    catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try { await apiLogout(); } catch {}
    await clearTokens();
    setUser(null);
    setLoading(false);
  }, []);

  const deleteAccount = useCallback(async (password) => {
    setLoading(true); setError(null);
    try { await apiDeleteAccount(password); setUser(null); }
    catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }, []);

  const changePassword = useCallback(async (passwords) => {
    setLoading(true); setError(null);
    try { await apiChangePassword(passwords); }
    catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }, []);

  // Called by authRequest when a 401 slips through
  const handleSessionExpired = useCallback(() => {
    setUser(null);
  }, []);

  return { user, isAuthenticated, ready, loading, error, clearError, login, register, logout, deleteAccount, changePassword, handleSessionExpired };
}
