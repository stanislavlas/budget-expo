import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { C, S } from "../src/utils/theme.js";

export function AuthScreen({ onLogin, onRegister, loading, error, onClearError }) {
  const [mode, setMode]         = useState("login");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [localError, setLocalError] = useState(null);

  const displayError = localError || error;

  function switchMode(m) { setMode(m); setLocalError(null); onClearError?.(); }

  async function handleSubmit() {
    setLocalError(null); onClearError?.();
    if (mode === "register") {
      if (!name.trim())         return setLocalError("Name is required.");
      if (!email.includes("@")) return setLocalError("Enter a valid email.");
      if (password.length < 8)  return setLocalError("Password must be at least 8 characters.");
      if (password !== confirm)  return setLocalError("Passwords do not match.");
      try { await onRegister({ name: name.trim(), email: email.trim().toLowerCase(), password }); } catch {}
    } else {
      if (!email || !password)  return setLocalError("Email and password are required.");
      try { await onLogin({ email: email.trim().toLowerCase(), password }); } catch {}
    }
  }

  return (
    <KeyboardAvoidingView style={S.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <Text style={styles.logo}>💰</Text>
        <Text style={[S.h1, { textAlign: "center", marginBottom: 4 }]}>Budget</Text>
        <Text style={[S.small, { textAlign: "center", marginBottom: 40 }]}>Personal finance tracker</Text>

        {/* Tab toggle */}
        <View style={styles.tabBar}>
          {["login","register"].map(m => (
            <TouchableOpacity key={m} style={[styles.tab, mode === m && styles.tabActive]} onPress={() => switchMode(m)}>
              <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>{m === "login" ? "Sign in" : "Register"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Error */}
        {displayError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        )}

        {/* Fields */}
        {mode === "register" && (
          <>
            <Text style={[S.label, { marginBottom: 6 }]}>Full name</Text>
            <TextInput style={S.input} placeholder="Your name" value={name} onChangeText={setName} autoCapitalize="words" placeholderTextColor={C.textTertiary} />
          </>
        )}

        <Text style={[S.label, { marginBottom: 6 }]}>Email</Text>
        <TextInput style={S.input} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholderTextColor={C.textTertiary} />

        <Text style={[S.label, { marginBottom: 6 }]}>Password</Text>
        <TextInput style={S.input} placeholder={mode === "register" ? "Min. 8 characters" : "••••••••"} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={C.textTertiary} />

        {mode === "register" && (
          <>
            <Text style={[S.label, { marginBottom: 6 }]}>Confirm password</Text>
            <TextInput style={S.input} placeholder="Repeat password" value={confirm} onChangeText={setConfirm} secureTextEntry placeholderTextColor={C.textTertiary} />
          </>
        )}

        <TouchableOpacity style={[S.btnPrimary, { backgroundColor: C.green }]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={S.btnPrimaryText}>{mode === "login" ? "Sign in" : "Create account"}</Text>}
        </TouchableOpacity>

        <Text style={[S.small, { textAlign: "center", marginTop: 24, color: C.textTertiary }]}>
          Your data is stored privately in AWS DynamoDB.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flexGrow: 1, justifyContent: "center", padding: 24 },
  logo:        { fontSize: 48, textAlign: "center", marginBottom: 8 },
  tabBar:      { flexDirection: "row", backgroundColor: C.bgSecondary, borderRadius: 10, padding: 4, marginBottom: 20 },
  tab:         { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 8 },
  tabActive:   { backgroundColor: C.bg, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  tabText:     { fontSize: 14, fontWeight: "400", color: C.textTertiary },
  tabTextActive: { fontWeight: "600", color: C.text },
  errorBox:    { backgroundColor: C.redLight, borderRadius: 10, borderWidth: 0.5, borderColor: C.redBorder, padding: 12, marginBottom: 16 },
  errorText:   { fontSize: 13, color: C.redDark },
});
