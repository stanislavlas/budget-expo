import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { C, S } from "../../src/utils/theme.js";
import { newEntryId } from "../../src/services/dynamodb.js";

export function AddScreen({ onAdd, authorName, incomeCategories, expenseCategories, colorMap }) {
  const [type, setType]         = useState("expense");
  const [amount, setAmount]     = useState("");
  const [category, setCategory] = useState(() => expenseCategories[0]?.id || expenseCategories[0]?.categoryId || "");
  const [necessity, setNecessity] = useState("necessary"); // "necessary" | "optional"
  const [note, setNote]         = useState("");
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving]     = useState(false);
  const [flash, setFlash]       = useState(null);

  const cats = type === "income" ? incomeCategories : expenseCategories;

  function switchType(t) {
    setType(t);
    const first = t === "income" ? incomeCategories[0] : expenseCategories[0];
    setCategory(first?.id || first?.categoryId || "");
  }

  async function handleSubmit() {
    const amt = parseFloat(amount.replace(",", "."));
    if (!amt || amt <= 0) { setFlash({ ok: false, msg: "Enter a valid amount" }); return; }
    setSaving(true);
    try {
      await onAdd({
        entryId:   newEntryId(),
        type,
        amount:    amt,
        category,
        necessity: type === "expense" ? necessity : undefined,
        note:      note.trim(),
        date,
        source:    "manual",
        authorName: authorName || undefined,
      });
      setAmount(""); setNote("");
      setFlash({ ok: true, msg: "✓ Saved" });
      setTimeout(() => setFlash(null), 1800);
    } catch (e) {
      setFlash({ ok: false, msg: e.message || "Failed to save" });
    } finally { setSaving(false); }
  }

  const accent      = type === "income" ? C.green : C.red;
  const accentLight = type === "income" ? C.greenLight : C.redLight;

  return (
    <KeyboardAvoidingView style={S.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type toggle */}
        <View style={[S.row, { gap: 8, marginBottom: 22 }]}>
          {["expense", "income"].map(t => (
            <TouchableOpacity
              key={t} onPress={() => switchType(t)}
              style={[styles.typeBtn, type === t && {
                borderColor: t === "income" ? C.green : C.red,
                backgroundColor: t === "income" ? C.greenLight : C.redLight,
              }]}
            >
              <Text style={[styles.typeBtnText, type === t && {
                color: t === "income" ? C.greenDark : C.redDark, fontWeight: "700",
              }]}>
                {t === "income" ? "💰 Income" : "💸 Expense"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <Text style={[S.label, { marginBottom: 6 }]}>Amount (EUR)</Text>
        <TextInput
          style={[S.input, { fontSize: 32, fontFamily: "Courier", fontWeight: "700", textAlign: "center", borderColor: accent }]}
          placeholder="0.00" placeholderTextColor={C.textTertiary}
          value={amount} onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        {/* Necessity toggle — expense only */}
        {type === "expense" && (
          <>
            <Text style={[S.label, { marginBottom: 8 }]}>Type</Text>
            <View style={[S.row, { gap: 8, marginBottom: 20 }]}>
              <TouchableOpacity
                onPress={() => setNecessity("necessary")}
                style={[styles.necessityBtn,
                  necessity === "necessary" && { borderColor: C.blue, backgroundColor: "#E6F1FB" }
                ]}
              >
                <Text style={styles.necessityIcon}>🔒</Text>
                <View>
                  <Text style={[styles.necessityLabel, necessity === "necessary" && { color: "#185FA5", fontWeight: "700" }]}>
                    Necessary
                  </Text>
                  <Text style={styles.necessityHint}>Can't cut this</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setNecessity("optional")}
                style={[styles.necessityBtn,
                  necessity === "optional" && { borderColor: C.amber, backgroundColor: "#FAEEDA" }
                ]}
              >
                <Text style={styles.necessityIcon}>✂️</Text>
                <View>
                  <Text style={[styles.necessityLabel, necessity === "optional" && { color: "#854F0B", fontWeight: "700" }]}>
                    Optional
                  </Text>
                  <Text style={styles.necessityHint}>Could save here</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Category */}
        <Text style={[S.label, { marginBottom: 8 }]}>Category</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {cats.map(cat => {
            const catId  = cat.id || cat.categoryId;
            const active = category === catId;
            const color  = colorMap[catId] || C.textSecondary;
            return (
              <TouchableOpacity
                key={catId} onPress={() => setCategory(catId)}
                style={[styles.chip, active && { borderColor: color, backgroundColor: color + "20" }]}
              >
                <Text style={[styles.chipText, active && { color, fontWeight: "600" }]}>
                  {cat.emoji} {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Note */}
        <Text style={[S.label, { marginBottom: 6 }]}>Note (optional)</Text>
        <TextInput
          style={S.input} placeholder="What was it for?"
          placeholderTextColor={C.textTertiary} value={note} onChangeText={setNote}
        />

        {/* Date */}
        <Text style={[S.label, { marginBottom: 6 }]}>Date</Text>
        <TextInput
          style={S.input} value={date} onChangeText={setDate}
          placeholder="YYYY-MM-DD" placeholderTextColor={C.textTertiary}
        />

        {flash && (
          <Text style={{ textAlign: "center", fontSize: 14, color: flash.ok ? C.green : C.red, marginBottom: 8 }}>
            {flash.msg}
          </Text>
        )}

        <TouchableOpacity
          style={[S.btnPrimary, { backgroundColor: accent }]}
          onPress={handleSubmit} disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={S.btnPrimaryText}>Add {type}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  typeBtn:        { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bgSecondary, alignItems: "center" },
  typeBtnText:    { fontSize: 14, fontWeight: "400", color: C.textTertiary },
  chip:           { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary },
  chipText:       { fontSize: 13, color: C.textSecondary },
  necessityBtn:   { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bgSecondary },
  necessityIcon:  { fontSize: 20 },
  necessityLabel: { fontSize: 14, fontWeight: "500", color: C.text },
  necessityHint:  { fontSize: 11, color: C.textTertiary, marginTop: 1 },
});
