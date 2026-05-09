// app/_layout.tsx
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthProvider";

const InitialLayout = () => {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "login" || segments[0] === "register";

    // If NOT logged in, and NOT on an auth screen, kick to login
    if (!session && !inAuthGroup) {
      router.replace("/login");
    }
    // If logged in, and ON an auth screen, kick to Home
    else if (session && inAuthGroup) {
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
