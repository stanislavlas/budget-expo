import { useState, useEffect, useCallback } from "react";
import { getMyHousehold, createHousehold as apiCreate, addMember as apiAdd, removeMember as apiRemove, leaveHousehold as apiLeave, deleteHousehold as apiDelete, renameHousehold as apiRename } from "../services/household.js";

export function useHousehold(isAuthenticated) {
  const [household, setHousehold] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetch = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true); setError(null);
    try { setHousehold(await getMyHousehold()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { fetch(); }, [fetch]);

  const createHousehold  = useCallback(async (name)   => {
    try {
      const d = await apiCreate(name);
      setHousehold(d);
      return d;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const addMember        = useCallback(async (email)  => {
    try {
      const d = await apiAdd(email);
      setHousehold(d);
      return d;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const removeMember     = useCallback(async (userId) => {
    try {
      const d = await apiRemove(userId);
      setHousehold(d);
      return d;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const leaveHousehold   = useCallback(async ()       => {
    try {
      await apiLeave();
      setHousehold(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteHousehold  = useCallback(async ()       => {
    try {
      await apiDelete();
      setHousehold(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const renameHousehold  = useCallback(async (name)   => {
    try {
      const d = await apiRename(name);
      setHousehold(d);
      return d;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return { household, loading, error, refresh: fetch, createHousehold, addMember, removeMember, leaveHousehold, deleteHousehold, renameHousehold };
}
