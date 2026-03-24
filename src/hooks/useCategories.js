import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  listCustomCategories,
  createCustomCategory as apiCreate,
  deleteCustomCategory as apiDelete,
} from "../services/customCategories.js";
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
} from "../utils/categories.js";

const CACHE_KEY = "budget_custom_categories";

// Palette for auto-assigning colors to new custom categories
const COLOR_PALETTE = [
  "#7F77DD", "#1D9E75", "#D85A30", "#378ADD", "#EF9F27",
  "#D4537E", "#5DCAA5", "#534AB7", "#BA7517", "#185FA5",
  "#993556", "#63B3ED", "#888780", "#F0997B", "#AFA9EC",
];

function pickColor(index) {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

async function loadCached() {
  try { return JSON.parse(await AsyncStorage.getItem(CACHE_KEY) || "[]"); } catch { return []; }
}
async function saveCache(cats) {
  try { await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cats)); } catch {}
}

export function useCategories(isAuthenticated) {
  const [customCats, setCustomCats] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  // Fetch custom categories from API, fall back to cache
  const fetchCustom = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await listCustomCategories();
      setCustomCats(data);
      await saveCache(data);
    } catch (e) {
      setError(e.message);
      setCustomCats(await loadCached());
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchCustom(); }, [fetchCustom]);

  // Merge built-ins + custom, assigning colors to custom ones
  const incomeCategories = [
    ...INCOME_CATEGORIES,
    ...customCats.filter(c => c.type === "income"),
  ];
  const expenseCategories = [
    ...EXPENSE_CATEGORIES,
    ...customCats.filter(c => c.type === "expense"),
  ];
  const allCategories = [...incomeCategories, ...expenseCategories];

  // Merged color map — built-in colors + auto-assigned for custom
  const colorMap = {
    ...CATEGORY_COLORS.byId,
    ...Object.fromEntries(
      customCats.map((c, i) => [c.categoryId, c.color || pickColor(i)])
    ),
  };

  function getCategoryById(id) {
    return allCategories.find(c => (c.id || c.categoryId) === id)
      || { id, categoryId: id, label: id, emoji: "❓" };
  }

  // Create a new custom category
  const createCategory = useCallback(async ({ label, emoji, type }) => {
    const data = await apiCreate({ label, emoji, type });
    setCustomCats(prev => {
      const updated = [...prev, data];
      saveCache(updated);
      return updated;
    });
    return data;
  }, []);

  // Delete a custom category
  const deleteCategory = useCallback(async (categoryId) => {
    await apiDelete(categoryId);
    setCustomCats(prev => {
      const updated = prev.filter(c => c.categoryId !== categoryId);
      saveCache(updated);
      return updated;
    });
  }, []);

  return {
    incomeCategories,
    expenseCategories,
    allCategories,
    customCats,
    colorMap,
    getCategoryById,
    loading,
    error,
    createCategory,
    deleteCategory,
    refresh: fetchCustom,
  };
}
