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
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { supabaseAuthService } from "../services/supabaseAuthService";
import { ProtectivaTheme } from "../constants/theme";

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setLoading(true);

    const { error } = await supabaseAuthService.sendPasswordResetEmail(trimmedEmail);

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
        style={{ flex: 1, backgroundColor: "#F8FAFC" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <View style={styles.shieldIconContainer}>
              <Image
                source={require("../assets/images/pacifier.png")}
                style={styles.pacifierLogo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We sent a password reset link to:
            </Text>

            <View style={styles.emailBadge}>
              <Text style={styles.emailBadgeText}>{email}</Text>
            </View>

            {/* Instruction Steps */}
            <View style={styles.stepsContainer}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>
                  Open the email on your mobile device.
                </Text>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>
                  Tap the reset password link or button inside the message.
                </Text>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>
                  You'll be directed back into the app to set your new password.
                </Text>
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setSent(false)}
            >
              <Text style={styles.primaryButtonText}>Resend Reset Link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.secondaryButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── Input State ───────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.shieldIconContainer}>
            <Image
              source={require("../assets/images/pacifier.png")}
              style={styles.pacifierLogo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter the email address associated with your Protectiva Guardian account. We will send you a link to reset your password.
          </Text>

          {/* Email Input */}
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. parent@example.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace("/login")}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: ProtectivaTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  shieldIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#E6F4F1",
    borderWidth: 2,
    borderColor: ProtectivaTheme.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  pacifierLogo: {
    width: 32,
    height: 32,
    tintColor: ProtectivaTheme.primaryDark,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: ProtectivaTheme.primaryDark,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: ProtectivaTheme.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  emailBadge: {
    backgroundColor: "#E6F4F1",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "center",
    marginBottom: 24,
  },
  emailBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: ProtectivaTheme.primaryDark,
  },
  stepsContainer: {
    gap: 14,
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ProtectivaTheme.primaryDark,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  stepText: {
    fontSize: 13,
    color: ProtectivaTheme.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: ProtectivaTheme.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: ProtectivaTheme.textPrimary,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: ProtectivaTheme.primaryDark,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: "#94A3B8",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: ProtectivaTheme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
});
