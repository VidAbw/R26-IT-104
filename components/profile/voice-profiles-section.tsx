import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProtectivaTheme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthProvider";
import { VoiceEnrollmentModal } from "../VoiceEnrollmentModal";

const DEFAULT_API_URL = Platform.OS === "web" ? "http://127.0.0.1:8000" : "http://192.168.1.72:8000";

export interface VoiceProfilesSectionProps {
  onProfilesUpdated?: () => void;
}

export const VoiceProfilesSection: React.FC<VoiceProfilesSectionProps> = ({
  onProfilesUpdated,
}) => {
  const { userEmail, userName } = useAuth();
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cleanEmail = (userEmail || "").trim().toLowerCase();
  const STORAGE_KEY = cleanEmail ? `childsafety_voice_profiles_${cleanEmail}` : "childsafety_voice_profiles_anon";

  useEffect(() => {
    const loadSavedIp = async () => {
      try {
        const savedIp = await AsyncStorage.getItem("child-safety-api-url");
        if (savedIp) {
          setApiBaseUrl(savedIp);
        }
      } catch (err) {
        console.error("Failed to load API URL", err);
      }
    };
    loadSavedIp();
  }, []);

  useEffect(() => {
    if (apiBaseUrl) {
      fetchProfiles();
    }
  }, [apiBaseUrl, userEmail]);

  const fetchProfiles = async () => {
    try {
      setIsLoading(true);
      const url = cleanEmail
        ? `${apiBaseUrl}/api/audio/profiles?user_email=${encodeURIComponent(cleanEmail)}`
        : `${apiBaseUrl}/api/audio/profiles`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        let list = data.profiles || [];

        // Strict client-side filter by user_email when available
        if (cleanEmail) {
          let localIds: string[] = [];
          try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) localIds = JSON.parse(raw);
          } catch {
            /* ignore */
          }

          list = list.filter((p: any) => {
            if (p.user_email) {
              return p.user_email.toLowerCase() === cleanEmail;
            }
            if (localIds.length > 0) {
              return localIds.includes(String(p.id));
            }
            return true;
          });
        }
        setProfiles(list);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async (profileId: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/audio/profiles/${profileId}/deactivate`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        fetchProfiles();
        onProfilesUpdated?.();
      } else {
        Alert.alert("Error", data.error || "Failed to deactivate voice profile.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDeleteProfile = (profile: any) => {
    const name = profile.person_name || "this voice profile";
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `Are you sure you want to permanently delete the biometric voice profile for "${name}"?`
      );
      if (confirmed) {
        executeDelete(profile.id, name);
      }
    } else {
      Alert.alert(
        "Delete Voice Profile",
        `Are you sure you want to permanently delete the biometric voice profile for "${name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => executeDelete(profile.id, name),
          },
        ]
      );
    }
  };

  const executeDelete = async (profileId: string, name: string) => {
    try {
      setIsDeletingId(profileId);
      const res = await fetch(`${apiBaseUrl}/api/audio/profiles/${profileId}?permanent=true`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        // Remove from local storage
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEY);
          if (raw) {
            const localIds = JSON.parse(raw).filter((id: string) => id !== String(profileId));
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localIds));
          }
        } catch {
          /* ignore */
        }

        fetchProfiles();
        onProfilesUpdated?.();
      } else {
        Alert.alert("Error", data.error || "Failed to delete voice profile.");
      }
    } catch (err: any) {
      Alert.alert("Network Error", `Could not connect to server: ${err.message}`);
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <View style={styles.card}>
      {/* 3-Step Guided Voice Registration Modal */}
      <VoiceEnrollmentModal
        visible={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        apiBaseUrl={apiBaseUrl}
        userEmail={userEmail}
        userName={userName}
        onSuccess={() => {
          fetchProfiles();
          onProfilesUpdated?.();
        }}
      />

      {/* Main Studio Card Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <Text style={styles.sectionTitle}>Voice Registration & Guardian Profiles</Text>
        {cleanEmail ? (
          <View style={styles.accountBadge}>
            <Ionicons name="person-circle-outline" size={15} color={ProtectivaTheme.primaryDark} />
            <Text style={styles.accountBadgeText}>{cleanEmail}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionSub}>
        Register authorized voice profiles for parents and caregivers. Protectiva uses text-independent biometric voiceprints to identify family members and monitor child safety.
      </Text>

      {/* Highlight Banner: 3-Step Guided Studio Modal Trigger */}
      <LinearGradient
        colors={["#F8FAFC", "#F0FDFA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bannerContainer}
      >
        <View style={{ flex: 1, minWidth: 260 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <View style={styles.recommendedBadge}>
              <View style={styles.recommendedDot} />
              <Text style={styles.recommendedText}>
                Recommended Enrollment
              </Text>
            </View>
          </View>

          <Text style={styles.bannerTitle}>
            3-Step Guided Voice Studio (Interactive)
          </Text>
          <Text style={styles.bannerDesc}>
            Calibrate room noise, recite challenge phrase with live acoustic validation, and securely hash your vocal biometric voiceprint.
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.86}
          style={styles.launchBtnWrapper}
          onPress={() => setShowEnrollModal(true)}
        >
          <LinearGradient
            colors={["#0F766E", "#0E7490", "#0284C7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.85 }}
            style={styles.launchBtnGradient}
          >
            <View style={styles.micIconCircle}>
              <Ionicons name="mic" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.launchBtnText}>
              Launch Voice Studio
            </Text>
            <Ionicons name="arrow-forward" size={15} color="rgba(255, 255, 255, 0.9)" style={{ marginLeft: 2 }} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Existing Registered Voice Profiles */}
      <View style={styles.profilesSectionWrapper}>
        <View style={styles.profilesHeaderRow}>
          <Text style={styles.profilesTitle}>
            Authorized Caregiver Voice Profiles ({profiles.filter((p) => p.is_active).length} Active)
          </Text>
          <TouchableOpacity onPress={fetchProfiles} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {isLoading ? (
              <ActivityIndicator size="small" color={ProtectivaTheme.primaryDark} />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={16} color={ProtectivaTheme.primaryDark} />
                <Text style={{ fontSize: 12, color: ProtectivaTheme.primaryDark, fontWeight: "600" }}>Refresh</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {profiles.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Ionicons name="mic-outline" size={32} color="#94A3B8" style={{ marginBottom: 6 }} />
            <Text style={styles.emptyStateTitle}>
              No voice profiles registered for {cleanEmail || "this account"} yet.
            </Text>
            <Text style={styles.emptyStateSub}>
              Launch the 3-step studio above to add your first authorized caregiver voice.
            </Text>
          </View>
        ) : (
          profiles.map((p) => (
            <View
              key={p.id}
              style={[
                styles.profileItemCard,
                {
                  backgroundColor: p.is_active ? "#FFFFFF" : "#F1F5F9",
                  borderColor: p.is_active ? "#E2E8F0" : "#CBD5E1",
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <View
                  style={[
                    styles.profileAvatar,
                    { backgroundColor: p.is_active ? "#E6F4F1" : "#E2E8F0" },
                  ]}
                >
                  <Ionicons
                    name={p.is_active ? "mic" : "mic-off"}
                    size={18}
                    color={p.is_active ? ProtectivaTheme.primaryDark : "#94A3B8"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Text style={{ fontWeight: "700", color: "#0F172A", fontSize: 15 }}>{p.person_name}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{p.role || "Parent"}</Text>
                    </View>
                    {!p.is_active && (
                      <View style={styles.deactivatedBadge}>
                        <Text style={styles.deactivatedBadgeText}>Deactivated</Text>
                      </View>
                    )}
                  </View>
                  {p.last_verified ? (
                    <Text style={{ color: "#64748B", fontSize: 11, marginTop: 3 }}>
                      Last verified nearby: {new Date(p.last_verified).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  ) : (
                    <Text style={{ color: "#94A3B8", fontSize: 11, marginTop: 3 }}>
                      Registered vocal biometric voiceprint
                    </Text>
                  )}
                </View>
              </View>

              {/* Actions: Deactivate & Delete */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {p.is_active && (
                  <TouchableOpacity
                    onPress={() => handleDeactivate(p.id)}
                    style={styles.deactivateBtn}
                  >
                    <Text style={styles.deactivateBtnText}>Deactivate</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => handleDeleteProfile(p)}
                  disabled={isDeletingId === p.id}
                  style={styles.deleteBtn}
                >
                  {isDeletingId === p.id ? (
                    <ActivityIndicator size="small" color="#DC2626" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={15} color="#DC2626" />
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 12,
    lineHeight: 18,
  },
  accountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  accountBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  bannerContainer: {
    borderRadius: 18,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#CCFBF1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
    shadowColor: "#0F766E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  recommendedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F4F1",
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  recommendedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0D9488",
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F766E",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  bannerDesc: {
    fontSize: 13,
    color: "#475569",
    marginTop: 4,
    lineHeight: 18,
  },
  launchBtnWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  launchBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 10,
  },
  micIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  launchBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  profilesSectionWrapper: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 16,
  },
  profilesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  profilesTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  emptyStateBox: {
    backgroundColor: "#F8FAFC",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyStateTitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
  },
  emptyStateSub: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 2,
  },
  profileItemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  roleBadge: {
    backgroundColor: "#E6F4F1",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCFBF1",
  },
  roleBadgeText: {
    color: ProtectivaTheme.primaryDark,
    fontSize: 11,
    fontWeight: "700",
  },
  deactivatedBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deactivatedBadgeText: {
    color: "#DC2626",
    fontSize: 10,
    fontWeight: "700",
  },
  deactivateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  deactivateBtnText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteBtnText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700",
  },
});
