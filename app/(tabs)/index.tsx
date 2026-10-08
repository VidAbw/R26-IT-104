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
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { VoiceEnrollmentModal } from "../../components/VoiceEnrollmentModal";
import { ChildMonitoringTab } from "../../components/ChildMonitoringTab";
import { supabase } from "../../lib/supabase";
import LegalGuidanceScreen from "./legal-guidance";
import { ProtectivaTheme } from "../../constants/theme";
import { DiscreetModeProvider, useDiscreetMode } from "../../contexts/DiscreetModeContext";
import { ProtectivaHeader } from "../../components/ProtectivaHeader";
import { ProtectivaSidebar, ProtectivaNavTab } from "../../components/ProtectivaSidebar";
import { SafeQuestTab } from "../../components/SafeQuestTab";
import { EmergencyAlertModal } from "../../components/EmergencyAlertModal";
import { useAuth } from "../../contexts/AuthProvider";
import DistrictLocationSummary from "../../src/component/DistrictLocationSummary";

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
        if (data.status && !data.status.includes("No data yet")) {
          setPrediction(
            `Status: ${data.status} (${data.presence_status || "Active Monitoring"})`
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

            {(activeTab === "child_monitoring" ||
              activeTab === "voice_monitoring" ||
              activeTab === "nanny_camera") && (
              <ChildMonitoringTab apiBaseUrl={apiBaseUrl} />
            )}

            {activeTab === "safe_quest" && <SafeQuestTab />}

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

            {activeTab === "settings" && (
              <SettingsView
                apiBaseUrl={apiBaseUrl}
                tempIp={tempIp}
                setTempIp={setTempIp}
                saveIp={saveIp}
              />
            )}
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
            onPress={() => setActiveTab("child_monitoring")}
          >
            <Ionicons
              name={
                activeTab === "child_monitoring" || activeTab === "voice_monitoring" || activeTab === "nanny_camera"
                  ? "videocam"
                  : "videocam-outline"
              }
              size={22}
              color={
                activeTab === "child_monitoring" || activeTab === "voice_monitoring" || activeTab === "nanny_camera"
                  ? ProtectivaTheme.primaryDark
                  : ProtectivaTheme.textSecondary
              }
            />
            <Text
              style={[
                styles.tabBarLabel,
                (activeTab === "child_monitoring" || activeTab === "voice_monitoring" || activeTab === "nanny_camera") &&
                  styles.tabBarLabelActive,
              ]}
            >
              Monitoring
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabBarItem}
            onPress={() => setActiveTab("safe_quest")}
          >
            <Ionicons
              name={activeTab === "safe_quest" ? "game-controller" : "game-controller-outline"}
              size={22}
              color={activeTab === "safe_quest" ? "#D97706" : ProtectivaTheme.textSecondary}
            />
            <Text style={[styles.tabBarLabel, activeTab === "safe_quest" && { color: "#D97706", fontWeight: "700" }]}>
              SafeQuest
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
        <View
          style={[
            styles.systemOnlineBadge,
            {
              backgroundColor: isOnline ? '#E6F4F1' : '#FEF2F2',
              borderColor: isOnline ? '#99F6E4' : '#FECACA',
            },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#16A34A' : '#DC2626' }]} />
          <View style={{ marginLeft: 8 }}>
            <Text style={[styles.systemOnlineText, { color: isOnline ? '#0F766E' : '#991B1B' }]}>
              {isOnline ? 'System Online' : 'System Offline'}
            </Text>
            <Text style={[styles.systemOnlineSub, { color: isOnline ? '#0D9488' : '#B91C1C' }]}>
              {isOnline ? 'All systems active' : 'Connect to server'}
            </Text>
          </View>
        </View>
      </View>

      {/* Real-Time Nursery Area Safety Banner */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 18,
          marginBottom: 16,
          borderWidth: 1.5,
          borderColor: '#86EFAC',
          shadowColor: '#16A34A',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#DCFCE7',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: '#4ADE80',
              }}
            >
              <Ionicons name="shield-checkmark" size={24} color="#16A34A" />
            </View>

            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#15803D', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Child Monitoring System • Active
              </Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#065F46', marginTop: 2 }}>
                Nursery Area — Monitored & Secure
              </Text>
              <Text style={{ fontSize: 12, color: '#16A34A', marginTop: 2 }}>
                Visual stream surveillance active • Real-time AI hazard protection enabled
              </Text>
            </View>
          </View>

          {/* Status Badge & Action */}
          <TouchableOpacity
            onPress={() => onNavigate("child_monitoring")}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: '#DCFCE7',
              borderWidth: 1.5,
              borderColor: '#86EFAC',
              gap: 8,
            }}
          >
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#16A34A' }} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#16A34A' }}>
              Open Child Monitor →
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Status Cards Grid */}
      <View style={styles.statusCardsRow}>
        {/* Card 1: Child Monitor Feed */}
        <View style={styles.statusCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: '#E6F4F1' }]}>
              <Ionicons name="videocam-outline" size={22} color={ProtectivaTheme.primaryDark} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.statusCardTitle}>Child Monitor</Text>
              <Text style={[styles.statusBadgeText, { color: '#16A34A' }]}>
                Live Feed
              </Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Live nursery video surveillance & AI visual hazard detection.
          </Text>
          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={() => onNavigate("child_monitoring")}
          >
            <Text style={styles.cardActionBtnText}>View Stream</Text>
          </TouchableOpacity>
        </View>

        {/* Card 2: Guardian Profiles */}
        <View style={styles.statusCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="people-outline" size={22} color="#16A34A" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.statusCardTitle}>Guardian Profiles</Text>
              <Text style={[styles.statusBadgeText, { color: '#16A34A' }]}>Enrolled</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Manage authorized family faces and voiceprints in Parent Profile.
          </Text>
          <TouchableOpacity
            style={[styles.cardActionBtn, { backgroundColor: ProtectivaTheme.primaryDark }]}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.cardActionBtnText}>Manage Profile</Text>
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

        {/* Card 4: SafeQuest Adventure */}
        <View style={styles.statusCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="game-controller-outline" size={22} color="#D97706" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.statusCardTitle}>SafeQuest Game</Text>
              <Text style={[styles.statusBadgeText, { color: '#D97706' }]}>Ages 6–9</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Interactive child-safety learning game with 20 story quest levels.
          </Text>
          <TouchableOpacity
            style={[styles.cardActionBtn, { backgroundColor: '#D97706' }]}
            onPress={() => onNavigate("safe_quest")}
          >
            <Text style={styles.cardActionBtnText}>Play Game</Text>
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
              onPress={() => onNavigate("child_monitoring")}
            >
              <Ionicons name="videocam-outline" size={22} color={ProtectivaTheme.primaryDark} />
              <Text style={styles.quickActionLabel}>Child Monitor</Text>
              <Text style={styles.quickActionSub}>View live nursery feed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionTile}
              onPress={() => onNavigate("safe_quest")}
            >
              <Ionicons name="game-controller-outline" size={22} color="#D97706" />
              <Text style={[styles.quickActionLabel, { color: '#D97706' }]}>SafeQuest Game</Text>
              <Text style={styles.quickActionSub}>Play safety adventure</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionTile}
              onPress={() => router.push("/profile")}
            >
              <Ionicons name="people-outline" size={22} color={ProtectivaTheme.primaryDark} />
              <Text style={styles.quickActionLabel}>Parent Profile</Text>
              <Text style={styles.quickActionSub}>Manage faces & voices</Text>
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
              Contact official Sri Lankan child-protection and emergency services.
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
              <Text style={styles.contactName}>NCPA Child Helpline (1929)</Text>
              <Text style={styles.contactDetail}>Child protection & abuse reporting</Text>
            </View>
          </View>

          <View style={styles.contactPill}>
            <Ionicons name="heart-outline" size={20} color="#EA580C" style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.contactName}>Sri Lanka Police Emergency (119)</Text>
              <Text style={styles.contactDetail}>Immediate emergency assistance</Text>
            </View>
          </View>

          <View style={styles.contactPill}>
            <Ionicons name="shield-outline" size={20} color="#8B5CF6" style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.contactName}>Women Helpline (1938)</Text>
              <Text style={styles.contactDetail}>Counselling & support</Text>
            </View>
          </View>
        </View>
      </View>

      {/* District Reported Locations Summary */}
      <DistrictLocationSummary />

      {/* Bottom Hero Banner */}
      <View style={styles.heroSafetyBanner}>
        <View style={styles.heroLeftCol}>
          <View style={styles.heroIconBadge}>
            <Ionicons name="shield-checkmark" size={32} color={ProtectivaTheme.primaryDark} />
          </View>
        </View>
        <View style={styles.heroRightCol}>
          <Text style={styles.heroTitle}>Your child's safety is our priority.</Text>
        </View>
      </View>
    </View>
  );
}

// (VoiceEnrollmentModal is imported from components/VoiceEnrollmentModal)

// (Child Monitoring is handled by components/ChildMonitoringTab)

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

function SettingsView({
  apiBaseUrl,
  tempIp,
  setTempIp,
  saveIp,
}: {
  apiBaseUrl: string;
  tempIp: string;
  setTempIp: (val: string) => void;
  saveIp: () => void;
}) {
  return (
    <View style={styles.tabCard}>
      <Text style={styles.tabCardTitle}>Settings & Configuration</Text>
      <Text style={styles.tabCardSub}>
        Configure server endpoint settings and guardian parameters.
      </Text>

      <View style={{ marginTop: 16 }}>
        <Text style={styles.inputLabel}>Backend Server URL / IP Address</Text>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center", marginTop: 4 }}>
          <TextInput
            style={[styles.textInput, { flex: 1 }]}
            value={tempIp}
            onChangeText={setTempIp}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="http://127.0.0.1:8000"
          />
          <TouchableOpacity
            style={[styles.primaryActionBtn, { paddingHorizontal: 16, paddingVertical: 10 }]}
            onPress={saveIp}
          >
            <Text style={styles.primaryActionBtnText}>Save IP</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 12, color: "#64748B", marginTop: 8 }}>
          Connected endpoint: <Text style={{ fontWeight: "700", color: ProtectivaTheme.primaryDark }}>{apiBaseUrl}</Text>
        </Text>
      </View>
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
