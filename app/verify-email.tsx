// app/verify-email.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Image,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ProtectivaTheme } from "../constants/theme";

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

    setCooldown(60);
    Alert.alert("Email Sent!", "A new verification email has been sent.");
  }, [email]);

  // ─── Check Verification Status ─────────────────────────────
  const handleCheckStatus = useCallback(async () => {
    if (!email) return;

    setChecking(true);

    const { data } = await supabase.auth.getSession();

    setChecking(false);

    if (data?.session) {
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
      <View style={styles.card}>
        <View style={styles.shieldIconContainer}>
          <Image
            source={require("../assets/images/pacifier.png")}
            style={styles.pacifierLogo}
            resizeMode="contain"
          />
        </View>

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
          Please click the link in the email to activate your account. This helps us keep your family's data safe.
        </Text>

        {/* Instruction Steps */}
        <View style={styles.stepsCard}>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <Text style={styles.stepLabel}>Open your email app</Text>
          </View>
          <View style={styles.stepDivider} />
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <Text style={styles.stepLabel}>
              Find the email from Protectiva Guardian
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

        {/* Action Buttons */}
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
            <ActivityIndicator color={ProtectivaTheme.primaryDark} size="small" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F8FAFC",
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
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: ProtectivaTheme.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  emailBadge: {
    backgroundColor: "#E6F4F1",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 12,
  },
  emailText: {
    fontSize: 14,
    fontWeight: "700",
    color: ProtectivaTheme.primaryDark,
  },
  stepsCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    marginRight: 10,
  },
  stepDotActive: {
    borderColor: ProtectivaTheme.primaryDark,
    backgroundColor: ProtectivaTheme.primaryDark,
  },
  stepDivider: {
    width: 2,
    height: 14,
    backgroundColor: "#E2E8F0",
    marginLeft: 4,
    marginVertical: 2,
  },
  stepLabel: {
    fontSize: 13,
    color: ProtectivaTheme.textPrimary,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: ProtectivaTheme.primaryDark,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: "#94A3B8",
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  resendButton: {
    backgroundColor: "#E6F4F1",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  resendButtonDisabled: {
    backgroundColor: "#F1F5F9",
  },
  resendButtonText: {
    color: ProtectivaTheme.primaryDark,
    fontSize: 13,
    fontWeight: "600",
  },
  resendButtonTextDisabled: {
    color: "#94A3B8",
  },
  spamNote: {
    fontSize: 12,
    color: ProtectivaTheme.textSecondary,
    textAlign: "center",
    marginTop: 16,
  },
  loginLink: {
    marginTop: 14,
    alignItems: "center",
  },
  loginLinkText: {
    color: ProtectivaTheme.primaryDark,
    fontSize: 13,
    fontWeight: "600",
  },
});
