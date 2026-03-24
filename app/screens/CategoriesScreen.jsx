import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { C, S } from "../../src/utils/theme.js";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../../src/utils/categories.js";

const EMOJI_OPTIONS = [
  "🛍️","🎮","🐾","🌿","🏖️","🎵","🍷","📚","🧘","🚴","🏥","🎁",
  "🧹","🔧","🌍","🍔","☕","🎓","💊","🏋️","🎨","✈️","🧴","🧃",
  "🥗","🍰","🚌","🎯","💡","🪴","🎪","🧩","🛒","🏠","💼","📱",
];

export function CategoriesScreen({ customCats, onCreateCategory, onDeleteCategory, loading }) {
  const [tab, setTab]           = useState("expense");
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel]       = useState("");
  const [emoji, setEmoji]       = useState("🛍️");
  const [saving, setSaving]     = useState(false);
  const [feedback, setFeedback] = useState(null);

  function flash(ok, msg) {
    setFeedback({ ok, msg });
    if (ok) setTimeout(() => setFeedback(null), 2000);
  }

  async function handleCreate() {
    if (!label.trim()) return flash(false, "Enter a category name.");
    setSaving(true);
    try {
      await onCreateCategory({ label: label.trim(), emoji, type: tab });
      setLabel(""); setShowForm(false);
      flash(true, `"${label.trim()}" added.`);
    } catch (e) { flash(false, e.message); }
    finally { setSaving(false); }
  }

  function confirmDelete(cat) {
    Alert.alert(
      "Delete category",
      `Delete "${cat.label}"? Existing entries using it won't be affected.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDeleteCategory(cat.categoryId) },
      ]
    );
  }

  const builtInCats = tab === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const customForTab = customCats.filter(c => c.type === tab);

  return (
    <ScrollView style={S.screen} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 48 }}>

      {feedback && (
        <View style={{
          padding: 12, borderRadius: 10, borderWidth: 0.5, marginBottom: 14,
          backgroundColor: feedback.ok ? C.greenLight : C.redLight,
          borderColor: feedback.ok ? C.greenBorder : C.redBorder,
        }}>
          <Text style={{ fontSize: 13, color: feedback.ok ? C.greenDark : C.redDark }}>{feedback.msg}</Text>
        </View>
      )}

      {/* Tab toggle */}
      <View style={styles.tabBar}>
        {["expense", "income"].map(t => (
          <TouchableOpacity
            key={t} onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "expense" ? "💸 Expenses" : "💰 Income"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add new category */}
      <View style={S.rowBetween}>
        <Text style={S.sectionTitle}>Custom categories</Text>
        <TouchableOpacity
          onPress={() => setShowForm(v => !v)}
          style={styles.addBtn}
        >
          <Text style={{ fontSize: 12, fontWeight: "500", color: C.text }}>
            {showForm ? "Cancel" : "+ Add"}
          </Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={[S.card, { marginBottom: 16 }]}>
          {/* Emoji picker */}
          <Text style={[S.label, { marginBottom: 8 }]}>Emoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {EMOJI_OPTIONS.map(e => (
              <TouchableOpacity
                key={e} onPress={() => setEmoji(e)}
                style={[styles.emojiBtn, emoji === e && { backgroundColor: C.bgTertiary, borderColor: C.borderMed }]}
              >
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Label */}
          <Text style={[S.label, { marginBottom: 6 }]}>Name</Text>
          <TextInput
            style={S.input}
            placeholder={tab === "expense" ? "e.g. Pet care, Parking…" : "e.g. Bonus, Side job…"}
            placeholderTextColor={C.textTertiary}
            value={label} onChangeText={setLabel}
            autoFocus
          />

          {/* Preview */}
          {label.trim() !== "" && (
            <View style={[S.row, { gap: 8, marginBottom: 14 }]}>
              <Text style={[S.small, { color: C.textTertiary }]}>Preview:</Text>
              <View style={styles.preview}>
                <Text style={{ fontSize: 13 }}>{emoji} {label.trim()}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[S.btnPrimary, { backgroundColor: tab === "income" ? C.green : C.red }]}
            onPress={handleCreate} disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={S.btnPrimaryText}>Save category</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Custom categories list */}
      {customForTab.length > 0 ? (
        <View style={{ borderRadius: 14, borderWidth: 0.5, borderColor: C.border, overflow: "hidden", marginBottom: 24 }}>
          {customForTab.map((cat, i) => (
            <View key={cat.categoryId}>
              {i > 0 && <View style={S.divider} />}
              <View style={[S.rowBetween, { padding: 14 }]}>
                <View style={S.row}>
                  <Text style={{ fontSize: 22, marginRight: 12 }}>{cat.emoji}</Text>
                  <View>
                    <Text style={S.body}>{cat.label}</Text>
                    <Text style={[S.small, { fontSize: 11 }]}>Custom · {tab}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => confirmDelete(cat)} style={styles.deleteBtn}>
                  <Text style={{ fontSize: 12, color: C.red }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[S.small, { textAlign: "center", paddingVertical: 16, marginBottom: 16 }]}>
          No custom {tab} categories yet.
        </Text>
      )}

      {/* Built-in categories (read-only reference) */}
      <Text style={S.sectionTitle}>Built-in categories</Text>
      <View style={{ borderRadius: 14, borderWidth: 0.5, borderColor: C.border, overflow: "hidden" }}>
        {builtInCats.map((cat, i) => (
          <View key={cat.id}>
            {i > 0 && <View style={S.divider} />}
            <View style={[S.row, { padding: 12, paddingHorizontal: 14 }]}>
              <Text style={{ fontSize: 20, marginRight: 12 }}>{cat.emoji}</Text>
              <Text style={[S.body, { flex: 1 }]}>{cat.label}</Text>
              <View style={styles.builtInBadge}>
                <Text style={{ fontSize: 10, color: C.textTertiary }}>built-in</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabBar:        { flexDirection: "row", backgroundColor: C.bgSecondary, borderRadius: 10, padding: 4, marginBottom: 20 },
  tab:           { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 8 },
  tabActive:     { backgroundColor: C.bg, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  tabText:       { fontSize: 13, color: C.textTertiary },
  tabTextActive: { fontWeight: "600", color: C.text },
  addBtn:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary },
  emojiBtn:      { width: 42, height: 42, borderRadius: 10, borderWidth: 0.5, borderColor: "transparent", justifyContent: "center", alignItems: "center", marginRight: 6 },
  preview:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary },
  deleteBtn:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 0.5, borderColor: C.redBorder },
  builtInBadge:  { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, backgroundColor: C.bgTertiary },
});
