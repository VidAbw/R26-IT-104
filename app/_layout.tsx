// app/_layout.tsx
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View, LogBox, Platform } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthProvider";
import { useAuthDeepLink } from "../hooks/useAuthDeepLink";

// Ignore known network/Supabase errors in Metro's LogBox to prevent blocking development overlay
LogBox.ignoreLogs([
  "Failed to fetch",
  "AuthRetryableFetchError",
  "WebSocket connection to",
  "net::ERR_NAME_NOT_RESOLVED",
  "props.pointerEvents is deprecated",
]);

// Prevent unhandled promise rejections from throwing a full-screen red error boundary on Web
if (Platform.OS === "web" && typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (
      reason &&
      (reason.message === "Failed to fetch" ||
        reason.name === "AuthRetryableFetchError" ||
        (reason.message && reason.message.includes("supabase")) ||
        (reason.message && reason.message.includes("websocket")))
    ) {
      event.preventDefault();
      console.warn("Suppressed unhandled Supabase/network promise rejection:", reason);
    }
  });
}

const InitialLayout = () => {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Attach global deep link listener for Supabase auth links (cold start & foregrounding)
  useAuthDeepLink();

  useEffect(() => {
    if (isLoading) return;

    const routeName = (segments[0] || "") as string;
    const inAuthGroup =
      routeName === "login" ||
      routeName === "register" ||
      routeName === "forgot-password" ||
      routeName === "reset-password" ||
      routeName === "verify-email";

    // If NOT logged in, and NOT on an auth screen, kick to login
    if (!session && !inAuthGroup) {
      router.replace("/login");
    }
    // If logged in, and ON an auth screen (except reset-password during password update), kick to Home
    else if (session && inAuthGroup && routeName !== "reset-password") {
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
