// services/supabaseAuthService.ts
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";

import { User, Session } from "@supabase/supabase-js";

export interface AuthResponse<T = any> {
  data: T | null;
  error: Error | null;
}

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  homeAddress?: string;
}

export interface SignUpData {
  user: User | null;
  session: Session | null;
}

/**
 * Supabase Authentication Service supporting Deep Linking for Expo Dev Client.
 */
export const supabaseAuthService = {
  /**
   * Registers a new user with Supabase Auth including metadata and dynamic email confirmation redirect URL.
   * Generates deep link redirect: e.g. "childsafetyapp://email-confirmed"
   */
  async signUp(params: SignUpParams): Promise<AuthResponse<SignUpData>> {
    try {
      const { email, password, fullName, phoneNumber, homeAddress } = params;
      const emailRedirectTo = Linking.createURL("email-confirmed");

      console.log("[SupabaseAuthService] Registering user with emailRedirectTo:", emailRedirectTo);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            display_name: fullName.trim(),
            phone: phoneNumber?.trim() || null,
            address: homeAddress?.trim() || null,
          },
          emailRedirectTo,
        },
      });

      if (error) {
        console.error("[SupabaseAuthService] signUp error:", error.message || error.name || JSON.stringify(error));
        return { data: null, error };
      }

      return { data: { user: data.user, session: data.session }, error: null };
    } catch (err: any) {
      console.error("[SupabaseAuthService] Unexpected signUp exception:", err?.message || err);
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  /**
   * Generates a dynamic deep link redirect URL using expo-linking.
   * For Expo Dev Client & Standalone builds with scheme "childsafetyapp",
   * this generates e.g. "childsafetyapp://reset-password" or "exp+childsafetyapp://...".
   */
  getRedirectUrl(path: string): string {
    const redirectUrl = Linking.createURL(path);
    console.log(`[SupabaseAuthService] Generated redirect URL for '${path}':`, redirectUrl);
    return redirectUrl;
  },

  /**
   * Sends a password reset email via Supabase Auth.
   * Supabase will include the generated deep link in the email button.
   */
  async sendPasswordResetEmail(email: string): Promise<AuthResponse> {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const redirectTo = this.getRedirectUrl("reset-password");

      const { data, error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo,
      });

      if (error) {
        console.error("[SupabaseAuthService] resetPasswordForEmail error:", error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err: any) {
      console.error("[SupabaseAuthService] Unexpected resetPasswordForEmail exception:", err);
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  /**
   * Resends signup verification email with dynamic deep link callback.
   */
  async sendEmailVerification(email: string): Promise<AuthResponse> {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const redirectTo = this.getRedirectUrl("verify-email");

      const { data, error } = await supabase.auth.resend({
        type: "signup",
        email: trimmedEmail,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        console.error("[SupabaseAuthService] resend verification error:", error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err: any) {
      console.error("[SupabaseAuthService] Unexpected resend verification exception:", err);
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  /**
   * Updates the current user's password in Supabase.
   * Should be called after the user navigates to the reset-password screen via recovery deep link.
   */
  async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("[SupabaseAuthService] updateUser password error:", error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err: any) {
      console.error("[SupabaseAuthService] Unexpected updateUser password exception:", err);
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },
};
