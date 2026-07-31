// app/forgot-password.tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  async function handleResetPassword() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      Alert.alert("Required", "Please enter your email address.");
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      // Supabase will redirect here after the user clicks the link in their email.
      // For mobile deep linking, you would configure this in your Supabase dashboard.
      redirectTo: "childsafetyapp://reset-password",
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setSent(true);
  }

  // ─── Success State ─────────────────────────────────────────
  if (sent) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.successIconContainer}>
            <Text style={styles.successIcon}>✉️</Text>
          </View>

          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a password reset link to:
          </Text>
          <Text style={styles.emailHighlight}>{email.trim().toLowerCase()}</Text>

          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>What to do next:</Text>

            <View style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Open your email app and find the message from Supabase
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Click the "Reset Password" link in the email
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Set your new password and log back in
              </Text>
            </View>
          </View>

          <Text style={styles.spamNote}>
            Didn't receive the email? Check your spam folder or try again.
          </Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              setSent(false);
              setEmail("");
            }}
          >
            <Text style={styles.secondaryButtonText}>Try a Different Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.backLinkText}>← Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── Input State ───────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerIconContainer}>
          <Text style={styles.headerIcon}>🔒</Text>
        </View>

        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          No worries! Enter your email address below and we'll send you a link
          to reset your password.
        </Text>

        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. parent@gmail.com"
          placeholderTextColor="#9CA3AF"
          onChangeText={setEmail}
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          autoFocus
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.backLinkText}>← Back to Login</Text>
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

  // ── Header Icons ──────────────────────────────────────────
  headerIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  headerIcon: {
    fontSize: 56,
  },
  successIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  successIcon: {
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
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  emailHighlight: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3B82F6",
    textAlign: "center",
    marginBottom: 24,
  },

  // ── Input ─────────────────────────────────────────────────
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
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

  // ── Buttons ───────────────────────────────────────────────
  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: "#93C5FD",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  secondaryButtonText: {
    color: "#3B82F6",
    fontSize: 15,
    fontWeight: "600",
  },

  // ── Instruction Card (Success State) ──────────────────────
  instructionCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 1,
  },
  stepNumber: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },

  // ── Footer ────────────────────────────────────────────────
  spamNote: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 16,
  },
  backLink: {
    marginTop: 20,
    alignItems: "center",
  },
  backLinkText: {
    color: "#3B82F6",
    fontSize: 15,
    fontWeight: "600",
  },
});
