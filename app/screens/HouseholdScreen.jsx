import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { C, S } from "../../src/utils/theme.js";

export function HouseholdScreen({ household, user, onCreate, onAddMember, onRemoveMember, onLeave, onDelete, onRename }) {
  const [view, setView]       = useState("main");
  const [nameInput, setName]  = useState("");
  const [emailInput, setEmail]= useState("");
  const [busy, setBusy]       = useState(false);
  const [feedback, setFeedback] = useState(null);

  const isOwner = household?.ownerUserId === user?.userId;

  function flash(ok, msg) { setFeedback({ ok, msg }); if (ok) setTimeout(() => setFeedback(null), 2500); }

  async function handleCreate() {
    if (!nameInput.trim()) return flash(false, "Enter a household name.");
    setBusy(true);
    try { await onCreate(nameInput.trim()); setName(""); setView("main"); }
    catch (e) { flash(false, e.message); }
    finally { setBusy(false); }
  }

  async function handleAddMember() {
    if (!emailInput.includes("@")) return flash(false, "Enter a valid email address.");
    setBusy(true);
    try { await onAddMember(emailInput.trim().toLowerCase()); setEmail(""); setView("main"); flash(true, "Member added."); }
    catch (e) { flash(false, e.message); }
    finally { setBusy(false); }
  }

  function confirmRemove(memberId, memberName) {
    Alert.alert("Remove member", `Remove ${memberName} from the household?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => { try { await onRemoveMember(memberId); } catch (e) { flash(false, e.message); } } },
    ]);
  }

  function confirmLeave() {
    Alert.alert("Leave household", "You will lose access to all shared entries.", [
      { text: "Cancel", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: async () => { try { await onLeave(); } catch (e) { flash(false, e.message); } } },
    ]);
  }

  function confirmDelete() {
    Alert.alert("Delete household", "All members will be unlinked. Transaction data is kept.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await onDelete(); } catch (e) { flash(false, e.message); } } },
    ]);
  }

  async function handleRename() {
    if (!nameInput.trim()) return flash(false, "Enter a name.");
    setBusy(true);
    try { await onRename(nameInput.trim()); setName(""); setView("main"); }
    catch (e) { flash(false, e.message); }
    finally { setBusy(false); }
  }

  return (
    <ScrollView style={S.screen} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 40 }}>
      {feedback && (
        <View style={{ padding: 12, borderRadius: 10, borderWidth: 0.5, marginBottom: 14, backgroundColor: feedback.ok ? C.greenLight : C.redLight, borderColor: feedback.ok ? C.greenBorder : C.redBorder }}>
          <Text style={{ fontSize: 13, color: feedback.ok ? C.greenDark : C.redDark }}>{feedback.msg}</Text>
        </View>
      )}

      {/* No household */}
      {!household ? (
        <>
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🏠</Text>
            <Text style={[S.h2, { marginBottom: 8 }]}>No household yet</Text>
            <Text style={[S.small, { textAlign: "center", maxWidth: 280 }]}>Create a household to share your budget. Everyone sees all transactions.</Text>
          </View>
          <Text style={[S.label, { marginBottom: 6 }]}>Household name</Text>
          <TextInput style={S.input} placeholder="e.g. Our Home, Family Budget…" placeholderTextColor={C.textTertiary} value={nameInput} onChangeText={setName} />
          <TouchableOpacity style={[S.btnPrimary, { backgroundColor: C.green }]} onPress={handleCreate} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={S.btnPrimaryText}>Create household</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Household card */}
          <View style={[S.card, { backgroundColor: C.greenLight, borderColor: C.greenBorder, marginBottom: 20 }]}>
            {view === "rename" ? (
              <>
                <Text style={[S.label, { marginBottom: 6 }]}>New name</Text>
                <TextInput style={[S.input, { backgroundColor: "#fff" }]} value={nameInput} onChangeText={setName} autoFocus />
                <View style={[S.row, { gap: 8 }]}>
                  <TouchableOpacity style={[S.btnPrimary, { flex: 1, backgroundColor: C.green, marginTop: 0 }]} onPress={handleRename} disabled={busy}>
                    {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={S.btnPrimaryText}>Save</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={[S.btnPrimary, { flex: 1, backgroundColor: "transparent", borderWidth: 0.5, borderColor: C.greenBorder, marginTop: 0 }]} onPress={() => { setView("main"); setName(""); }}>
                    <Text style={{ fontSize: 15, color: C.greenDark }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={S.rowBetween}>
                <View>
                  <Text style={[S.label, { color: C.greenDark, marginBottom: 4 }]}>Household</Text>
                  <Text style={[S.h2, { color: "#085041" }]}>{household.name}</Text>
                  <Text style={{ fontSize: 12, color: C.greenDark, marginTop: 3 }}>
                    {(household.members||[]).length} member{(household.members||[]).length !== 1 ? "s" : ""} · {isOwner ? "Owner" : "Member"}
                  </Text>
                </View>
                {isOwner && (
                  <TouchableOpacity onPress={() => { setView("rename"); setName(household.name); }} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 0.5, borderColor: C.greenBorder }}>
                    <Text style={{ fontSize: 12, color: C.greenDark }}>Rename</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Members */}
          <View style={S.rowBetween}>
            <Text style={S.sectionTitle}>Members</Text>
            {isOwner && (
              <TouchableOpacity onPress={() => setView(view === "add" ? "main" : "add")} style={styles.smallBtn}>
                <Text style={{ fontSize: 12, color: C.text, fontWeight: "500" }}>{view === "add" ? "Cancel" : "+ Add member"}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Add member form */}
          {view === "add" && isOwner && (
            <View style={[S.card, { marginBottom: 12 }]}>
              <Text style={[S.label, { marginBottom: 6 }]}>Member's email</Text>
              <TextInput style={S.input} placeholder="their@email.com" placeholderTextColor={C.textTertiary} value={emailInput} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoFocus />
              <Text style={[S.small, { marginBottom: 10 }]}>The person must already have a Budget account.</Text>
              <TouchableOpacity style={[S.btnPrimary, { backgroundColor: C.green }]} onPress={handleAddMember} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={S.btnPrimaryText}>Add to household</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Member list */}
          <View style={{ borderRadius: 14, borderWidth: 0.5, borderColor: C.border, overflow: "hidden", marginBottom: 24 }}>
            {(household.members || []).map((m, i) => {
              const isMe   = m.userId === user?.userId;
              const mOwner = m.userId === household.ownerUserId;
              return (
                <View key={m.userId}>
                  {i > 0 && <View style={S.divider} />}
                  <View style={[S.row, { padding: 14 }]}>
                    <View style={[styles.avatar, { backgroundColor: mOwner ? C.greenLight : C.bgTertiary }]}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: mOwner ? C.greenDark : C.textSecondary }}>{m.name?.charAt(0)?.toUpperCase() || "?"}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[S.body, { fontWeight: "500" }]}>{m.name}{isMe ? " (you)" : ""}</Text>
                      <Text style={S.small}>{m.email}</Text>
                    </View>
                    <View style={[S.row, { gap: 8 }]}>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 0.5, borderColor: mOwner ? C.greenBorder : C.border, backgroundColor: mOwner ? C.greenLight : C.bgSecondary }}>
                        <Text style={{ fontSize: 11, color: mOwner ? C.greenDark : C.textTertiary }}>{mOwner ? "Owner" : "Member"}</Text>
                      </View>
                      {isOwner && !mOwner && (
                        <TouchableOpacity onPress={() => confirmRemove(m.userId, m.name)}>
                          <Text style={{ fontSize: 16, color: C.red }}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Danger zone */}
          <View style={{ borderRadius: 14, borderWidth: 0.5, borderColor: C.border, overflow: "hidden" }}>
            {!isOwner && (
              <TouchableOpacity style={styles.dangerRow} onPress={confirmLeave}>
                <Text style={{ fontSize: 17 }}>🚪</Text>
                <Text style={styles.dangerText}>Leave household</Text>
              </TouchableOpacity>
            )}
            {isOwner && (
              <TouchableOpacity style={styles.dangerRow} onPress={confirmDelete}>
                <Text style={{ fontSize: 17 }}>🗑️</Text>
                <Text style={styles.dangerText}>Delete household</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatar:    { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  smallBtn:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary },
  dangerRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  dangerText:{ fontSize: 14, fontWeight: "500", color: C.red },
});
