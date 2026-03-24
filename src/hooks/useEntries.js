import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { listEntries, putEntry, deleteEntry as apiDeleteEntry } from "../services/dynamodb.js";

const LS_KEY = "budget_cache";

async function loadCache() {
  try { return JSON.parse(await AsyncStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
async function saveCache(entries) {
  try { await AsyncStorage.setItem(LS_KEY, JSON.stringify(entries)); } catch {}
}

export function useEntries(yearMonth, isAuthenticated, householdId = null) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const pendingRef            = useRef(new Set());

  const filtered = entries.filter(e => !yearMonth || e.date?.startsWith(yearMonth));

  const fetchEntries = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const data = await listEntries(yearMonth, householdId);
      setEntries(prev => {
        const pending = prev.filter(e => pendingRef.current.has(e.entryId));
        const seen    = new Set();
        const deduped = [...data, ...pending].filter(e => {
          if (seen.has(e.entryId)) return false;
          seen.add(e.entryId); return true;
        });
        saveCache(deduped);
        return deduped;
      });
    } catch (err) {
      setError(err.message);
      loadCache().then(cached => setEntries(cached));
    } finally { setLoading(false); }
  }, [yearMonth, isAuthenticated, householdId]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const addEntry = useCallback(async (entry) => {
    const stamped = householdId ? { ...entry, householdId } : entry;
    pendingRef.current.add(stamped.entryId);
    setEntries(prev => { const n = [stamped, ...prev]; saveCache(n); return n; });
    try { await putEntry(stamped); }
    catch (err) {
      setEntries(prev => { const n = prev.filter(e => e.entryId !== stamped.entryId); saveCache(n); return n; });
      throw err;
    } finally { pendingRef.current.delete(stamped.entryId); }
  }, [householdId]);

  const updateEntry = useCallback(async (updated) => {
    const original = entries.find(e => e.entryId === updated.entryId);
    setEntries(prev => { const n = prev.map(e => e.entryId === updated.entryId ? updated : e); saveCache(n); return n; });
    try {
      await putEntry(updated);
    } catch (err) {
      if (original) {
        setEntries(prev => { const n = prev.map(e => e.entryId === updated.entryId ? original : e); saveCache(n); return n; });
      }
      throw err;
    }
  }, [entries]);

  const removeEntry = useCallback(async (entryId) => {
    let backup = null;
    setEntries(prev => {
      backup = prev.find(e => e.entryId === entryId);
      const n = prev.filter(e => e.entryId !== entryId);
      saveCache(n);
      return n;
    });
    try { await apiDeleteEntry(entryId); }
    catch { if (backup) setEntries(prev => { const n = [backup, ...prev]; saveCache(n); return n; }); }
  }, []);

  return { entries: filtered, allEntries: entries, loading, error, addEntry, updateEntry, removeEntry, refresh: fetchEntries };
}
