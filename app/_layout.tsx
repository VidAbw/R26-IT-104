// app/_layout.tsx
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthProvider";

const InitialLayout = () => {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Set this to true to bypass authentication during development/testing
  const BYPASS_AUTH = true;

  useEffect(() => {
    if (isLoading) return;
    if (BYPASS_AUTH) return;

    const inAuthGroup = segments[0] === "login" || segments[0] === "register";

    if (!session && !inAuthGroup) {
      // If NOT logged in and NOT on an auth page, go to Login
      router.replace("/login");
    } else if (session && inAuthGroup) {
      // If logged in and on an auth page, go to Home
      router.replace("/");
    }
  }, [session, isLoading, router, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
};

// Wrap the whole app in the Auth Provider
export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
