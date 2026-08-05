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
  }, [apiBaseUrl]);

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
      const response = await fetch(`${apiBaseUrl}/api/audio/status`);
      if (response.ok) {
        const data = await response.json();
        setListenerStatus("Online");
        setProfileCount(data.registered_profiles ?? 0);
        setParentName(data.parent_name ?? "");
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
                onNavigate={(tab) => setActiveTab(tab)}
                onTriggerEmergency={triggerEmergencyAlert}
                onStartGuardian={startGuardian}
                onStopGuardian={stopGuardian}
              />
            )}

            {activeTab === "voice_monitoring" && (
              <RegisterVoiceTab apiBaseUrl={apiBaseUrl} />
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
function RegisterVoiceTab({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [parentName, setParentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const pickAudioFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        setMessage(`Selected file: ${result.assets[0].fileName || 'Audio recording'}`);
      }
    } catch (err) {
      Alert.alert("Error", "Could not pick audio file.");
    }
  };

  const handleRegister = async () => {
    if (!parentName.trim()) {
      Alert.alert("Required", "Please enter guardian/parent name.");
      return;
    }
    if (!selectedFile) {
      Alert.alert("Required", "Please record or select an audio file.");
      return;
    }

    try {
      setIsUploading(true);
      setMessage("Registering voice profile...");

      const formData = new FormData();
      formData.append("parent_name", parentName);

      if (Platform.OS === "web") {
        const res = await fetch(selectedFile.uri);
        const blob = await res.blob();
        const fileObj = new File([blob], "voice.wav", { type: blob.type || "audio/wav" });
        formData.append("file", fileObj);
      } else {
        formData.append("file", {
          uri: Platform.OS === "android" ? selectedFile.uri : selectedFile.uri.replace("file://", ""),
          name: "voice.wav",
          type: "audio/wav",
        } as any);
      }

      const response = await fetch(`${apiBaseUrl}/api/audio/register-voice`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`✅ Registered successfully for ${parentName}!`);
        setSelectedFile(null);
      } else {
        setMessage(`❌ Error: ${data.detail || "Registration failed"}`);
      }
    } catch (err) {
      setMessage("❌ Failed to connect to server.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.tabCard}>
      <Text style={styles.tabCardTitle}>Voice Registration & Guardian Profile</Text>
      <Text style={styles.tabCardSub}>
        Register parent/guardian voice embeddings so Protectiva can identify authorized voices during monitoring.
      </Text>

      <View style={{ marginTop: 16 }}>
        <Text style={styles.inputLabel}>Guardian / Parent Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. John Doe"
          value={parentName}
          onChangeText={setParentName}
        />

        <Text style={[styles.inputLabel, { marginTop: 14 }]}>Audio Sample</Text>
        <TouchableOpacity style={styles.filePickerBtn} onPress={pickAudioFile}>
          <Ionicons name="cloud-upload-outline" size={24} color={ProtectivaTheme.primaryDark} style={{ marginRight: 8 }} />
          <Text style={styles.filePickerBtnText}>
            {selectedFile ? "Change Audio File" : "Choose Audio File / Sample"}
          </Text>
        </TouchableOpacity>

        {message ? <Text style={styles.statusMsgText}>{message}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryActionBtn, isUploading && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={isUploading}
        >
          <Text style={styles.primaryActionBtnText}>
            {isUploading ? "Registering..." : "Register Voice Profile"}
          </Text>
        </TouchableOpacity>
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
