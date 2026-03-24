import { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { C, S, fmt } from "../../src/utils/theme.js";
import { INCOME_CATEGORIES } from "../../src/utils/categories.js";

const NECESSITY_STYLE = {
  necessary: { bg: "#E6F1FB", color: "#185FA5", label: "🔒 Necessary" },
  optional:  { bg: "#FAEEDA", color: "#854F0B", label: "✂️ Optional"  },
};

export function HistoryScreen({ entries, onDelete, onUpdate, household, allCategories, colorMap, getCategoryById }) {
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [necessityFilter, setNecessityFilter] = useState("all"); // "all" | "necessary" | "optional"

  const filtered = useMemo(() => {
    let list = entries;
    if (typeFilter !== "all")      list = list.filter(e => e.type === typeFilter);
    if (necessityFilter !== "all") list = list.filter(e => {
      if (necessityFilter === "necessary") return e.necessity === "necessary" || !e.necessity;
      return e.necessity === "optional";
    });
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.note?.toLowerCase().includes(q) || getCategoryById(e.category).label.toLowerCase().includes(q));
    }
    return list;
  }, [entries, typeFilter, necessityFilter, search]);

  function confirmDelete(entryId, note) {
    Alert.alert("Delete entry", `Delete "${note || "this entry"}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(entryId) },
    ]);
  }

  async function cycleNecessity(entry) {
    const next = entry.necessity === "optional" ? "necessary" : "optional";
    await onUpdate({ ...entry, necessity: next });
  }

  return (
    <View style={S.screen}>
      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        {/* Search */}
        <View style={styles.searchRow}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={{ flex: 1, fontSize: 14, color: C.text }}
            placeholder="Search transactions…" placeholderTextColor={C.textTertiary}
            value={search} onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ fontSize: 20, color: C.textTertiary }}>×</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filters row 1 — type */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          <View style={[S.row, { gap: 6, paddingBottom: 4 }]}>
            {["all","income","expense"].map(t => (
              <TouchableOpacity key={t} onPress={() => setTypeFilter(t)}
                style={[styles.chip, typeFilter === t && {
                  backgroundColor: t === "income" ? C.greenLight : t === "expense" ? C.redLight : C.bgTertiary,
                  borderColor:     t === "income" ? C.green      : t === "expense" ? C.red      : C.borderMed,
                }]}>
                <Text style={[styles.chipText, typeFilter === t && {
                  fontWeight: "600",
                  color: t === "income" ? C.greenDark : t === "expense" ? C.redDark : C.text,
                }]}>
                  {t === "all" ? "All" : t === "income" ? "💰 Income" : "💸 Expenses"}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={{ width: 0.5, backgroundColor: C.border, marginHorizontal: 4 }} />

            {/* Necessity filter — only useful when showing expenses */}
            {["all","necessary","optional"].map(n => (
              <TouchableOpacity key={n} onPress={() => setNecessityFilter(n)}
                style={[styles.chip, necessityFilter === n && {
                  backgroundColor: n === "necessary" ? "#E6F1FB" : n === "optional" ? "#FAEEDA" : C.bgTertiary,
                  borderColor:     n === "necessary" ? C.blue    : n === "optional" ? C.amber   : C.borderMed,
                }]}>
                <Text style={[styles.chipText, necessityFilter === n && { fontWeight: "600",
                  color: n === "necessary" ? "#185FA5" : n === "optional" ? "#854F0B" : C.text,
                }]}>
                  {n === "all" ? "All types" : n === "necessary" ? "🔒 Necessary" : "✂️ Optional"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={[S.divider, { marginTop: 10, marginBottom: 4 }]} />
        <Text style={[S.small, { paddingVertical: 6 }]}>
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
        </Text>
        <View style={S.divider} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {filtered.length === 0 ? (
          <Text style={[S.small, { textAlign: "center", paddingVertical: 48 }]}>
            {search || typeFilter !== "all" || necessityFilter !== "all" ? "No matching transactions" : "No transactions this month"}
          </Text>
        ) : filtered.map(entry => {
          const cat      = getCategoryById(entry.category);
          const color    = colorMap[entry.category] || "#888";
          const expanded = expandedId === entry.entryId;
          const ns       = NECESSITY_STYLE[entry.necessity || "necessary"];

          return (
            <View key={entry.entryId} style={{ borderBottomWidth: 0.5, borderBottomColor: C.border }}>
              <TouchableOpacity
                style={styles.entryRow}
                onPress={() => setExpandedId(expanded ? null : entry.entryId)}
                activeOpacity={0.7}
              >
                <View style={[styles.catIcon, { backgroundColor: color + "20" }]}>
                  <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={[S.row, { gap: 6 }]}>
                    <Text style={[S.body, { fontWeight: "500", flexShrink: 1 }]} numberOfLines={1}>
                      {entry.note || cat.label}
                    </Text>
                    {/* Necessity badge — expense only */}
                    {entry.type === "expense" && (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: ns.bg }}>
                        <Text style={{ fontSize: 10, color: ns.color }}>
                          {entry.necessity === "optional" ? "✂️" : "🔒"}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={S.small}>
                    {cat.label} · {entry.date?.slice(5).replace("-","/")}
                    {household && entry.authorName ? ` · ${entry.authorName}` : ""}
                  </Text>
                </View>
                <Text style={[styles.amount, { color: entry.type === "income" ? C.green : C.red }]}>
                  {entry.type === "income" ? "+" : "−"}{fmt(entry.amount)}
                </Text>
              </TouchableOpacity>

              {expanded && (
                <View style={{ paddingLeft: 52, paddingBottom: 14 }}>
                  {/* Necessity toggle for expenses */}
                  {entry.type === "expense" && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={[S.label, { marginBottom: 8 }]}>Mark as</Text>
                      <View style={[S.row, { gap: 8 }]}>
                        {["necessary","optional"].map(n => {
                          const active = (entry.necessity || "necessary") === n;
                          const nstyle = NECESSITY_STYLE[n];
                          return (
                            <TouchableOpacity key={n} onPress={() => onUpdate({ ...entry, necessity: n })}
                              style={[styles.necessityBtn, active && { backgroundColor: nstyle.bg, borderColor: n === "necessary" ? C.blue : C.amber }]}>
                              <Text style={{ fontSize: 12, color: active ? nstyle.color : C.textTertiary, fontWeight: active ? "600" : "400" }}>
                                {nstyle.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Category picker */}
                  <Text style={[S.label, { marginBottom: 8 }]}>Change category</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {allCategories.map(c => {
                      const cId   = c.id || c.categoryId;
                      const active = entry.category === cId;
                      const cc    = colorMap[cId] || "#888";
                      return (
                        <TouchableOpacity key={cId} onPress={async () => {
                          const isInc = INCOME_CATEGORIES.find(ic => ic.id === cId);
                          await onUpdate({ ...entry, category: cId, type: isInc ? "income" : "expense" });
                          setExpandedId(null);
                        }} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 0.5, borderColor: active ? cc : C.border, backgroundColor: active ? cc + "20" : C.bgSecondary }}>
                          <Text style={{ fontSize: 12, color: active ? cc : C.textSecondary }}>{c.emoji} {c.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TouchableOpacity onPress={() => confirmDelete(entry.entryId, entry.note)} style={styles.deleteBtn}>
                    <Text style={{ fontSize: 12, color: C.red }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow:     { flexDirection: "row", alignItems: "center", backgroundColor: C.bgSecondary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 0.5, borderColor: C.border },
  chip:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary },
  chipText:      { fontSize: 12, color: C.textTertiary },
  entryRow:      { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13 },
  catIcon:       { width: 40, height: 40, borderRadius: 11, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  amount:        { fontSize: 15, fontFamily: "Courier", fontWeight: "700", flexShrink: 0 },
  deleteBtn:     { alignSelf: "flex-start", borderWidth: 0.5, borderColor: C.red, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  necessityBtn:  { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: "center" },
});
