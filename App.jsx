import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, ScrollView } from "react-native";
import { useAuth }         from "./src/hooks/useAuth.js";
import { useEntries }      from "./src/hooks/useEntries.js";
import { useHousehold }    from "./src/hooks/useHousehold.js";
import { useCategories }   from "./src/hooks/useCategories.js";
import { AuthScreen }        from "./app/screens/AuthScreen.jsx";
import { DashboardScreen }   from "./app/screens/DashboardScreen.jsx";
import { AddScreen }         from "./app/screens/AddScreen.jsx";
import { HistoryScreen }     from "./app/screens/HistoryScreen.jsx";
import { HouseholdScreen }   from "./app/screens/HouseholdScreen.jsx";
import { CategoriesScreen }  from "./app/screens/CategoriesScreen.jsx";
import { AccountScreen }     from "./app/screens/AccountScreen.jsx";
import { C, MONTH_LABELS }   from "./src/utils/theme.js";

const TABS = [
  { id: "dashboard",  label: "Overview",    emoji: "📊" },
  { id: "add",        label: "Add",         emoji: "➕" },
  { id: "history",    label: "History",     emoji: "📋" },
  { id: "categories", label: "Categories",  emoji: "🏷️" },
  { id: "household",  label: "Home",        emoji: "🏠" },
  { id: "account",    label: "Account",     emoji: "👤" },
];

function buildMonths() {
  return Array.from({ length: 36 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });
}

export default function App() {
  const auth = useAuth();
  const { user, isAuthenticated, ready, loading: authLoading, error: authError, clearError, login, register, logout, deleteAccount, changePassword } = auth;

  const [tab, setTab]               = useState("dashboard");
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const { household, createHousehold, addMember, removeMember, leaveHousehold, deleteHousehold, renameHousehold } = useHousehold(isAuthenticated);
  const householdId = household?.householdId || null;

  const { entries, allEntries, loading: entriesLoading, error: entriesError, addEntry, updateEntry, removeEntry } = useEntries(filterMonth, isAuthenticated, householdId);

  const { incomeCategories, expenseCategories, allCategories, customCats, colorMap, getCategoryById, createCategory, deleteCategory } = useCategories(isAuthenticated);

  // Splash screen while AsyncStorage rehydrates
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>💰</Text>
        <ActivityIndicator color={C.green} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onLogin={login} onRegister={register} loading={authLoading} error={authError} onClearError={clearError} />;
  }

  const d = new Date(filterMonth + "-01");
  const monthLabel = `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
  const months = buildMonths();

  // Category data passed down to all screens
  const catProps = { incomeCategories, expenseCategories, allCategories, colorMap, getCategoryById };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={[styles.headerTitle]}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: C.text, letterSpacing: -0.5 }}>Budget</Text>
            {household && (
              <View style={styles.householdBadge}>
                <Text style={{ fontSize: 11, color: C.greenDark }}>🏠 {household.name}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => setShowMonthPicker(v => !v)}>
            <Text style={{ fontSize: 13, color: C.textTertiary, marginTop: 1 }}>{monthLabel} ▾</Text>
          </TouchableOpacity>
        </View>
        {entriesLoading && <ActivityIndicator color={C.green} size="small" />}
      </View>

      {/* Month picker */}
      {showMonthPicker && (
        <View style={styles.monthPicker}>
          <ScrollView>
            {months.map(m => {
              const md = new Date(m + "-01");
              return (
                <TouchableOpacity key={m} style={[styles.monthOption, m === filterMonth && { backgroundColor: C.greenLight }]}
                  onPress={() => { setFilterMonth(m); setShowMonthPicker(false); }}>
                  <Text style={{ fontSize: 14, color: m === filterMonth ? C.greenDark : C.text, fontWeight: m === filterMonth ? "600" : "400" }}>
                    {MONTH_LABELS[md.getMonth()]} {md.getFullYear()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Error banner */}
      {entriesError && (
        <View style={styles.errorBanner}>
          <Text style={{ fontSize: 13, color: C.redDark }}>⚠ {entriesError} — showing cached data</Text>
        </View>
      )}

      {/* Screens */}
      <View style={{ flex: 1 }}>
        {tab === "dashboard" && (
          <DashboardScreen entries={entries} allEntries={allEntries} filterMonth={filterMonth} household={household} {...catProps} />
        )}
        {tab === "add" && (
          <AddScreen onAdd={addEntry} authorName={user?.name} incomeCategories={incomeCategories} expenseCategories={expenseCategories} colorMap={colorMap} />
        )}
        {tab === "history" && (
          <HistoryScreen entries={entries} onDelete={removeEntry} onUpdate={updateEntry} household={household} {...catProps} />
        )}
        {tab === "categories" && (
          <CategoriesScreen customCats={customCats} onCreateCategory={createCategory} onDeleteCategory={deleteCategory} />
        )}
        {tab === "household" && (
          <HouseholdScreen household={household} user={user} onCreate={createHousehold} onAddMember={addMember} onRemoveMember={removeMember} onLeave={leaveHousehold} onDelete={deleteHousehold} onRename={renameHousehold} />
        )}
        {tab === "account" && (
          <AccountScreen user={user} household={household} onLogout={logout} onDeleteAccount={deleteAccount} onChangePassword={changePassword} />
        )}
      </View>

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <TouchableOpacity
              key={t.id} style={styles.tabItem}
              onPress={() => { setTab(t.id); setShowMonthPicker(false); }}
              activeOpacity={0.7}
            >
              <View style={{ position: "relative" }}>
                <Text style={{ fontSize: 18 }}>{t.emoji}</Text>
                {t.id === "household" && household && (
                  <View style={styles.dot} />
                )}
              </View>
              <Text style={[styles.tabLabel, { color: active ? C.text : C.textTertiary, fontWeight: active ? "700" : "400" }]}>
                {t.label}
              </Text>
              {active && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.08)" },
  headerTitle:    { flexDirection: "row", alignItems: "center", gap: 8 },
  householdBadge: { backgroundColor: C.greenLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 0.5, borderColor: C.greenBorder },
  monthPicker:    { position: "absolute", top: 70, left: 20, right: 20, backgroundColor: C.bg, borderRadius: 14, borderWidth: 0.5, borderColor: C.border, zIndex: 100, maxHeight: 300, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  monthOption:    { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.05)" },
  errorBanner:    { marginHorizontal: 20, marginTop: 8, padding: 10, borderRadius: 10, backgroundColor: C.redLight, borderWidth: 0.5, borderColor: C.redBorder },
  tabBar:         { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: "rgba(0,0,0,0.08)", backgroundColor: C.bg, paddingBottom: 4 },
  tabItem:        { flex: 1, alignItems: "center", paddingTop: 8, paddingBottom: 4, gap: 2, position: "relative" },
  tabLabel:       { fontSize: 9 },
  tabIndicator:   { position: "absolute", bottom: 0, width: 18, height: 2.5, borderRadius: 2, backgroundColor: C.text },
  dot:            { position: "absolute", top: -2, right: -4, width: 7, height: 7, borderRadius: 4, backgroundColor: C.green, borderWidth: 1.5, borderColor: C.bg },
});
