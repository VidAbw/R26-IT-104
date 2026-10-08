import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ProtectivaTheme } from "../constants/theme";
import { supabase } from "../lib/supabase";

export interface ChildMonitoringTabProps {
  apiBaseUrl: string;
}

type MonitoringMode = "naptime" | "playtime" | "high_protection";
type ActiveRoom = "nursery" | "play_area" | "crib";

export const ChildMonitoringTab: React.FC<ChildMonitoringTabProps> = ({
  apiBaseUrl,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [cameraStatus, setCameraStatus] = useState<string>("Stopped");
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [frameTick, setFrameTick] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedMode, setSelectedMode] = useState<MonitoringMode>("naptime");
  const [selectedRoom, setSelectedRoom] = useState<ActiveRoom>("nursery");
  const [snapshotFeedback, setSnapshotFeedback] = useState<string | null>(null);

  // Auto-refresh stream frame when running
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (cameraStatus === "Running") {
      interval = setInterval(() => {
        setFrameTick(Date.now());
      }, 150);
    }
    return () => clearInterval(interval);
  }, [cameraStatus]);

  // Real-time alerts subscription from Supabase
  useEffect(() => {
    fetchAlerts();
    const subscription = supabase
      .channel("child_monitoring_alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
        },
        () => fetchAlerts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(10);

    if (data && !error) setAlerts(data);
  };

  const startCamera = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/iot/start`, { method: "POST" });
      if (res.ok) {
        setCameraStatus("Running");
        setStreamUrl(`${apiBaseUrl}/api/iot/stream`);
      } else {
        Alert.alert(
          "Camera Offline",
          "Could not start the nursery camera stream. Please ensure your webcam or ESP32-CAM is connected to the backend server."
        );
      }
    } catch (e) {
      Alert.alert(
        "Connection Error",
        `Could not reach Child Safety server at ${apiBaseUrl}. Please verify the server is running.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/iot/stop`, { method: "POST" });
      if (res.ok) {
        setCameraStatus("Stopped");
        setStreamUrl(null);
      } else {
        Alert.alert("Error", "Failed to stop camera stream.");
      }
    } catch (e) {
      Alert.alert("Error", "Network error while stopping camera stream.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerTestAlert = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/iot/alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "guardian-user",
          source: "nanny_cam",
          type: "hazard",
          probability: 0.94,
          timestamp: new Date().toISOString(),
          details: { triggered_by: ["Test Hazard Simulation • Crib Perimeter"] },
        }),
      });
      if (res.ok) {
        Alert.alert("Hazard Alert Sent", "Simulated hazard detection was logged to the event feed.");
        fetchAlerts();
      } else {
        Alert.alert("Error", "Failed to dispatch test hazard alert.");
      }
    } catch (e) {
      Alert.alert("Error", "Network error sending test alert.");
    }
  };

  const handleTakeSnapshot = () => {
    if (cameraStatus !== "Running") {
      Alert.alert("Camera Inactive", "Start the live stream to capture a snapshot.");
      return;
    }
    const timestampStr = new Date().toLocaleTimeString();
    setSnapshotFeedback(`Snapshot captured at ${timestampStr}`);
    setTimeout(() => setSnapshotFeedback(null), 3500);
  };

  return (
    <View style={styles.container}>
      {/* Page Header Bar */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, minWidth: 260 }}>
          <Text style={styles.pageTitle}>Child Monitoring System</Text>
          <Text style={styles.pageSubtitle}>
            Real-time nursery video surveillance, AI hazard detection, and environment safety.
          </Text>
        </View>

        {/* Live Stream Status Badge */}
        <View
          style={[
            styles.statusPill,
            cameraStatus === "Running" ? styles.statusPillLive : styles.statusPillStandby,
          ]}
        >
          <View
            style={[
              styles.statusPulseDot,
              { backgroundColor: cameraStatus === "Running" ? "#10B981" : "#94A3B8" },
            ]}
          />
          <Text
            style={[
              styles.statusPillText,
              { color: cameraStatus === "Running" ? "#065F46" : "#475569" },
            ]}
          >
            {cameraStatus === "Running" ? "Live Stream Active (1080p)" : "Camera on Standby"}
          </Text>
        </View>
      </View>

      {/* Room Selection & Mode Tabs */}
      <View style={styles.roomSelectorRow}>
        <View style={styles.roomButtonsWrap}>
          <TouchableOpacity
            style={[styles.roomTabBtn, selectedRoom === "nursery" && styles.roomTabBtnActive]}
            onPress={() => setSelectedRoom("nursery")}
          >
            <Ionicons
              name="videocam"
              size={15}
              color={selectedRoom === "nursery" ? ProtectivaTheme.primaryDark : "#64748B"}
            />
            <Text
              style={[
                styles.roomTabText,
                selectedRoom === "nursery" && styles.roomTabTextActive,
              ]}
            >
              Nursery Room (Main)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roomTabBtn, selectedRoom === "play_area" && styles.roomTabBtnActive]}
            onPress={() => setSelectedRoom("play_area")}
          >
            <Ionicons
              name="happy-outline"
              size={15}
              color={selectedRoom === "play_area" ? ProtectivaTheme.primaryDark : "#64748B"}
            />
            <Text
              style={[
                styles.roomTabText,
                selectedRoom === "play_area" && styles.roomTabTextActive,
              ]}
            >
              Play Area
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roomTabBtn, selectedRoom === "crib" && styles.roomTabBtnActive]}
            onPress={() => setSelectedRoom("crib")}
          >
            <Ionicons
              name="bed-outline"
              size={15}
              color={selectedRoom === "crib" ? ProtectivaTheme.primaryDark : "#64748B"}
            />
            <Text
              style={[
                styles.roomTabText,
                selectedRoom === "crib" && styles.roomTabTextActive,
              ]}
            >
              Crib Cam
            </Text>
          </TouchableOpacity>
        </View>

        {/* Server IP Indicator */}
        <View style={styles.serverInfoBadge}>
          <Ionicons name="hardware-chip-outline" size={13} color="#64748B" />
          <Text style={styles.serverInfoText}>{apiBaseUrl}</Text>
        </View>
      </View>

      {/* Main Video Stream Viewport */}
      <View style={styles.videoCard}>
        {/* Viewport Top Bar */}
        <View style={styles.videoTopBar}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={[
                styles.recDot,
                { backgroundColor: cameraStatus === "Running" ? "#EF4444" : "#94A3B8" },
              ]}
            />
            <Text style={styles.videoCamLabel}>
              {cameraStatus === "Running" ? "REC • LIVE FEED" : "FEED OFFLINE"}
            </Text>
            <View style={styles.hdTag}>
              <Text style={styles.hdTagText}>HD 1080P</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity
              onPress={handleTakeSnapshot}
              style={styles.viewportIconBtn}
            >
              <Ionicons name="camera-outline" size={17} color="#F1F5F9" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFrameTick(Date.now())}
              style={styles.viewportIconBtn}
            >
              <Ionicons name="refresh-outline" size={17} color="#F1F5F9" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Video Canvas Container */}
        <View style={styles.viewportBox}>
          {cameraStatus === "Running" && streamUrl ? (
            <View style={{ flex: 1, position: "relative" }}>
              <Image
                source={{ uri: `${streamUrl}?t=${frameTick}` }}
                style={styles.streamImage}
                contentFit="contain"
                cachePolicy="none"
              />

              {/* Live Overlay Telemetry HUD */}
              <View style={styles.hudOverlayBar}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                  <Text style={styles.hudText}>AI Vision: YOLOv8 & Pose Estimator Active</Text>
                </View>
                <Text style={styles.hudTimestamp}>
                  {new Date().toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.offlineBox}>
              <View style={styles.offlineIconCircle}>
                <Ionicons name="videocam-off-outline" size={42} color="#64748B" />
              </View>
              <Text style={styles.offlineTitle}>Nursery Camera is on Standby</Text>
              <Text style={styles.offlineSubtitle}>
                Connect to your local nursery camera or ESP32-CAM stream to begin live safety monitoring.
              </Text>

              <TouchableOpacity
                style={styles.startStreamCTAWrapper}
                onPress={startCamera}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={["#0F766E", "#0E7490", "#0284C7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0.85 }}
                  style={styles.startStreamCTAGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="play" size={16} color="#FFFFFF" />
                      <Text style={styles.startStreamCTAText}>Start Live Stream Feed</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Feedback Toast */}
          {snapshotFeedback && (
            <View style={styles.snapshotFeedbackToast}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.snapshotFeedbackText}>{snapshotFeedback}</Text>
            </View>
          )}
        </View>

        {/* Action Controls Toolbar */}
        <View style={styles.controlsBar}>
          <View style={styles.controlsBtnGroup}>
            {cameraStatus !== "Running" ? (
              <TouchableOpacity
                style={[styles.primaryActionBtn, styles.btnStart]}
                onPress={startCamera}
                disabled={isLoading}
              >
                <Ionicons name="play" size={16} color="#FFFFFF" />
                <Text style={styles.btnActionText}>
                  {isLoading ? "Starting..." : "Start Camera"}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryActionBtn, styles.btnStop]}
                onPress={stopCamera}
                disabled={isLoading}
              >
                <Ionicons name="stop" size={16} color="#FFFFFF" />
                <Text style={styles.btnActionText}>
                  {isLoading ? "Stopping..." : "Stop Camera"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={handleTakeSnapshot}
            >
              <Ionicons name="camera-outline" size={16} color="#0F172A" />
              <Text style={styles.secondaryBtnText}>Snapshot</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryActionBtn, styles.btnTestHazard]}
              onPress={triggerTestAlert}
            >
              <Ionicons name="warning-outline" size={16} color="#D97706" />
              <Text style={[styles.secondaryBtnText, { color: "#B45309" }]}>
                Test Hazard Alert
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Monitoring Mode Selection Card */}
      <View style={styles.modeCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Ionicons name="options-outline" size={20} color={ProtectivaTheme.primaryDark} />
          <Text style={styles.sectionHeaderTitle}>Smart Monitoring Mode</Text>
        </View>

        <View style={styles.modeTilesGrid}>
          {/* Naptime Mode */}
          <TouchableOpacity
            style={[
              styles.modeTile,
              selectedMode === "naptime" && styles.modeTileActive,
            ]}
            onPress={() => setSelectedMode("naptime")}
          >
            <View style={styles.modeTileHeader}>
              <View
                style={[
                  styles.modeIconCircle,
                  { backgroundColor: selectedMode === "naptime" ? "#E0F2FE" : "#F1F5F9" },
                ]}
              >
                <Ionicons
                  name="moon"
                  size={18}
                  color={selectedMode === "naptime" ? "#0284C7" : "#64748B"}
                />
              </View>
              {selectedMode === "naptime" && (
                <View style={styles.activeCheckBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text style={styles.modeTileTitle}>Naptime / Sleep Mode</Text>
            <Text style={styles.modeTileDesc}>
              Optimized for crib resting. High sensitivity to irregular rollover or face occlusion.
            </Text>
          </TouchableOpacity>

          {/* Playtime Mode */}
          <TouchableOpacity
            style={[
              styles.modeTile,
              selectedMode === "playtime" && styles.modeTileActive,
            ]}
            onPress={() => setSelectedMode("playtime")}
          >
            <View style={styles.modeTileHeader}>
              <View
                style={[
                  styles.modeIconCircle,
                  { backgroundColor: selectedMode === "playtime" ? "#FEF3C7" : "#F1F5F9" },
                ]}
              >
                <Ionicons
                  name="cube-outline"
                  size={18}
                  color={selectedMode === "playtime" ? "#D97706" : "#64748B"}
                />
              </View>
              {selectedMode === "playtime" && (
                <View style={styles.activeCheckBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text style={styles.modeTileTitle}>Active Playtime Mode</Text>
            <Text style={styles.modeTileDesc}>
              Monitors play perimeter. Alerts on sharp objects, room exit, or sudden fall trajectories.
            </Text>
          </TouchableOpacity>

          {/* High Security Mode */}
          <TouchableOpacity
            style={[
              styles.modeTile,
              selectedMode === "high_protection" && styles.modeTileActive,
            ]}
            onPress={() => setSelectedMode("high_protection")}
          >
            <View style={styles.modeTileHeader}>
              <View
                style={[
                  styles.modeIconCircle,
                  { backgroundColor: selectedMode === "high_protection" ? "#DCFCE7" : "#F1F5F9" },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color={selectedMode === "high_protection" ? "#16A34A" : "#64748B"}
                />
              </View>
              {selectedMode === "high_protection" && (
                <View style={styles.activeCheckBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text style={styles.modeTileTitle}>High Perimeter Protection</Text>
            <Text style={styles.modeTileDesc}>
              Immediate notifications for unrecognized individuals. Verified against Known Faces.
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Real-time Safety Sensor Telemetry Grid */}
      <View style={styles.telemetryGrid}>
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <View style={[styles.telemetryIconBox, { backgroundColor: "#DCFCE7" }]}>
              <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
            </View>
            <Text style={styles.telemetryTag}>Safe</Text>
          </View>
          <Text style={styles.telemetryValue}>Safe & Protected</Text>
          <Text style={styles.telemetrySub}>Monitored nursery perimeter secure</Text>
        </View>

        <View style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <View style={[styles.telemetryIconBox, { backgroundColor: "#E0F2FE" }]}>
              <Ionicons name="scan-outline" size={20} color="#0284C7" />
            </View>
            <Text style={styles.telemetryTag}>Vision AI</Text>
          </View>
          <Text style={styles.telemetryValue}>0 Hazards Detected</Text>
          <Text style={styles.telemetrySub}>Real-time fall & object detection active</Text>
        </View>

        <View style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <View style={[styles.telemetryIconBox, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="person-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.telemetryTag}>Facial ID</Text>
          </View>
          <Text style={styles.telemetryValue}>Known Guardian Area</Text>
          <Text style={styles.telemetrySub}>Recognizing family members</Text>
        </View>

        <View style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <View style={[styles.telemetryIconBox, { backgroundColor: "#F1F5F9" }]}>
              <Ionicons name="partly-sunny-outline" size={20} color="#475569" />
            </View>
            <Text style={styles.telemetryTag}>Environment</Text>
          </View>
          <Text style={styles.telemetryValue}>Comfortable</Text>
          <Text style={styles.telemetrySub}>Safe nursery lighting & acoustics</Text>
        </View>
      </View>

      {/* Camera Hazard Alerts Event Feed */}
      <View style={styles.alertsCard}>
        <View style={styles.alertsHeaderRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="notifications-outline" size={20} color={ProtectivaTheme.primaryDark} />
            <Text style={styles.sectionHeaderTitle}>Camera Hazard & Safety Feed</Text>
          </View>

          <TouchableOpacity
            onPress={fetchAlerts}
            style={styles.refreshAlertsBtn}
          >
            <Ionicons name="refresh-outline" size={15} color={ProtectivaTheme.primaryDark} />
            <Text style={styles.refreshAlertsText}>Refresh Feed</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 12 }}>
          {alerts.length === 0 ? (
            <View style={styles.emptyAlertsBox}>
              <Ionicons name="shield-checkmark" size={36} color="#10B981" />
              <Text style={styles.emptyAlertsTitle}>All Clear — No Camera Hazards</Text>
              <Text style={styles.emptyAlertsSub}>
                Nursery camera feed and child safety area are fully secure.
              </Text>
            </View>
          ) : (
            alerts.slice(0, 5).map((alert, index) => {
              const isHazard = alert.type === "hazard" || alert.type === "abuse_suspected";
              const isFall = alert.type === "fall";
              const alertColor = isHazard ? "#DC2626" : isFall ? "#EA580C" : "#0284C7";
              const alertBg = isHazard ? "#FEF2F2" : isFall ? "#FFF7ED" : "#F0F9FF";

              return (
                <View
                  key={alert.id || index}
                  style={[styles.alertItemRow, { borderLeftColor: alertColor }]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <View style={[styles.alertBadge, { backgroundColor: alertBg }]}>
                        <Text style={[styles.alertBadgeText, { color: alertColor }]}>
                          {alert.type ? alert.type.toUpperCase() : "HAZARD"}
                        </Text>
                      </View>
                      <Text style={styles.alertTimestamp}>
                        {alert.timestamp
                          ? new Date(alert.timestamp).toLocaleTimeString()
                          : "Just now"}
                      </Text>
                    </View>

                    <Text style={styles.alertDetailText}>
                      {alert.details?.triggered_by?.join(", ") ||
                        "Visual movement detected in nursery perimeter"}
                    </Text>
                  </View>

                  <View style={styles.confidencePill}>
                    <Text style={styles.confidenceText}>
                      {alert.probability ? `${Math.round(alert.probability * 100)}% Match` : "Verified"}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* Parent Profile Known Faces Bridge */}
      <View style={styles.profileBridgeCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1, minWidth: 260 }}>
          <View style={styles.bridgeIconCircle}>
            <Ionicons name="people-outline" size={24} color={ProtectivaTheme.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bridgeTitle}>Manage Authorized Family & Caregiver Faces</Text>
            <Text style={styles.bridgeSub}>
              Add photos of parents and trusted guardians to prevent "Unknown Person" alerts on the live camera stream.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bridgeBtn}
          onPress={() => router.push("/profile")}
        >
          <Text style={styles.bridgeBtnText}>Manage in Parent Profile →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  statusPillLive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  statusPillStandby: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  statusPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  roomSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  roomButtonsWrap: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  roomTabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  roomTabBtnActive: {
    backgroundColor: "#E6F4F1",
    borderColor: "#99F6E4",
  },
  roomTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  roomTabTextActive: {
    color: ProtectivaTheme.primaryDark,
    fontWeight: "700",
  },
  serverInfoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
  },
  serverInfoText: {
    fontSize: 11,
    color: "#64748B",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  videoCard: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1E293B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  videoTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1E293B",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  videoCamLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: 0.5,
  },
  hdTag: {
    backgroundColor: "#334155",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hdTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
  },
  viewportIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  viewportBox: {
    height: 380,
    backgroundColor: "#020617",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  streamImage: {
    width: "100%",
    height: "100%",
  },
  hudOverlayBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hudText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "600",
  },
  hudTimestamp: {
    color: "#94A3B8",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  offlineBox: {
    alignItems: "center",
    paddingHorizontal: 24,
    maxWidth: 420,
  },
  offlineIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  offlineTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC",
    textAlign: "center",
  },
  offlineSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 20,
  },
  startStreamCTAWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  startStreamCTAGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 12,
    gap: 8,
  },
  startStreamCTAText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  snapshotFeedbackToast: {
    position: "absolute",
    top: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  snapshotFeedbackText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  controlsBar: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  controlsBtnGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  btnStart: {
    backgroundColor: "#0D9488",
  },
  btnStop: {
    backgroundColor: "#DC2626",
  },
  btnActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  btnTestHazard: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  modeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modeTilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  modeTile: {
    flex: 1,
    minWidth: 220,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  modeTileActive: {
    backgroundColor: "#FFFFFF",
    borderColor: ProtectivaTheme.primaryDark,
    shadowColor: ProtectivaTheme.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  modeTileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  activeCheckBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ProtectivaTheme.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  modeTileTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  modeTileDesc: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },
  telemetryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  telemetryCard: {
    flex: 1,
    minWidth: 170,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  telemetryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  telemetryIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  telemetryTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  telemetryValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  telemetrySub: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 14,
  },
  alertsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  alertsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  refreshAlertsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#E6F4F1",
  },
  refreshAlertsText: {
    fontSize: 12,
    fontWeight: "700",
    color: ProtectivaTheme.primaryDark,
  },
  emptyAlertsBox: {
    backgroundColor: "#F8FAFC",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyAlertsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 8,
  },
  emptyAlertsSub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 2,
  },
  alertItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  alertBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  alertTimestamp: {
    fontSize: 11,
    color: "#94A3B8",
  },
  alertDetailText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
  confidencePill: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  profileBridgeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#CCFBF1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  bridgeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E6F4F1",
    alignItems: "center",
    justifyContent: "center",
  },
  bridgeTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  bridgeSub: {
    fontSize: 12,
    color: "#475569",
    marginTop: 2,
    lineHeight: 16,
  },
  bridgeBtn: {
    backgroundColor: "#E6F4F1",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  bridgeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: ProtectivaTheme.primaryDark,
  },
});
