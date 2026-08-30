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
  Image,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ProtectivaTheme } from "../constants/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams<{ confirmed?: string }>();
  const isConfirmed = params.confirmed === "true";

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
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* ── Protectiva Brand Logo ─────────────────────────── */}
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

          {/* ── Email Verified Success Banner ───────────────── */}
          {isConfirmed && (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerTitle}>🎉 Email Verified Successfully!</Text>
              <Text style={styles.successBannerText}>
                Your account is active. Please enter your password to log in.
              </Text>
            </View>
          )}

          {/* ── Login Form ──────────────────────────────────── */}
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. parent@gmail.com"
            placeholderTextColor="#94A3B8"
            onChangeText={setEmail}
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#94A3B8"
            secureTextEntry={true}
            onChangeText={setPassword}
            value={password}
          />

          <TouchableOpacity
            onPress={() => router.push("/forgot-password")}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotLinkText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={signInWithEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Login to Dashboard</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/register")}
            style={styles.registerLink}
          >
            <Text style={styles.registerLinkText}>
              Don't have a Guardian account?{" "}
              <Text style={styles.registerLinkBold}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer info */}
        <Text style={styles.footerText}>
          Protect. Support. Empower. • Protecting children everywhere.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
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
    marginBottom: 12,
  },
  pacifierLogo: {
    width: 32,
    height: 32,
    tintColor: ProtectivaTheme.primaryDark,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: ProtectivaTheme.primaryDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: ProtectivaTheme.textSecondary,
    marginTop: 4,
    fontWeight: "500",
  },
  successBanner: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    alignItems: "center",
  },
  successBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#15803D",
    marginBottom: 4,
  },
  successBannerText: {
    fontSize: 12,
    color: "#166534",
    textAlign: "center",
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
  forgotLink: {
    alignSelf: "flex-end",
    marginTop: 10,
    marginBottom: 6,
  },
  forgotLinkText: {
    color: ProtectivaTheme.primaryDark,
    fontSize: 13,
    fontWeight: "600",
  },
  button: {
    backgroundColor: ProtectivaTheme.primaryDark,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#94A3B8",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  registerLink: {
    marginTop: 24,
    alignItems: "center",
  },
  registerLinkText: {
    color: ProtectivaTheme.textSecondary,
    fontSize: 13,
  },
  registerLinkBold: {
    color: ProtectivaTheme.primaryDark,
    fontWeight: "700",
  },
  footerText: {
    fontSize: 11,
    color: ProtectivaTheme.textSecondary,
    textAlign: "center",
    marginTop: 24,
  },
});