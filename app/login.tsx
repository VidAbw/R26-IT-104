// app/login.tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    if (!email.trim()) {
      Alert.alert("Required", "Please enter your email address.");
      return;
    }
    if (!password) {
      Alert.alert("Required", "Please enter your password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password,
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("Invalid login")) {
        Alert.alert(
          "Login Failed",
          "Incorrect email or password. Please try again."
        );
      } else if (error.message.includes("Email not confirmed")) {
        Alert.alert(
          "Email Not Verified",
          "Please verify your email address before logging in.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Verify Now",
              onPress: () =>
                router.push({
                  pathname: "/verify-email",
                  params: { email: email.trim().toLowerCase() },
                }),
            },
          ]
        );
      } else {
        Alert.alert("Login Failed", error.message);
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── App Logo / Branding ─────────────────────────── */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🛡️</Text>
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Child Safety Guardian</Text>

        {/* ── Email Input ─────────────────────────────────── */}
        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. parent@gmail.com"
          placeholderTextColor="#9CA3AF"
          onChangeText={setEmail}
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* ── Password Input ──────────────────────────────── */}
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={true}
          onChangeText={setPassword}
          value={password}
        />

        {/* ── Forgot Password ─────────────────────────────── */}
        <TouchableOpacity
          onPress={() => router.push("/forgot-password")}
          style={styles.forgotLink}
        >
          <Text style={styles.forgotLinkText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* ── Login Button ────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={signInWithEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* ── Register Link ───────────────────────────────── */}
        <TouchableOpacity
          onPress={() => router.push("/register")}
          style={styles.registerLink}
        >
          <Text style={styles.registerLinkText}>
            Don't have an account?{" "}
            <Text style={styles.registerLinkBold}>Create one</Text>
          </Text>
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

  // ── Logo ──────────────────────────────────────────────────
  logoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 56,
  },

  // ── Typography ────────────────────────────────────────────
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

  // ── Inputs ────────────────────────────────────────────────
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

  // ── Forgot Password ───────────────────────────────────────
  forgotLink: {
    alignSelf: "flex-end",
    marginTop: 10,
    marginBottom: 4,
  },
  forgotLinkText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Button ────────────────────────────────────────────────
  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#93C5FD",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // ── Register Link ─────────────────────────────────────────
  registerLink: {
    marginTop: 24,
    alignItems: "center",
  },
  registerLinkText: {
    color: "#6B7280",
    fontSize: 15,
  },
  registerLinkBold: {
    color: "#3B82F6",
    fontWeight: "700",
  },
});