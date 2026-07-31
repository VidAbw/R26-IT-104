// app/register.tsx
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signUpWithEmail() {
    // ── Validation ────────────────────────────────────────────
    if (!displayName.trim()) {
      Alert.alert("Required", "Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Required", "Please enter your email address.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);

    // ── 1. Create the auth user in Supabase ───────────────────
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
    });

    if (error) {
      setLoading(false);
      // Translate common Supabase error codes into friendly messages
      if (error.message.includes("already registered")) {
        Alert.alert("Account Exists", "This email is already registered. Please log in instead.");
      } else if (error.message.includes("invalid")) {
        Alert.alert("Invalid Email", "Please enter a valid email address.");
      } else {
        Alert.alert("Registration Failed", error.message);
      }
      return;
    }

    // ── 2. Insert the full profile row ────────────────────────
    if (data.user) {
      const registrationDetails = {
        phone: phone.trim() || null,
        address: address.trim() || null,
        registered_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: data.user.id,
          display_name: displayName.trim(),
          registration_details: registrationDetails,
          children: [],   // to be filled in-app later
          settings: { notifications_enabled: true, alert_threshold: "moderate" },
        });

      if (profileError) {
        console.warn("Profile row creation failed:", profileError.message);
        // Don't block user — auth is already created, profile can be retried
      }
    }

    setLoading(false);

    // Navigate to the email verification screen
    router.replace({
      pathname: "/verify-email",
      params: { email: email.trim().toLowerCase() },
    });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Child Safety Guardian</Text>

        {/* ── Personal Information ─────────────────────── */}
        <Text style={styles.sectionLabel}>PERSONAL INFORMATION</Text>

        <Text style={styles.inputLabel}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Vidusha De Abrew"
          onChangeText={setDisplayName}
          value={displayName}
          autoCapitalize="words"
        />

        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. +94 77 123 4567"
          onChangeText={setPhone}
          value={phone}
          keyboardType="phone-pad"
        />

        <Text style={styles.inputLabel}>Home Address</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="e.g. 42, Kandy Road, Colombo 10"
          onChangeText={setAddress}
          value={address}
          multiline
          numberOfLines={2}
        />

        {/* ── Account Credentials ──────────────────────── */}
        <Text style={styles.sectionLabel}>ACCOUNT CREDENTIALS</Text>

        <Text style={styles.inputLabel}>Email Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. parent@gmail.com"
          onChangeText={setEmail}
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.inputLabel}>Password * (min 6 characters)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter a strong password"
          secureTextEntry={true}
          onChangeText={setPassword}
          value={password}
        />

        <Text style={styles.inputLabel}>Confirm Password *</Text>
        <TextInput
          style={[styles.input, password !== confirmPassword && confirmPassword.length > 0 && styles.inputError]}
          placeholder="Re-enter your password"
          secureTextEntry={true}
          onChangeText={setConfirmPassword}
          value={confirmPassword}
        />
        {password !== confirmPassword && confirmPassword.length > 0 && (
          <Text style={styles.errorText}>Passwords do not match</Text>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={signUpWithEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/login")} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    height: 50,
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: "#FFF",
    color: "#111827",
  },
  multilineInput: {
    height: 70,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 28,
  },
  buttonDisabled: {
    backgroundColor: "#93C5FD",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  loginLink: {
    marginTop: 20,
    alignItems: "center",
  },
  loginLinkText: {
    color: "#3B82F6",
    fontSize: 15,
    fontWeight: "600",
  },
});
