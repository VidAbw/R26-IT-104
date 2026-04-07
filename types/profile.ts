export type SafetyLevel = "low" | "medium" | "high";

export type ChildProfile = {
  id: string;
  name: string;
  age: number;
  safetyLevel: SafetyLevel;
  photoUri?: string;
  notes?: string;
  createdAt: string;
};

export type ProfileSettings = {
  pushAlertsEnabled: boolean;
  locationAlertsEnabled: boolean;
  weeklySummaryEnabled: boolean;
};

export type ParentProfile = {
  displayName: string;
  photoUri?: string;
  children: ChildProfile[];
  settings: ProfileSettings;
};

export type StoredParentProfile = {
  version: number;
  profile: ParentProfile;
};
