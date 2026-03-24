import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { C, S } from "../../src/utils/theme.js";

export function AccountScreen({ user, household, onLogout, onDeleteAccount, onChangePassword }) {
  const [section, setSection]   = useState(null);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]       = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [deletePw, setDeletePw] = useState("");
  const [loading, setLoading]   = useState(false);
  const [feedback, setFeedback] = useState(null);

  function flash(ok, msg) { setFeedback({ ok, msg }); if (ok) setTimeout(() => setFeedback(null), 2500); }

  async function handleChangePassword() {
    if (newPw.length < 8)    return flash(false, "New password must be at least 8 characters.");
    if (newPw !== confirmPw) return flash(false, "Passwords do not match.");
    setLoading(true);
    try { await onChangePassword({ currentPassword: currentPw, newPassword: newPw }); flash(true, "Password changed."); setCurrentPw(""); setNewPw(""); setConfirmPw(""); setSection(null); }
    catch (e) { flash(false, e.message); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deletePw) return flash(false, "Enter your password to confirm.");
    setLoading(true);
    try { await onDeleteAccount(deletePw); }
    catch (e) { flash(false, e.message); setLoading(false); }
  }

  return (
    <ScrollView style={S.screen} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 48 }}>

      {/* User info */}
      <View style={[S.row, { marginBottom: 28 }]}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || "?"}</Text></View>
        <View style={{ marginLeft: 14 }}>
          <Text style={[S.h3]}>{user?.name}</Text>
          <Text style={S.small}>{user?.email}</Text>
          {household && (
            <Text style={{ fontSize: 12, color: C.greenDark, marginTop: 3 }}>
              🏠 {household.name} · {household.ownerUserId === user?.userId ? "Owner" : "Member"}
            </Text>
          )}
        </View>
      </View>

      {feedback && (
        <View style={{ padding: 12, borderRadius: 10, borderWidth: 0.5, marginBottom: 14, backgroundColor: feedback.ok ? C.greenLight : C.redLight, borderColor: feedback.ok ? C.greenBorder : C.redBorder }}>
          <Text style={{ fontSize: 13, color: feedback.ok ? C.greenDark : C.redDark }}>{feedback.msg}</Text>
        </View>
      )}

      {/* Change password */}
      <View style={[S.card, { marginBottom: 12 }]}>
        <TouchableOpacity style={S.rowBetween} onPress={() => { setSection(section === "password" ? null : "password"); setFeedback(null); }}>
          <View style={S.row}><Text style={{ fontSize: 18, marginRight: 12 }}>🔑</Text><Text style={S.body}>Change password</Text></View>
          <Text style={{ color: C.textTertiary, fontSize: 18 }}>{section === "password" ? "−" : "+"}</Text>
        </TouchableOpacity>
        {section === "password" && (
          <View style={{ marginTop: 14 }}>
            {[["Current password", currentPw, setCurrentPw], ["New password", newPw, setNewPw], ["Confirm new password", confirmPw, setConfirmPw]].map(([lbl, val, set]) => (
              <View key={lbl}>
                <Text style={[S.label, { marginBottom: 5 }]}>{lbl}</Text>
                <TextInput style={S.input} value={val} onChangeText={set} secureTextEntry placeholder="••••••••" placeholderTextColor={C.textTertiary} />
              </View>
            ))}
            <TouchableOpacity style={[S.btnPrimary, { backgroundColor: C.green }]} onPress={handleChangePassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={S.btnPrimaryText}>Update password</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sign out */}
      <TouchableOpacity style={[S.card, { flexDirection: "row", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 12 }]} onPress={onLogout}>
        <Text style={{ fontSize: 18 }}>🚪</Text>
        <Text style={[S.body, { fontWeight: "600" }]}>Sign out</Text>
      </TouchableOpacity>

      {/* Delete account */}
      <View style={[S.card, { borderColor: C.redBorder }]}>
        <TouchableOpacity style={S.rowBetween} onPress={() => { setSection(section === "delete" ? null : "delete"); setFeedback(null); }}>
          <View style={S.row}><Text style={{ fontSize: 18, marginRight: 12 }}>🗑️</Text><Text style={[S.body, { color: C.red }]}>Delete account</Text></View>
          <Text style={{ color: C.red, fontSize: 18 }}>{section === "delete" ? "−" : "+"}</Text>
        </TouchableOpacity>
        {section === "delete" && (
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 13, color: C.redDark, marginBottom: 12 }}>This permanently deletes your account and all your data.</Text>
            <Text style={[S.label, { marginBottom: 5 }]}>Confirm with your password</Text>
            <TextInput style={S.input} value={deletePw} onChangeText={setDeletePw} secureTextEntry placeholder="••••••••" placeholderTextColor={C.textTertiary} />
            <TouchableOpacity style={[S.btnPrimary, { backgroundColor: C.red }]} onPress={handleDelete} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={S.btnPrimaryText}>Permanently delete my account</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatar:     { width: 50, height: 50, borderRadius: 25, backgroundColor: C.greenLight, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 20, fontWeight: "700", color: C.greenDark },
});
