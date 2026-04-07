import { ChildrenSection } from "@/components/profile/children-section";
import { ProfileHeader } from "@/components/profile/profile-header";
import { SettingsSection } from "@/components/profile/settings-section";
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

const getDefaultDisplayName = (
  sessionEmail?: string,
  userName?: string,
): string => {
  if (userName?.trim()) return userName.trim();
  if (!sessionEmail) return "Parent";

  return sessionEmail.split("@")[0] || "Parent";
};

export default function Profile() {
  const { session } = useAuth();
  const defaultDisplayName = useMemo(
    () =>
      getDefaultDisplayName(
        session?.user?.email,
        (session?.user?.user_metadata?.full_name ||
          session?.user?.user_metadata?.name) as string | undefined,
      ),
    [session],
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
    backgroundColor: "#f6f8fc",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#102a43",
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#486581",
    marginTop: 4,
    marginBottom: 10,
  },
  savingText: {
    color: "#2f6a9a",
    marginBottom: 8,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
