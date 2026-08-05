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
  Image,
} from "react-native";
import { supabase } from "../lib/supabase";
import { supabaseAuthService } from "../services/supabaseAuthService";
import { ProtectivaTheme } from "../constants/theme";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // State to track if email verification notice should be displayed
  const [isEmailConfirmationRequired, setIsEmailConfirmationRequired] = useState(false);

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

    const trimmedEmail = email.trim().toLowerCase();

    // ── 1. Create the auth user via supabaseAuthService ──────
    const { data, error } = await supabaseAuthService.signUp({
      email: trimmedEmail,
      password,
      fullName: displayName.trim(),
      phoneNumber: phone.trim(),
      homeAddress: address.trim(),
    });

    if (error) {
      setLoading(false);
      const errMsg = error.message || String(error) || "";
      if (errMsg.includes("already registered")) {
        Alert.alert("Account Exists", "This email is already registered. Please log in instead.");
      } else if (errMsg.includes("rate limit") || errMsg.includes("429")) {
        Alert.alert(
          "Email Rate Limit Exceeded ⏳",
          "Supabase limits how many verification emails can be sent per hour on the default mailer. Please wait a few minutes before trying again, or disable/increase the email rate limit in your Supabase Dashboard under Authentication -> Rate Limits."
        );
      } else if (errMsg.includes("504") || errMsg.includes("Gateway Timeout") || errMsg.includes("timeout") || errMsg === "{}") {
        Alert.alert(
          "SMTP Email Timeout (HTTP 504) ⚠️",
          "Supabase timed out while attempting to send the confirmation email. This occurs when Custom SMTP is enabled in Supabase Dashboard with invalid credentials, or if the mail server is unreachable. Please verify your SMTP configuration under Authentication -> Providers -> Email in your Supabase Dashboard."
        );
      } else if (errMsg.includes("invalid")) {
        Alert.alert("Invalid Email", "Please enter a valid email address.");
      } else {
        Alert.alert("Registration Failed", errMsg || "An unexpected error occurred during signup.");
      }
      return;
    }

    // ── 2. Insert the full profile row if user was created ────
    if (data?.user) {
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
          children: [],
          settings: { notifications_enabled: true, alert_threshold: "moderate" },
        });

      if (profileError) {
        console.warn("[RegisterScreen] Profile row creation failed:", profileError.message);
      }
    }

    setLoading(false);

    // ── 3. Check Supabase Email Confirmation Indicator ────────
    // If data.user exists and data.session is null, Supabase requires email confirmation.
    if (data && data.user && data.session === null) {
      console.log("[RegisterScreen] Email confirmation required for user:", data.user.email);
      // Hide registration form and show "Check your Inbox" success UI
      setIsEmailConfirmationRequired(true);
    } else {
      // If email confirmation is not enabled on backend and session is returned, proceed to main app
      console.log("[RegisterScreen] Session established directly. Proceeding to dashboard.");
      router.replace("/");
    }
  }

  async function handleResendVerification() {
    try {
      setResending(true);
      const { error } = await supabaseAuthService.sendEmailVerification(email.trim().toLowerCase());
      if (error) {
        Alert.alert("Resend Failed", error.message);
      } else {
        Alert.alert("Email Sent", "A new confirmation link has been sent to your email inbox.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to resend email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* ── SUCCESS STATE: Check Your Inbox UI ─────────────────── */}
        {isEmailConfirmationRequired ? (
          <View style={styles.successContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>📩</Text>
            </View>
            <Text style={styles.successTitle}>Check Your Inbox</Text>
            <Text style={styles.successSub}>
              We sent a verification link to{"\n"}
              <Text style={styles.emailHighlight}>{email.trim().toLowerCase()}</Text>
            </Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardText}>
                Click the confirmation link in your email to activate your account. Once verified, you can log in to Protectiva Child Safety Guardian.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.primaryButtonText}>Go to Login Screen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleResendVerification}
              disabled={resending}
            >
              {resending ? (
                <ActivityIndicator color="#3B82F6" size="small" />
              ) : (
                <Text style={styles.secondaryButtonText}>Resend Verification Email</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* ── FORM STATE: Create Account Form ─────────────────────── */
          <>
            <View style={styles.logoContainer}>
              <View style={styles.shieldIconContainer}>
                <Image
                  source={require("../assets/images/pacifier.png")}
                  style={styles.pacifierLogo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>Protectiva</Text>
              <Text style={styles.subtitle}>Child Protection & Guardian Support</Text>
            </View>

            {/* Personal Information */}
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

            {/* Account Credentials */}
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
              style={[
                styles.input,
                password !== confirmPassword && confirmPassword.length > 0 && styles.inputError,
              ]}
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
          </>
        )}
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  shieldIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#E6F4F1",
    borderWidth: 2,
    borderColor: ProtectivaTheme.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  pacifierLogo: {
    width: 28,
    height: 28,
    tintColor: ProtectivaTheme.primaryDark,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: ProtectivaTheme.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    height: 48,
    borderColor: "#E2E8F0",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    backgroundColor: "#F8FAFC",
    color: ProtectivaTheme.textPrimary,
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
    backgroundColor: ProtectivaTheme.primaryDark,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: "#94A3B8",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  loginLink: {
    marginTop: 20,
    alignItems: "center",
  },
  loginLinkText: {
    color: ProtectivaTheme.primaryDark,
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Success State Styles ──────────────────────────────────
  successContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E6F4F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: ProtectivaTheme.primary,
  },
  iconEmoji: {
    fontSize: 34,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: ProtectivaTheme.primaryDark,
    textAlign: "center",
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    color: ProtectivaTheme.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emailHighlight: {
    fontWeight: "700",
    color: ProtectivaTheme.primaryDark,
  },
  infoCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 24,
    width: "100%",
  },
  infoCardText: {
    fontSize: 13,
    color: "#166534",
    lineHeight: 18,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: ProtectivaTheme.primaryDark,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
  },
  secondaryButtonText: {
    color: ProtectivaTheme.primaryDark,
    fontSize: 13,
    fontWeight: "600",
  },
});
