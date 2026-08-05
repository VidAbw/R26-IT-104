// hooks/useAuthDeepLink.ts
import { useEffect, useState, useCallback } from "react";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { supabase } from "../lib/supabase";

export interface DeepLinkState {
  isProcessingLink: boolean;
  lastPath: string | null;
  error: string | null;
}

/**
 * Parses query parameters and hash fragment parameters from a deep link URL.
 * Supabase can pass tokens via query parameters (?access_token=...) or hash fragments (#access_token=...).
 */
function parseUrlParams(url: string): { path: string | null; params: Record<string, string> } {
  try {
    const parsed = Linking.parse(url);
    const path = parsed.path;
    const params: Record<string, string> = {};

    if (parsed.queryParams) {
      Object.entries(parsed.queryParams).forEach(([key, val]) => {
        if (typeof val === "string") {
          params[key] = val;
        } else if (Array.isArray(val) && val[0]) {
          params[key] = val[0];
        }
      });
    }

    // Parse hash fragments (#access_token=...&refresh_token=...&type=signup)
    const hashIndex = url.indexOf("#");
    if (hashIndex !== -1) {
      const hashString = url.substring(hashIndex + 1);
      const hashParams = new URLSearchParams(hashString);
      hashParams.forEach((val, key) => {
        params[key] = val;
      });
    }

    return { path, params };
  } catch (err) {
    console.error("[useAuthDeepLink] Error parsing URL:", err);
    return { path: null, params: {} };
  }
}

/**
 * Custom React hook that listens for and handles incoming Supabase authentication deep links.
 * Catches the 'email-confirmed' path, exchange tokens/PKCE code, and redirects the user cleanly.
 */
export function useAuthDeepLink(): DeepLinkState {
  const router = useRouter();
  const [state, setState] = useState<DeepLinkState>({
    isProcessingLink: false,
    lastPath: null,
    error: null,
  });

  const handleDeepLink = useCallback(
    async (url: string | null) => {
      if (!url) return;

      console.log("[useAuthDeepLink] Intercepted deep link URL:", url);
      setState({ isProcessingLink: true, lastPath: null, error: null });

      try {
        const { path, params } = parseUrlParams(url);
        const type = params.type;
        const code = params.code;
        const accessToken = params.access_token;
        const refreshToken = params.refresh_token;

        console.log(
          `[useAuthDeepLink] Extracted path: '${path}', type: '${type}', hasCode: ${!!code}, hasTokens: ${!!accessToken}`
        );

        // 1. PKCE Code Exchange Flow (Supabase PKCE Auth)
        if (code) {
          console.log("[useAuthDeepLink] Exchanging PKCE code for session...");
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("[useAuthDeepLink] PKCE session exchange failed:", exchangeError.message);
            setState({ isProcessingLink: false, lastPath: path, error: exchangeError.message });
            return;
          }
        }
        // 2. Implicit Token Session Setup Flow
        else if (accessToken && refreshToken) {
          console.log("[useAuthDeepLink] Setting session from access & refresh tokens...");
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            console.error("[useAuthDeepLink] Set session failed:", sessionError.message);
            setState({ isProcessingLink: false, lastPath: path, error: sessionError.message });
            return;
          }
        }

        // 3. Navigation Dispatch based on Path & Token Type
        const isRecovery = path === "reset-password" || type === "recovery";
        const isEmailConfirmed =
          path === "email-confirmed" ||
          path === "verify-email" ||
          type === "signup" ||
          type === "email_change";

        if (isRecovery) {
          console.log("[useAuthDeepLink] Directing user to Reset Password screen...");
          router.replace("/reset-password" as any);
        } else if (isEmailConfirmed) {
          console.log("[useAuthDeepLink] Email confirmed deep link processed successfully.");
          
          // Check if session is established after token exchange
          const { data: sessionData } = await supabase.auth.getSession();

          if (sessionData.session) {
            console.log("[useAuthDeepLink] Verified session active. Redirecting to Main App Dashboard...");
            Alert.alert("Email Verified! 🎉", "Your email has been confirmed successfully. Welcome to Protectiva Guardian.");
            router.replace("/" as any);
          } else {
            console.log("[useAuthDeepLink] Redirecting to Login with success status...");
            Alert.alert("Email Verified! 🎉", "Your email has been confirmed successfully. Please log in to continue.");
            router.replace({
              pathname: "/login",
              params: { confirmed: "true" },
            } as any);
          }
        }

        setState({ isProcessingLink: false, lastPath: path, error: null });
      } catch (err: any) {
        console.error("[useAuthDeepLink] Unexpected deep link handling error:", err);
        setState({
          isProcessingLink: false,
          lastPath: null,
          error: err?.message || "Failed to process deep link",
        });
      }
    },
    [router]
  );

  useEffect(() => {
    // A. Cold Start Handling (App launched from killed state via deep link)
    Linking.getInitialURL()
      .then((initialUrl) => {
        if (initialUrl) {
          console.log("[useAuthDeepLink] Cold start initial URL detected:", initialUrl);
          handleDeepLink(initialUrl);
        }
      })
      .catch((err) => console.error("[useAuthDeepLink] Error getting initial URL:", err));

    // B. Foreground / Background Listener Handling
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("[useAuthDeepLink] Foreground event URL detected:", event.url);
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  return state;
}
