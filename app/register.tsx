// app/register.tsx
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Button,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signUpWithEmail() {
    // 1. Validation Logic
    if (password.length < 6) {
      Alert.alert(
        "දුර්වල මුරපදයක්",
        "මුරපදය අවම වශයෙන් අක්ෂර 6 ක් සඳහා විය යුතුය.",
      );
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    setLoading(false);

    if (error) {
      Alert.alert("ලියාපදිංචි කිරීම අසාර්ථකයි", error.message);
    } else {
      Alert.alert("සාර්ථකයි", "ගිණුම සෑදී ඇත! කරුණාකර ලොග් වන්න.");
      router.back(); // Go back to login screen
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ගිණුමක් තනන්න</Text>

      <TextInput
        style={styles.input}
        placeholder="ඊමේල්"
        onChangeText={setEmail}
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="මුරපදය (අවම වශයෙන් අක්ෂර 6)"
        secureTextEntry={true}
        onChangeText={setPassword}
        value={password}
      />

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? "නිර්මාණය කරමින්..." : "ගිණුම නිර්මාණය කරන්න"}
          onPress={signUpWithEmail}
          color="#2196F3"
        />
      </View>

      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
        <Text style={{ color: "blue", textAlign: "center" }}>
          දැනටමත් ගිණුමක් තිබේද? ලොග් වන්න
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 12,
  },
  buttonContainer: { marginTop: 10 },
});
