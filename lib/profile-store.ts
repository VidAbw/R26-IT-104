import {
    ParentProfile,
    ProfileSettings,
    StoredParentProfile,
} from "@/types/profile";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_STORAGE_KEY = "child-safety-parent-profile:v1";
const PROFILE_SCHEMA_VERSION = 1;

const DEFAULT_SETTINGS: ProfileSettings = {
  pushAlertsEnabled: true,
  locationAlertsEnabled: true,
  weeklySummaryEnabled: true,
};

const createDefaultProfile = (displayName?: string): ParentProfile => ({
  displayName: displayName || "Parent",
  photoUri: "",
  children: [],
  settings: DEFAULT_SETTINGS,
});

const normalizeProfile = (
  profile: ParentProfile,
  fallbackDisplayName: string,
): ParentProfile => ({
  displayName: profile.displayName || fallbackDisplayName,
  photoUri: profile.photoUri || "",
  children: profile.children || [],
  settings: {
    ...DEFAULT_SETTINGS,
    ...profile.settings,
  },
});

export const getProfileStorageKey = () => PROFILE_STORAGE_KEY;

export const loadParentProfile = async (
  fallbackDisplayName: string,
): Promise<ParentProfile> => {
  const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

  if (!raw) {
    return createDefaultProfile(fallbackDisplayName);
  }

  try {
    const parsed = JSON.parse(raw) as StoredParentProfile;

    if (!parsed?.profile || parsed.version !== PROFILE_SCHEMA_VERSION) {
      return createDefaultProfile(fallbackDisplayName);
    }

    return normalizeProfile(parsed.profile, fallbackDisplayName);
  } catch {
    return createDefaultProfile(fallbackDisplayName);
  }
};

export const saveParentProfile = async (
  profile: ParentProfile,
): Promise<void> => {
  const payload: StoredParentProfile = {
    version: PROFILE_SCHEMA_VERSION,
    profile,
  };

  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(payload));
};
