import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  TextInput,
  Image as RNImage,
  useWindowDimensions,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Audio } from "expo-av";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import LegalGuidanceScreen from "./legal-guidance";
import { ProtectivaTheme } from "../../constants/theme";
import { DiscreetModeProvider, useDiscreetMode } from "../../contexts/DiscreetModeContext";
import { ProtectivaHeader } from "../../components/ProtectivaHeader";
import { ProtectivaSidebar, ProtectivaNavTab } from "../../components/ProtectivaSidebar";
import { EmergencyAlertModal } from "../../components/EmergencyAlertModal";
import { useAuth } from "../../contexts/AuthProvider";

// Default Fallback IP
const DEFAULT_API_URL = Platform.OS === "web" ? "http://127.0.0.1:8000" : "http://192.168.1.72:8000";

export default function DashboardContainer() {
  return (
    <DiscreetModeProvider>
      <DashboardMain />
    </DiscreetModeProvider>
  );
}

function DashboardMain() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { userEmail, userName } = useAuth();

  const [activeTab, setActiveTab] = useState<ProtectivaNavTab>("overview");
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL);
  const [isEditingIp, setIsEditingIp] = useState(false);
  const [tempIp, setTempIp] = useState(apiBaseUrl);

  const [listenerStatus, setListenerStatus] = useState<string>("Unknown");
  const [profileCount, setProfileCount] = useState<number>(0);
  const [parentName, setParentName] = useState<string>("");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [lastAudioResult, setLastAudioResult] = useState<any>(null);
  const [activeProfiles, setActiveProfiles] = useState<any[]>([]);

  // Modals & Mobile Drawer State
  const [selectedEmergencyAlert, setSelectedEmergencyAlert] = useState<any>(null);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const triggerEmergencyAlert = () => {
    setSelectedEmergencyAlert({
      id: 'panic-' + Date.now(),
      event_type: 'EMERGENCY_PANIC_BUTTON',
      confidence: 0.98,
      timestamp: new Date().toISOString(),
      threat_level: 'High',
      sensor_type: 'acoustic',
      status: 'active',
    });
  };

  const { isDiscreetMode } = useDiscreetMode();

  useEffect(() => {
    const loadSavedIp = async () => {
      try {
        const savedIp = await AsyncStorage.getItem("child-safety-api-url");
        if (savedIp) {
          setApiBaseUrl(savedIp);
          setTempIp(savedIp);
        }
      } catch (err) {
        console.error("Failed to load API URL", err);
      }
    };
    loadSavedIp();
  }, []);

  useEffect(() => {
    fetchStatus();
    const statusInterval = setInterval(fetchStatus, 5000);
    const resultInterval = setInterval(fetchLastResult, 4000);
    fetchLastResult();

    return () => {
      clearInterval(statusInterval);
      clearInterval(resultInterval);
    };
  }, [apiBaseUrl, userEmail]);

  useEffect(() => {
    fetchAlerts();
    const subscription = supabase
      .channel("threat_alerts_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "audio_threat_alerts",
          filter: "sensor_type=eq.'acoustic'",
        },
        () => fetchAlerts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchStatus = async () => {
    try {
      const url = userEmail && userEmail.trim()
        ? `${apiBaseUrl}/api/audio/status?user_email=${encodeURIComponent(userEmail.trim().toLowerCase())}`
        : `${apiBaseUrl}/api/audio/status`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setListenerStatus("Online");
        setParentName(data.parent_name ?? "");
        if (data.active_profiles) {
          // Strict user-email isolation filter
          let filtered = data.active_profiles;
          if (userEmail && userEmail.trim()) {
            const cleanEmail = userEmail.trim().toLowerCase();
            filtered = filtered.filter((p: any) => !p.user_email || p.user_email.toLowerCase() === cleanEmail);
          }
          setActiveProfiles(filtered);
          setProfileCount(filtered.length);
        } else {
          setProfileCount(data.registered_profiles ?? 0);
        }
      } else {
        setListenerStatus("Disconnected");
      }
    } catch {
      setListenerStatus("Disconnected");
    }
  };

  const fetchLastResult = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/audio/last-result`);
      if (res.ok) {
        const data = await res.json();
        setLastAudioResult(data);
        if (data.status && data.status !== "No data yet — waiting for ESP32 audio.") {
          setPrediction(
            `Status: ${data.status} | Vol: ${data.amplitude_db || 0} dB | Device: ${data.device_info ?? "ESP32"}`
          );
        }
      }
    } catch {
      /* backend offline */
    }
  };

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from("audio_threat_alerts")
      .select("*")
      .eq("sensor_type", "acoustic")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data && !error) setAlerts(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const saveIp = async () => {
    setApiBaseUrl(tempIp);
    setIsEditingIp(false);
    try {
      await AsyncStorage.setItem("child-safety-api-url", tempIp);
    } catch (err) {
      console.error("Failed to save API URL", err);
    }
  };

  const startGuardian = async () => {
    try {
      await fetch(`${apiBaseUrl}/api/audio/start`, { method: "POST" });
      fetchStatus();
    } catch (e) {
      Alert.alert("Error", "Failed to start Guardian");
    }
  };

  const stopGuardian = async () => {
    try {
      await fetch(`${apiBaseUrl}/api/audio/stop`, { method: "POST" });
      fetchStatus();
    } catch (e) {
      Alert.alert("Error", "Failed to stop Guardian");
    }
  };

  const clearAlerts = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/audio/clear-alerts`, { method: "POST" });
      if (response.ok) {
        Alert.alert("Success", "Alert log cleared");
        setAlerts([]);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to clear alerts");
    }
  };

  return (
    <View style={styles.appWrapper}>
      {/* Top Header Bar */}
      <ProtectivaHeader
        isMobile={!isDesktop}
        onToggleMobileMenu={() => setShowMobileDrawer(true)}
        unreadAlertCount={alerts.length}
        onPressAlerts={() => setActiveTab("alerts_history")}
        onLogout={handleLogout}
      />

      {/* Main Body (Sidebar + Content) */}
      <View style={styles.bodyLayout}>
        {isDesktop && (
          <ProtectivaSidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            alertCount={alerts.length}
          />
        )}

        <View style={styles.mainContentPane}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* IP Config Toolbar */}
            <View style={styles.networkConfigBar}>
              <Text style={styles.networkLabel}>Server IP:</Text>
              {isEditingIp ? (
                <View style={styles.ipEditRow}>
                  <TextInput
                    style={styles.ipInput}
                    value={tempIp}
                    onChangeText={setTempIp}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  <TouchableOpacity style={styles.btnSaveIp} onPress={saveIp}>
                    <Text style={styles.btnSaveIpText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setIsEditingIp(true)}>
                  <Text style={styles.ipValue}>{apiBaseUrl} ✎</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Render Tab Views */}
            {activeTab === "overview" && (
              <OverviewDashboardView
                listenerStatus={listenerStatus}
                parentName={parentName}
                profileCount={profileCount}
                alerts={alerts}
                prediction={prediction}
                isDiscreetMode={isDiscreetMode}
                lastAudioResult={lastAudioResult}
                activeProfiles={activeProfiles}
                onNavigate={(tab) => setActiveTab(tab)}
                onTriggerEmergency={triggerEmergencyAlert}
                onStartGuardian={startGuardian}
                onStopGuardian={stopGuardian}
              />
            )}

            {activeTab === "voice_monitoring" && (
              <RegisterVoiceTab
                apiBaseUrl={apiBaseUrl}
                userEmail={userEmail}
                userName={userName}
                onProfilesUpdated={fetchStatus}
              />
            )}

            {activeTab === "nanny_camera" && (
              <NannyCamTab apiBaseUrl={apiBaseUrl} />
            )}

            {activeTab === "legal_guidance" && <LegalGuidanceScreen />}

            {activeTab === "alerts_history" && (
              <AlertsHistoryTab
                alerts={alerts}
                isDiscreetMode={isDiscreetMode}
                onClearAlerts={clearAlerts}
              />
            )}

            {activeTab === "emergency_support" && (
              <EmergencySupportView onTriggerEmergency={triggerEmergencyAlert} />
            )}

            {activeTab === "resources" && <ResourcesView />}

            {activeTab === "settings" && <SettingsView apiBaseUrl={apiBaseUrl} saveIp={saveIp} />}
          </ScrollView>
        </View>
      </View>

      {/* Mobile Drawer Navigation Modal */}
      {!isDesktop && showMobileDrawer && (
        <Modal transparent animationType="fade" visible={showMobileDrawer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMobileDrawer(false)}
          >
            <View style={styles.drawerContent} onStartShouldSetResponder={() => true}>
              <ProtectivaSidebar
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  setActiveTab(tab);
                  setShowMobileDrawer(false);
                }}
                alertCount={alerts.length}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Mobile Bottom Tab Bar */}
      {!isDesktop && (
        <View style={styles.mobileTabBar}>
          <TouchableOpacity
            style={styles.tabBarItem}
            onPress={() => setActiveTab("overview")}
          >
            <Ionicons
              name={activeTab === "overview" ? "grid" : "grid-outline"}
              size={22}
              color={activeTab === "overview" ? ProtectivaTheme.primaryDark : ProtectivaTheme.textSecondary}
            />
            <Text style={[styles.tabBarLabel, activeTab === "overview" && styles.tabBarLabelActive]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabBarItem}
            onPress={() => setActiveTab("voice_monitoring")}
          >
            <Ionicons
              name={activeTab === "voice_monitoring" ? "mic" : "mic-outline"}
              size={22}
              color={activeTab === "voice_monitoring" ? ProtectivaTheme.primaryDark : ProtectivaTheme.textSecondary}
            />
            <Text style={[styles.tabBarLabel, activeTab === "voice_monitoring" && styles.tabBarLabelActive]}>
              Monitoring
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabBarItem}
            onPress={() => setActiveTab("nanny_camera")}
          >
            <Ionicons
              name={activeTab === "nanny_camera" ? "videocam" : "videocam-outline"}
              size={22}
              color={activeTab === "nanny_camera" ? ProtectivaTheme.primaryDark : ProtectivaTheme.textSecondary}
            />
            <Text style={[styles.tabBarLabel, activeTab === "nanny_camera" && styles.tabBarLabelActive]}>
              Camera
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabBarItem}
            onPress={() => setActiveTab("emergency_support")}
          >
            <Ionicons
              name={activeTab === "emergency_support" ? "call" : "call-outline"}
              size={22}
              color={activeTab === "emergency_support" ? ProtectivaTheme.primaryDark : ProtectivaTheme.textSecondary}
            />
            <Text style={[styles.tabBarLabel, activeTab === "emergency_support" && styles.tabBarLabelActive]}>
              Support
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabBarItem}
            onPress={() => setShowMobileDrawer(true)}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={ProtectivaTheme.textSecondary} />
            <Text style={styles.tabBarLabel}>More</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Emergency Modal */}
      <EmergencyAlertModal
        alert={selectedEmergencyAlert}
        onAcknowledge={async () => setSelectedEmergencyAlert(null)}
        onDismiss={() => setSelectedEmergencyAlert(null)}
      />
    </View>
  );
}

// ==========================================
// --- OVERVIEW DASHBOARD VIEW ---
// ==========================================
interface OverviewProps {
  listenerStatus: string;
  parentName: string;
  profileCount: number;
  alerts: any[];
  prediction: string;
  isDiscreetMode: boolean;
  lastAudioResult?: any;
  activeProfiles?: any[];
  onNavigate: (tab: ProtectivaNavTab) => void;
  onTriggerEmergency: () => void;
  onStartGuardian: () => void;
  onStopGuardian: () => void;
}

function OverviewDashboardView({
  listenerStatus,
  parentName,
  profileCount,
  alerts,
  prediction,
  isDiscreetMode,
  lastAudioResult,
  activeProfiles = [],
  onNavigate,
  onTriggerEmergency,
  onStartGuardian,
  onStopGuardian,
}: OverviewProps) {
  const isOnline = listenerStatus.startsWith("Online");
  const { userName } = useAuth();

  return (
    <View style={styles.overviewContainer}>
      {/* Welcome Banner */}
      <View style={styles.welcomeBanner}>
        <View>
          <Text style={styles.welcomeTitle}>Welcome back, {userName || "Guardian"}! 👋</Text>
          <Text style={styles.welcomeSubtext}>
            You're all set. Everything looks good and your child is protected.
          </Text>
        </View>
        <View style={styles.systemOnlineBadge}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#16A34A' : '#EF4444' }]} />
          <View style={{ marginLeft: 6 }}>
            <Text style={styles.systemOnlineText}>
              ● {isOnline ? 'System Online' : 'System Offline'}
            </Text>
            <Text style={styles.systemOnlineSub}>
              {isOnline ? 'All systems are active' : 'Connect to server'}
            </Text>
          </View>
        </View>
      </View>

      {/* Real-Time Active Presence Status Card */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: lastAudioResult?.active_speaker ? '#DCFCE7' : '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={lastAudioResult?.active_speaker ? 'person' : 'shield-checkmark'}
                size={22}
                color={lastAudioResult?.active_speaker ? '#16A34A' : ProtectivaTheme.primaryDark}
              />
            </View>

            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}>
                Active Presence with Child
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>
                {lastAudioResult?.active_speaker
                  ? `${lastAudioResult.active_speaker} (${lastAudioResult.speaker_role || 'Guardian'})`
                  : (parentName ? `${parentName} (Registered)` : 'Monitoring Area — Child is Safe')}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: lastAudioResult?.active_speaker ? '#DCFCE7' : '#F8FAFC',
              borderWidth: 1,
              borderColor: lastAudioResult?.active_speaker ? '#86EFAC' : '#E2E8F0',
              gap: 6,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: lastAudioResult?.active_speaker ? '#16A34A' : '#64748B',
              }}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: lastAudioResult?.active_speaker ? '#16A34A' : '#475569',
              }}
            >
              {lastAudioResult?.presence_status || (isOnline ? 'Active Monitoring' : 'Offline')}
            </Text>
          </View>
        </View>

        {/* Authorized Guardians List Chips */}
        {activeProfiles.length > 0 && (
          <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Authorized Caregivers ({activeProfiles.length})
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {activeProfiles.map((p: any) => (
                <View
                  key={p.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    gap: 4,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155' }}>
                    {p.person_name}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>
                    ({p.role || 'Parent'})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* 3 Main Status Cards Grid */}
      <View style={styles.statusCardsRow}>
        {/* Card 1: Voice Guardian */}
        <View style={styles.statusCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="mic-outline" size={22} color={ProtectivaTheme.primaryDark} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.statusCardTitle}>Voice Guardian</Text>
              <Text style={[styles.statusBadgeText, { color: isOnline ? '#16A34A' : '#DC2626' }]}>
                {isOnline ? 'Active' : 'Offline'}
              </Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Monitoring voice activity for safety and well-being.
          </Text>
          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={() => onNavigate("voice_monitoring")}
          >
            <Text style={styles.cardActionBtnText}>Manage Voice</Text>
          </TouchableOpacity>
        </View>

        {/* Card 2: Camera Status */}
        <View style={styles.statusCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: '#FFEDD5' }]}>
              <Ionicons name="videocam-outline" size={22} color="#EA580C" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.statusCardTitle}>Camera Status</Text>
              <Text style={[styles.statusBadgeText, { color: '#EA580C' }]}>Offline</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Nanny camera is offline. Connect to start monitoring.
          </Text>
          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={() => onNavigate("nanny_camera")}
          >
            <Text style={styles.cardActionBtnText}>Open Camera</Text>
          </TouchableOpacity>
        </View>

        {/* Card 3: Legal Guidance */}
        <View style={styles.statusCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: '#E6F4F1' }]}>
              <Ionicons name="scale-outline" size={22} color={ProtectivaTheme.primaryDark} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.statusCardTitle}>Legal Guidance</Text>
              <Text style={[styles.statusBadgeText, { color: '#16A34A' }]}>Available</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Get confidential legal guidance and support when needed.
          </Text>
          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={() => onNavigate("legal_guidance")}
          >
            <Text style={styles.cardActionBtnText}>Get Guidance</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Middle Section: Recent Alerts & Quick Actions */}
      <View style={styles.middleGrid}>
        {/* Recent Alerts Card */}
        <View style={[styles.dashboardCard, { flex: 1.2 }]}>
          <View style={styles.cardTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="notifications-outline" size={20} color={ProtectivaTheme.textPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Recent Alerts</Text>
            </View>
            <TouchableOpacity onPress={() => onNavigate("alerts_history")}>
              <Text style={styles.viewAllLink}>View all</Text>
            </TouchableOpacity>
          </View>

          {alerts.length === 0 ? (
            <View style={styles.emptyAlertsBox}>
              <View style={styles.shieldBadgeLarge}>
                <Ionicons name="shield-checkmark-outline" size={32} color={ProtectivaTheme.primary} />
              </View>
              <Text style={styles.noAlertsTitle}>No recent alerts</Text>
              <Text style={styles.noAlertsSub}>
                You'll see new alerts and important safety updates here.
              </Text>
            </View>
          ) : (
            alerts.slice(0, 3).map((alert, idx) => (
              <View key={alert.id || idx} style={styles.recentAlertRow}>
                <Ionicons
                  name="warning-outline"
                  size={20}
                  color={alert.threat_level === "High" ? "#DC2626" : "#F59E0B"}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertRowTitle}>
                    {isDiscreetMode ? "••••• Threat Alert Detected" : (alert.threat_level ? `${alert.threat_level} Priority Alert` : "Acoustic Event")}
                  </Text>
                  <Text style={styles.alertRowTime}>
                    {new Date(alert.created_at || alert.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Quick Actions Card */}
        <View style={[styles.dashboardCard, { flex: 1 }]}>
          <View style={styles.cardTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="flash-outline" size={20} color={ProtectivaTheme.textPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
          </View>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionTile}
              onPress={() => onNavigate("voice_monitoring")}
            >
              <Ionicons name="shield-checkmark-outline" size={22} color={ProtectivaTheme.primaryDark} />
              <Text style={styles.quickActionLabel}>Start Monitoring</Text>
              <Text style={styles.quickActionSub}>Begin voice protection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionTile}
              onPress={() => onNavigate("nanny_camera")}
            >
              <Ionicons name="videocam-outline" size={22} color={ProtectivaTheme.primaryDark} />
              <Text style={styles.quickActionLabel}>Open Camera</Text>
              <Text style={styles.quickActionSub}>View live camera feed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionTile, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}
              onPress={onTriggerEmergency}
            >
              <Ionicons name="call-outline" size={22} color="#DC2626" />
              <Text style={[styles.quickActionLabel, { color: '#DC2626' }]}>Emergency Support</Text>
              <Text style={[styles.quickActionSub, { color: '#EF4444' }]}>Get help immediately</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionTile}
              onPress={() => onNavigate("legal_guidance")}
            >
              <Ionicons name="scale-outline" size={22} color={ProtectivaTheme.primaryDark} />
              <Text style={styles.quickActionLabel}>Legal Guidance</Text>
              <Text style={styles.quickActionSub}>Get legal help</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Emergency Contacts Section */}
      <View style={styles.dashboardCard}>
        <View style={styles.cardTitleRow}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="call-outline" size={20} color={ProtectivaTheme.textPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Reach out to trusted contacts or services in an emergency.
            </Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate("emergency_support")}>
            <View style={styles.viewContactsBtn}>
              <Text style={styles.viewContactsText}>View All Contacts</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.contactsRow}>
          <View style={styles.contactPill}>
            <Ionicons name="headset-outline" size={20} color={ProtectivaTheme.primaryDark} style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.contactName}>Guardian Helpline</Text>
              <Text style={styles.contactDetail}>24/7 Support</Text>
            </View>
          </View>

          <View style={styles.contactPill}>
            <Ionicons name="heart-outline" size={20} color="#EA580C" style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.contactName}>Childline India</Text>
              <Text style={styles.contactDetail}>1098</Text>
            </View>
          </View>

          <View style={styles.contactPill}>
            <Ionicons name="shield-outline" size={20} color="#8B5CF6" style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.contactName}>Women Helpline</Text>
              <Text style={styles.contactDetail}>181</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Hero Banner */}
      <View style={styles.heroSafetyBanner}>
        <View style={styles.heroLeftCol}>
          <View style={styles.heroIconBadge}>
            <Ionicons name="shield-checkmark" size={32} color={ProtectivaTheme.primaryDark} />
          </View>
        </View>
        <View style={styles.heroRightCol}>
          <Text style={styles.heroTitle}>Your child's safety is our priority.</Text>
          <Text style={styles.heroDesc}>
            Protectiva helps you monitor, respond, and get support when it matters most. You're not alone. We're here for you.
          </Text>
        </View>
      </View>
    </View>
  );
}

// ==========================================
// --- TAB 2: REGISTER VOICE TAB ---
// ==========================================
function RegisterVoiceTab({
  apiBaseUrl,
  userEmail,
  userName,
  onProfilesUpdated,
}: {
  apiBaseUrl: string;
  userEmail?: string;
  userName?: string;
  onProfilesUpdated?: () => void;
}) {
  const ROLES = [
    { id: "Mother", label: "Mother 👩" },
    { id: "Father", label: "Father 👨" },
    { id: "Guardian", label: "Guardian 🛡️" },
    { id: "Nanny", label: "Nanny / Babysitter 🍼" },
    { id: "Grandparent", label: "Grandparent 👵" },
    { id: "Caregiver", label: "Caregiver 🧑‍🏫" },
  ];

  const [parentName, setParentName] = useState(userName && userName !== "Guardian" ? userName : "");
  const [selectedRole, setSelectedRole] = useState("Mother");
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<any>(null);

  const cleanEmail = (userEmail || "").trim().toLowerCase();
  const STORAGE_KEY = cleanEmail ? `childsafety_voice_profiles_${cleanEmail}` : "childsafety_voice_profiles_anon";

  useEffect(() => {
    fetchProfiles();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundRef.current) soundRef.current.unloadAsync();
      if (recordingRef.current) recordingRef.current.stopAndUnloadAsync();
    };
  }, [apiBaseUrl, userEmail]);

  const fetchProfiles = async () => {
    try {
      const url = cleanEmail
        ? `${apiBaseUrl}/api/audio/profiles?user_email=${encodeURIComponent(cleanEmail)}`
        : `${apiBaseUrl}/api/audio/profiles`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        let list = data.profiles || [];
        
        // Strict client-side filter by user_email when available
        if (cleanEmail) {
          // Check locally stored IDs for fallback in case backend Supabase column wasn't populated yet
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
    }
  };

  const startRecording = async () => {
    try {
      setMessage("");
      setRecordedUri(null);
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Permission Required", "Microphone permission is required to record voice.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      Alert.alert("Recording Error", err.message || "Failed to access microphone.");
    }
  };

  const stopRecording = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (!recordingRef.current) return;

      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        setRecordedUri(uri);
        setMessage(`🎙️ Recorded ${recordingSeconds}s voice sample ready to register.`);
      }
    } catch {
      Alert.alert("Error", "Failed to finalize audio recording.");
    }
  };

  const playPreview = async () => {
    if (!recordedUri) return;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(true);
      const { sound } = await Audio.Sound.createAsync(
        { uri: recordedUri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch {
      setIsPlaying(false);
    }
  };

  const handleRegister = async () => {
    if (!parentName.trim()) {
      Alert.alert("Required", "Please enter guardian / caregiver name.");
      return;
    }
    if (!recordedUri) {
      Alert.alert("Required", "Please record a voice sample first (3-5 seconds).");
      return;
    }

    try {
      setIsUploading(true);
      setMessage("Extracting 20-dim MFCC embeddings & saving to Supabase...");

      const formData = new FormData();
      formData.append("parent_name", parentName.trim());
      formData.append("role", selectedRole);
      if (cleanEmail) {
        formData.append("user_email", cleanEmail);
      }

      if (Platform.OS === "web") {
        const res = await fetch(recordedUri);
        const blob = await res.blob();
        const fileObj = new File([blob], "parent_voice.wav", { type: "audio/wav" });
        formData.append("file", fileObj);
      } else {
        formData.append("file", {
          uri: Platform.OS === "android" ? recordedUri : recordedUri.replace("file://", ""),
          name: "parent_voice.wav",
          type: "audio/wav",
        } as any);
      }

      let response = await fetch(`${apiBaseUrl}/api/audio/register-parent`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        response = await fetch(`${apiBaseUrl}/api/audio/register-voice`, {
          method: "POST",
          body: formData,
        });
      }

      const data = await response.json();
      if (response.ok && data.success !== false) {
        setMessage(`✅ Voice profile registered successfully for "${parentName}" (${selectedRole})!`);
        setRecordedUri(null);

        // Save locally for user isolation
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEY);
          const localIds = raw ? JSON.parse(raw) : [];
          if (data.id && !localIds.includes(String(data.id))) {
            localIds.push(String(data.id));
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localIds));
          }
        } catch {
          /* ignore */
        }

        fetchProfiles();
        onProfilesUpdated?.();
      } else {
        setMessage(`❌ Error: ${data.detail || data.error || "Registration failed"}`);
      }
    } catch (err: any) {
      setMessage(`❌ Failed to connect to server: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeactivate = async (profileId: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/audio/profiles/${profileId}`, { method: "DELETE" });
      if (res.ok) {
        Alert.alert("Deactivated", "Voice profile has been deactivated.");
        fetchProfiles();
        onProfilesUpdated?.();
      }
    } catch {
      Alert.alert("Error", "Could not deactivate profile.");
    }
  };

  const handleDeleteProfile = (profile: any) => {
    const name = profile.person_name || "this voice profile";
    const confirmMessage = `Are you sure you want to delete this voice profile for "${name}"? This action cannot be undone.`;

    if (Platform.OS === "web") {
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        executeDelete(profile.id, name);
      }
    } else {
      Alert.alert(
        "Delete Voice Profile",
        confirmMessage,
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

        setMessage(`✅ Voice profile for "${name}" was deleted successfully.`);
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
    <View style={styles.tabCard}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <Text style={styles.tabCardTitle}>Voice Registration & Guardian Profiles</Text>
        {cleanEmail ? (
          <View style={{ backgroundColor: "#E6F4F1", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: ProtectivaTheme.primary }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: ProtectivaTheme.primaryDark }}>
              👤 Account: {cleanEmail}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.tabCardSub}>
        Register parent/caregiver voice embeddings with specific roles. The AI extracts a 20-dimensional MFCC fingerprint so DTW recognizes authorized voices and tracks caregiver presence.
      </Text>

      <View style={{ marginTop: 18 }}>
        <Text style={styles.inputLabel}>Guardian / Caregiver Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Vidushi, Vidusha, Nanny Sarah"
          placeholderTextColor="#9CA3AF"
          value={parentName}
          onChangeText={setParentName}
        />

        {/* Role Selector Pills */}
        <Text style={[styles.inputLabel, { marginTop: 14 }]}>Select Caregiver Role</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {ROLES.map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                onPress={() => setSelectedRole(r.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: isSelected ? ProtectivaTheme.primaryDark : "#CBD5E1",
                  backgroundColor: isSelected ? "#E6F4F1" : "#FFFFFF",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? "700" : "500",
                    color: isSelected ? ProtectivaTheme.primaryDark : "#475569",
                  }}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Live Mic Recording Studio */}
        <View style={{ backgroundColor: "#F8FAFC", borderRadius: 14, padding: 16, marginTop: 4, borderWidth: 1, borderColor: "#E2E8F0" }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#334155", marginBottom: 6 }}>
            🎙️ Voice Sample Recording
          </Text>
          <Text style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>
            Press record and speak normally for 3 to 5 seconds:{"\n"}
            <Text style={{ fontStyle: "italic", color: "#0F172A", fontWeight: "600" }}>
              "Hi, I am {parentName || "Parent"} ({selectedRole}), this is my authorized voice profile."
            </Text>
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {!isRecording ? (
              <TouchableOpacity
                style={{
                  backgroundColor: "#DC2626",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 18,
                  borderRadius: 10,
                  gap: 8,
                }}
                onPress={startRecording}
                disabled={isUploading}
              >
                <Ionicons name="mic" size={20} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
                  {recordedUri ? "Record Again" : "Start Recording"}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{
                  backgroundColor: "#B91C1C",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 18,
                  borderRadius: 10,
                  gap: 8,
                }}
                onPress={stopRecording}
              >
                <View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: "#FFFFFF" }} />
                <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 14 }}>
                  Stop Recording ({recordingSeconds}s)
                </Text>
              </TouchableOpacity>
            )}

            {recordedUri && !isRecording && (
              <TouchableOpacity
                style={{
                  backgroundColor: "#0284C7",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  gap: 6,
                }}
                onPress={playPreview}
                disabled={isPlaying}
              >
                <Ionicons name={isPlaying ? "volume-high" : "play"} size={18} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
                  {isPlaying ? "Playing..." : "Listen Preview"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {message ? (
          <Text style={[styles.statusMsgText, { marginTop: 12, fontWeight: "600" }]}>{message}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryActionBtn, (isUploading || isRecording || !recordedUri) && { opacity: 0.5 }]}
          onPress={handleRegister}
          disabled={isUploading || isRecording || !recordedUri}
        >
          <Text style={styles.primaryActionBtnText}>
            {isUploading ? "Registering DTW Profile..." : `Save & Register Profile as ${selectedRole}`}
          </Text>
        </TouchableOpacity>

        {/* Existing Registered Voice Profiles */}
        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E293B" }}>
              Authorized Caregiver Voice Profiles ({profiles.filter((p) => p.is_active).length} Active)
            </Text>
            <TouchableOpacity onPress={fetchProfiles} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="refresh-outline" size={16} color={ProtectivaTheme.primaryDark} />
              <Text style={{ fontSize: 12, color: ProtectivaTheme.primaryDark, fontWeight: "600" }}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {profiles.length === 0 ? (
            <View style={{ backgroundColor: "#F8FAFC", padding: 18, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" }}>
              <Ionicons name="mic-outline" size={32} color="#94A3B8" style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 13, color: "#64748B", fontWeight: "600", textAlign: "center" }}>
                No voice profiles registered for {cleanEmail || "this account"} yet.
              </Text>
              <Text style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", marginTop: 2 }}>
                Record a 3-5 second sample above to add your first authorized voice.
              </Text>
            </View>
          ) : (
            profiles.map((p) => (
              <View
                key={p.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: p.is_active ? "#FFFFFF" : "#F1F5F9",
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: p.is_active ? "#E2E8F0" : "#CBD5E1",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 3,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: p.is_active ? "#E6F4F1" : "#E2E8F0",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
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
                      <View style={{ backgroundColor: "#E6F4F1", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                        <Text style={{ color: ProtectivaTheme.primaryDark, fontSize: 11, fontWeight: "700" }}>{p.role || "Parent"}</Text>
                      </View>
                      {!p.is_active && (
                        <View style={{ backgroundColor: "#FEE2E2", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ color: "#DC2626", fontSize: 10, fontWeight: "700" }}>Deactivated</Text>
                        </View>
                      )}
                    </View>
                    {p.last_verified ? (
                      <Text style={{ color: "#64748B", fontSize: 11, marginTop: 3 }}>
                        Last verified nearby: {new Date(p.last_verified).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    ) : (
                      <Text style={{ color: "#94A3B8", fontSize: 11, marginTop: 3 }}>
                        Registered voice profile
                      </Text>
                    )}
                  </View>
                </View>

                {/* Actions: Deactivate & Delete */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {p.is_active && (
                    <TouchableOpacity
                      onPress={() => handleDeactivate(p.id)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: "#F1F5F9",
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                      }}
                    >
                      <Text style={{ color: "#64748B", fontSize: 12, fontWeight: "600" }}>Deactivate</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => handleDeleteProfile(p)}
                    disabled={isDeletingId === p.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: "#FEF2F2",
                      borderWidth: 1,
                      borderColor: "#FECACA",
                    }}
                  >
                    {isDeletingId === p.id ? (
                      <ActivityIndicator size="small" color="#DC2626" />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={15} color="#DC2626" />
                        <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "700" }}>Delete</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
}

// ==========================================
// --- TAB 3: NANNY CAM TAB ---
// ==========================================
function NannyCamTab({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [cameraStatus, setCameraStatus] = useState<string>("Stopped");
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [frameTick, setFrameTick] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (cameraStatus === "Running") {
      interval = setInterval(() => {
        setFrameTick(Date.now());
      }, 150);
    }
    return () => clearInterval(interval);
  }, [cameraStatus]);

  useEffect(() => {
    fetchAlerts();
    const subscription = supabase
      .channel("nanny_cam_alerts")
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
        Alert.alert("Error", "Failed to start Nanny Cam. Check if webcam or ESP32-CAM is connected.");
      }
    } catch (e) {
      Alert.alert("Error", "Network error starting Nanny Cam. Server at " + apiBaseUrl + " could not be reached.");
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
        Alert.alert("Error", "Failed to stop Nanny Cam.");
      }
    } catch (e) {
      Alert.alert("Error", "Network error stopping Nanny Cam.");
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
          user_id: "test-user-id",
          source: "nanny_cam",
          type: "hazard",
          probability: 0.95,
          timestamp: new Date().toISOString(),
          details: { triggered_by: ["Test Hazard Alert"] }
        }),
      });
      if (res.ok) {
        Alert.alert("Success", "Test hazard alert sent!");
        fetchAlerts();
      } else {
        Alert.alert("Error", "Failed to trigger test alert.");
      }
    } catch (e) {
      Alert.alert("Error", "Network error sending test alert.");
    }
  };

  return (
    <View style={styles.tabCard}>
      <View style={styles.cardTitleRow}>
        <View>
          <Text style={styles.tabCardTitle}>Nanny Camera Stream & Controls</Text>
          <Text style={styles.tabCardSub}>
            Monitor your home or child's nursery via live webcam or ESP32-CAM stream.
          </Text>
        </View>
        <View style={styles.camStatusBadgeContainer}>
          <View style={[styles.statusDot, { backgroundColor: cameraStatus === "Running" ? "#16A34A" : "#DC2626" }]} />
          <Text style={[styles.camStatusText, { color: cameraStatus === "Running" ? "#16A34A" : "#DC2626" }]}>
            {cameraStatus === "Running" ? "Stream Active" : "Camera Offline"}
          </Text>
        </View>
      </View>

      {/* Control Buttons Bar */}
      <View style={styles.camControlsRow}>
        <TouchableOpacity
          style={[styles.primaryActionBtn, styles.btnStartCam, isLoading && { opacity: 0.6 }]}
          onPress={startCamera}
          disabled={isLoading || cameraStatus === "Running"}
        >
          <Ionicons name="videocam-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.primaryActionBtnText}>
            {cameraStatus === "Running" ? "Webcam Running" : "Start Web Cam"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryActionBtn, styles.btnStopCam, isLoading && { opacity: 0.6 }]}
          onPress={stopCamera}
          disabled={isLoading || cameraStatus !== "Running"}
        >
          <Ionicons name="stop-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.primaryActionBtnText}>Stop Web Cam</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryActionBtn, styles.btnTestAlert]}
          onPress={triggerTestAlert}
        >
          <Ionicons name="warning-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.primaryActionBtnText}>Test Hazard Alert</Text>
        </TouchableOpacity>
      </View>

      {/* Video Viewport Container */}
      <View style={styles.camViewportBox}>
        {cameraStatus === "Running" && streamUrl ? (
          <Image
            source={{ uri: `${streamUrl}?t=${frameTick}` }}
            style={styles.camStreamImage}
            contentFit="contain"
            cachePolicy="none"
          />
        ) : (
          <View style={styles.camOfflinePlaceholder}>
            <View style={styles.camIconCircle}>
              <Ionicons name="videocam-off-outline" size={40} color={ProtectivaTheme.textSecondary} />
            </View>
            <Text style={styles.camOfflineText}>Camera Stream is Stopped</Text>
            <Text style={styles.camOfflineSub}>
              Click "Start Web Cam" above to connect to local webcam / ESP32-CAM at {apiBaseUrl}.
            </Text>
            <TouchableOpacity style={styles.btnStartCamBig} onPress={startCamera}>
              <Ionicons name="play-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnStartCamBigText}>Start Web Cam Stream</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Nanny Cam Alerts Log */}
      <View style={{ marginTop: 24 }}>
        <Text style={styles.sectionTitle}>Camera Hazard Alerts</Text>
        <Text style={styles.sectionSubtitle}>
          Real-time hazard detections from visual stream analysis.
        </Text>

        <View style={{ marginTop: 12 }}>
          {alerts.length === 0 ? (
            <View style={styles.emptyAlertsBox}>
              <Ionicons name="shield-checkmark-outline" size={32} color={ProtectivaTheme.primary} />
              <Text style={styles.noAlertsTitle}>No Camera Hazards Detected</Text>
              <Text style={styles.noAlertsSub}>Nanny camera feed is secure.</Text>
            </View>
          ) : (
            alerts.map((alert, idx) => (
              <View key={alert.id || idx} style={styles.recentAlertRow}>
                <Ionicons name="warning-outline" size={20} color="#DC2626" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertRowTitle}>
                    Hazard Alert ({((alert.probability || 0.9) * 100).toFixed(0)}% Confidence)
                  </Text>
                  <Text style={styles.alertRowTime}>
                    {new Date(alert.timestamp || alert.created_at).toLocaleString()}
                  </Text>
                  {alert.details?.triggered_by && (
                    <Text style={{ fontSize: 11, color: ProtectivaTheme.textSecondary, marginTop: 2 }}>
                      Triggered by: {alert.details.triggered_by.join(", ")}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
}

// ==========================================
// --- TAB 4: ALERTS HISTORY TAB ---
// ==========================================
function AlertsHistoryTab({
  alerts,
  isDiscreetMode,
  onClearAlerts,
}: {
  alerts: any[];
  isDiscreetMode: boolean;
  onClearAlerts: () => void;
}) {
  return (
    <View style={styles.tabCard}>
      <View style={styles.cardTitleRow}>
        <Text style={styles.tabCardTitle}>Alerts Log & Acoustic History</Text>
        {alerts.length > 0 && (
          <TouchableOpacity onPress={onClearAlerts}>
            <Text style={styles.clearText}>Clear Data</Text>
          </TouchableOpacity>
        )}
      </View>

      {alerts.length === 0 ? (
        <View style={styles.emptyAlertsBox}>
          <Ionicons name="shield-checkmark-outline" size={40} color={ProtectivaTheme.primary} />
          <Text style={styles.noAlertsTitle}>No Acoustic Alerts Recorded</Text>
          <Text style={styles.noAlertsSub}>All monitored audio feeds are normal.</Text>
        </View>
      ) : (
        alerts.map((alert, idx) => (
          <View key={alert.id || idx} style={styles.recentAlertRow}>
            <Ionicons
              name="warning"
              size={22}
              color={alert.threat_level === "High" ? "#DC2626" : "#F59E0B"}
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertRowTitle}>
                {isDiscreetMode
                  ? "••••• (Discreet Mode Active)"
                  : alert.mitigation_message || `Threat Detected (${alert.threat_level || "Moderate"})`}
              </Text>
              <Text style={styles.alertRowTime}>
                {new Date(alert.created_at || alert.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// ==========================================
// --- TAB 5: EMERGENCY SUPPORT VIEW ---
// ==========================================
function EmergencySupportView({ onTriggerEmergency }: { onTriggerEmergency: () => void }) {
  return (
    <View style={styles.tabCard}>
      <Text style={styles.tabCardTitle}>Emergency Support & Helplines</Text>
      <Text style={styles.tabCardSub}>
        Direct access to emergency child helplines, local authorities, and instant panic alerts.
      </Text>

      <TouchableOpacity style={styles.panicButton} onPress={onTriggerEmergency}>
        <Ionicons name="warning" size={28} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.panicButtonText}>Trigger Emergency Panic Alert</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.inputLabel}>National Helplines</Text>
        <View style={styles.emergencyContactCard}>
          <Text style={styles.contactCardTitle}>Childline India</Text>
          <Text style={styles.contactCardNumber}>1098</Text>
          <Text style={styles.contactCardSub}>Free, 24/7 emergency phone service for children in need of care and protection.</Text>
        </View>

        <View style={styles.emergencyContactCard}>
          <Text style={styles.contactCardTitle}>National Emergency Number</Text>
          <Text style={styles.contactCardNumber}>112</Text>
          <Text style={styles.contactCardSub}>All-in-one emergency response service (Police, Fire, Ambulance).</Text>
        </View>
      </View>
    </View>
  );
}

// ==========================================
// --- TAB 6: RESOURCES & SETTINGS VIEWS ---
// ==========================================
function ResourcesView() {
  return (
    <View style={styles.tabCard}>
      <Text style={styles.tabCardTitle}>Safety Resources & Guides</Text>
      <Text style={styles.tabCardSub}>
        Helpful guides on child safety, digital privacy, legal rights, and home protection.
      </Text>
    </View>
  );
}

function SettingsView({ apiBaseUrl, saveIp }: { apiBaseUrl: string; saveIp: () => void }) {
  return (
    <View style={styles.tabCard}>
      <Text style={styles.tabCardTitle}>Settings & Configuration</Text>
      <Text style={styles.tabCardSub}>Configure backend connectivity and alert threshold options.</Text>
    </View>
  );
}

// ==========================================
// --- STYLESHEET ---
// ==========================================
const styles = StyleSheet.create({
  appWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bodyLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContentPane: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  networkConfigBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  networkLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ProtectivaTheme.textSecondary,
    marginRight: 6,
  },
  ipValue: {
    fontSize: 12,
    fontWeight: '700',
    color: ProtectivaTheme.primaryDark,
  },
  ipEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ipInput: {
    borderWidth: 1,
    borderColor: ProtectivaTheme.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    backgroundColor: '#F0FDF4',
    minWidth: 180,
  },
  btnSaveIp: {
    backgroundColor: ProtectivaTheme.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
  },
  btnSaveIpText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Overview Layout
  overviewContainer: {
    gap: 20,
  },
  welcomeBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ProtectivaTheme.textPrimary,
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 13,
    color: ProtectivaTheme.textSecondary,
  },
  systemOnlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  systemOnlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  systemOnlineSub: {
    fontSize: 10,
    color: '#166534',
  },

  // Status Cards Grid
  statusCardsRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  statusCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ProtectivaTheme.textPrimary,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 12,
    color: ProtectivaTheme.textSecondary,
    lineHeight: 16,
    marginBottom: 14,
  },
  cardActionBtn: {
    backgroundColor: ProtectivaTheme.primaryDark,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cardActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Middle Section
  middleGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ProtectivaTheme.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: ProtectivaTheme.textSecondary,
    marginTop: 2,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '600',
    color: ProtectivaTheme.primaryDark,
  },
  emptyAlertsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  shieldBadgeLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  noAlertsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ProtectivaTheme.textPrimary,
    marginBottom: 4,
  },
  noAlertsSub: {
    fontSize: 12,
    color: ProtectivaTheme.textSecondary,
    textAlign: 'center',
  },
  recentAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  alertRowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: ProtectivaTheme.textPrimary,
  },
  alertRowTime: {
    fontSize: 11,
    color: ProtectivaTheme.textSecondary,
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickActionTile: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ProtectivaTheme.textPrimary,
    marginTop: 6,
  },
  quickActionSub: {
    fontSize: 10,
    color: ProtectivaTheme.textSecondary,
    marginTop: 2,
  },

  // Emergency Contacts
  viewContactsBtn: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  viewContactsText: {
    fontSize: 12,
    fontWeight: '600',
    color: ProtectivaTheme.primaryDark,
  },
  contactsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  contactPill: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactName: {
    fontSize: 12,
    fontWeight: '700',
    color: ProtectivaTheme.textPrimary,
  },
  contactDetail: {
    fontSize: 11,
    color: ProtectivaTheme.textSecondary,
  },

  // Hero Banner
  heroSafetyBanner: {
    backgroundColor: '#E6F4F1',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#CCEADF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLeftCol: {
    marginRight: 16,
  },
  heroIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRightCol: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ProtectivaTheme.primaryDark,
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 12,
    color: ProtectivaTheme.textSecondary,
    lineHeight: 17,
  },

  // Tab Cards
  tabCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ProtectivaTheme.textPrimary,
    marginBottom: 4,
  },
  tabCardSub: {
    fontSize: 13,
    color: ProtectivaTheme.textSecondary,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ProtectivaTheme.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
  },
  filePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: ProtectivaTheme.primary,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F0FDF4',
    marginBottom: 12,
  },
  filePickerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: ProtectivaTheme.primaryDark,
  },
  statusMsgText: {
    fontSize: 13,
    fontWeight: '500',
    color: ProtectivaTheme.textPrimary,
    marginBottom: 12,
  },
  primaryActionBtn: {
    backgroundColor: ProtectivaTheme.primaryDark,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cameraPlaceholderBox: {
    height: 240,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 10,
  },
  camOfflineText: {
    fontSize: 16,
    fontWeight: '700',
    color: ProtectivaTheme.textPrimary,
    marginTop: 10,
  },
  camOfflineSub: {
    fontSize: 12,
    color: ProtectivaTheme.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  panicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  panicButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emergencyContactCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  contactCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ProtectivaTheme.textPrimary,
  },
  contactCardNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: ProtectivaTheme.primaryDark,
    marginVertical: 4,
  },
  contactCardSub: {
    fontSize: 11,
    color: ProtectivaTheme.textSecondary,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerContent: {
    width: 240,
    height: '100%',
    backgroundColor: '#FFFFFF',
  },

  // Mobile Bottom Tab Bar
  mobileTabBar: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarLabel: {
    fontSize: 10,
    color: ProtectivaTheme.textSecondary,
    marginTop: 2,
  },
  tabBarLabelActive: {
    color: ProtectivaTheme.primaryDark,
    fontWeight: '700',
  },

  // Nanny Cam Controls & Stream
  camStatusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  camStatusText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  camControlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 14,
    flexWrap: 'wrap',
  },
  btnStartCam: {
    backgroundColor: ProtectivaTheme.primaryDark,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btnStopCam: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btnTestAlert: {
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  camViewportBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 400,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  camStreamImage: {
    width: '100%',
    height: '100%',
  },
  camOfflinePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  camIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  btnStartCamBig: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ProtectivaTheme.primaryDark,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
  },
  btnStartCamBigText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
