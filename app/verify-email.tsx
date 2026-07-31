// app/verify-email.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function VerifyEmailScreen() {
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [checking, setChecking] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email || "";

  // ─── Cooldown Timer ────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // ─── Resend Verification Email ─────────────────────────────
  const handleResend = useCallback(async () => {
    if (!email) {
      Alert.alert("Error", "No email address provided.");
      return;
    }

    setResending(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
    });

    setResending(false);

    if (error) {
      // Handle rate limiting gracefully
      if (error.message.includes("rate") || error.message.includes("limit")) {
        Alert.alert(
          "Please Wait",
          "You've sent too many requests. Please wait a minute and try again."
        );
      } else {
        Alert.alert("Error", error.message);
      }
      return;
    }

    setCooldown(60); // 60 second cooldown
    Alert.alert("Email Sent!", "A new verification email has been sent.");
  }, [email]);

  // ─── Check Verification Status ─────────────────────────────
  const handleCheckStatus = useCallback(async () => {
    if (!email) return;

    setChecking(true);

    // Try to get the session — if the user clicked the verification link
    // in a browser/WebView, Supabase will have activated their account.
    const { data, error } = await supabase.auth.getSession();

    setChecking(false);

    if (data?.session) {
      // Session exists = user is verified and logged in
      Alert.alert(
        "Verified! ✅",
        "Your email has been verified successfully.",
        [{ text: "Continue", onPress: () => router.replace("/") }]
      );
    } else {
      Alert.alert(
        "Not Verified Yet",
        "Your email hasn't been verified yet. Please check your inbox and click the verification link.",
        [{ text: "OK" }]
      );
    }
  }, [email, router]);

  return (
    <View style={styles.container}>
      {/* ── Envelope Icon ─────────────────────────────────── */}
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>📧</Text>
        </View>
      </View>

      {/* ── Title & Description ───────────────────────────── */}
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>
        We've sent a verification link to:
      </Text>

      {email ? (
        <View style={styles.emailBadge}>
          <Text style={styles.emailText}>{email}</Text>
        </View>
      ) : null}

      <Text style={styles.description}>
        Please click the link in the email to activate your account. This helps
        us keep your family's data safe.
      </Text>

      {/* ── Instruction Steps ─────────────────────────────── */}
      <View style={styles.stepsCard}>
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <Text style={styles.stepLabel}>Open your email app</Text>
        </View>
        <View style={styles.stepDivider} />
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <Text style={styles.stepLabel}>
            Find the email from Child Safety Guardian
          </Text>
        </View>
        <View style={styles.stepDivider} />
        <View style={styles.stepRow}>
          <View style={styles.stepDot} />
          <Text style={styles.stepLabel}>Click "Confirm your email"</Text>
        </View>
        <View style={styles.stepDivider} />
        <View style={styles.stepRow}>
          <View style={styles.stepDot} />
          <Text style={styles.stepLabel}>Come back here and tap "I've Verified"</Text>
        </View>
      </View>

      {/* ── Action Buttons ────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.primaryButton, checking && styles.buttonDisabled]}
        onPress={handleCheckStatus}
        disabled={checking}
      >
        {checking ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.primaryButtonText}>I've Verified My Email ✓</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.resendButton,
          (resending || cooldown > 0) && styles.resendButtonDisabled,
        ]}
        onPress={handleResend}
        disabled={resending || cooldown > 0}
      >
        {resending ? (
          <ActivityIndicator color="#3B82F6" size="small" />
        ) : (
          <Text
            style={[
              styles.resendButtonText,
              cooldown > 0 && styles.resendButtonTextDisabled,
            ]}
          >
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend Verification Email"}
          </Text>
        )}
      </TouchableOpacity>

      {/* ── Footer ────────────────────────────────────────── */}
      <Text style={styles.spamNote}>
        Can't find it? Check your spam or junk folder.
      </Text>

      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => router.replace("/login")}
      >
        <Text style={styles.loginLinkText}>← Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F9FAFB",
  },

  // ── Icon ──────────────────────────────────────────────────
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#BFDBFE",
  },
  icon: {
    fontSize: 42,
  },

  // ── Typography ────────────────────────────────────────────
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },

  // ── Email Badge ───────────────────────────────────────────
  emailBadge: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  emailText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1D4ED8",
  },

  // ── Steps Card ────────────────────────────────────────────
  stepsCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    marginRight: 12,
  },
  stepDotActive: {
    borderColor: "#3B82F6",
    backgroundColor: "#3B82F6",
  },
  stepDivider: {
    width: 2,
    height: 18,
    backgroundColor: "#E5E7EB",
    marginLeft: 5,
    marginVertical: 2,
  },
  stepLabel: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },

  // ── Buttons ───────────────────────────────────────────────
  primaryButton: {
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: "#6EE7B7",
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  resendButton: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  resendButtonDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  resendButtonText: {
    color: "#3B82F6",
    fontSize: 15,
    fontWeight: "600",
  },
  resendButtonTextDisabled: {
    color: "#9CA3AF",
  },

  // ── Footer ────────────────────────────────────────────────
  spamNote: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 16,
  },
  loginLink: {
    marginTop: 16,
    alignItems: "center",
  },
  loginLinkText: {
    color: "#3B82F6",
    fontSize: 15,
    fontWeight: "600",
  },
});
