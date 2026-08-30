import { ChildrenSection } from "@/components/profile/children-section";
import { ProfileHeader } from "@/components/profile/profile-header";
import { SettingsSection } from "@/components/profile/settings-section";
import { KnownFacesSection } from "@/components/profile/known-faces-section";
import { useAuth } from "@/contexts/AuthProvider";
import { loadParentProfile, saveParentProfile } from "@/lib/profile-store";
import { ChildProfile, ParentProfile } from "@/types/profile";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { ProtectivaTheme } from "@/constants/theme";

const getDefaultDisplayName = (
  sessionEmail?: string,
  userName?: string,
): string => {
  if (userName?.trim()) return userName.trim();
  if (!sessionEmail) return "Parent";

  return sessionEmail.split("@")[0] || "Parent";
};

export default function Profile() {
  const { session, userName, refreshProfile } = useAuth();
  const defaultDisplayName = useMemo(
    () =>
      getDefaultDisplayName(
        session?.user?.email,
        userName || (session?.user?.user_metadata?.display_name as string | undefined),
      ),
    [session, userName],
  );

  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const boot = async () => {
      const loaded = await loadParentProfile(defaultDisplayName);
      if (!isMounted) return;

      setProfile(loaded);
      setIsLoading(false);
    };

    boot();

    return () => {
      isMounted = false;
    };
  }, [defaultDisplayName]);

  const persistProfile = async (nextProfile: ParentProfile) => {
    setProfile(nextProfile);
    setIsSaving(true);
    await saveParentProfile(nextProfile);
    setIsSaving(false);
  };

  const updateDisplayName = async (name: string) => {
    if (!profile) return;
    await persistProfile({ ...profile, displayName: name });

    if (session?.user) {
      try {
        await supabase.from("profiles").upsert({
          user_id: session.user.id,
          display_name: name.trim(),
        });
        await supabase.auth.updateUser({
          data: { display_name: name.trim() },
        });
        refreshProfile();
      } catch (e) {
        console.warn("Failed to sync profile to Supabase:", e);
      }
    }
  };

  const updatePhotoUri = async (photoUri: string) => {
    if (!profile) return;
    await persistProfile({ ...profile, photoUri });
  };

  const addChildProfile = async (
    childInput: Omit<ChildProfile, "id" | "createdAt">,
  ) => {
    if (!profile) return;

    const nextChild: ChildProfile = {
      ...childInput,
      id: `${Date.now()}-${Math.round(Math.random() * 10000)}`,
      createdAt: new Date().toISOString(),
    };

    await persistProfile({
      ...profile,
      children: [...profile.children, nextChild],
    });
  };

  const deleteChildProfile = async (childId: string) => {
    if (!profile) return;

    await persistProfile({
      ...profile,
      children: profile.children.filter((child) => child.id !== childId),
    });
  };

  const updateSettings = async (nextSettings: ParentProfile["settings"]) => {
    if (!profile) return;

    await persistProfile({
      ...profile,
      settings: nextSettings,
    });
  };

  if (isLoading || !profile) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Parent Profile</Text>
        <Text style={styles.pageSubtitle}>
          Manage your account and your children profiles.
        </Text>
        {isSaving ? (
          <Text style={styles.savingText}>Saving changes...</Text>
        ) : null}

        <ProfileHeader
          displayName={profile.displayName || defaultDisplayName}
          photoUri={profile.photoUri}
          editableName={profile.displayName}
          editablePhotoUri={profile.photoUri || ""}
          onChangeName={updateDisplayName}
          onChangePhotoUri={updatePhotoUri}
        />

        <KnownFacesSection />

        <SettingsSection
          settings={profile.settings}
          onUpdate={updateSettings}
        />

        <ChildrenSection
          childrenProfiles={profile.children}
          onAddChild={addChildProfile}
          onDeleteChild={deleteChildProfile}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: ProtectivaTheme.textPrimary,
  },
  pageSubtitle: {
    fontSize: 14,
    color: ProtectivaTheme.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  savingText: {
    color: ProtectivaTheme.primaryDark,
    fontWeight: "600",
    marginBottom: 8,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
});
