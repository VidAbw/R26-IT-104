import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import { supabase } from "../../lib/supabase";

// API Base URL. In a physical device, 10.0.2.2 (Android Emulator) or localhost won't work to access your PC.
// You will need to change this to your actual computer IP on the network (e.g. 192.168.1.100)
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || (Platform.OS === "web" ? "http://127.0.0.1:8000" : "http://10.0.2.2:8000");

type TabType = "status" | "register";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("status");

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Guardian Dashboard</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "status" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("status")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "status" && styles.activeTabText,
            ]}
          >
            Status & Alerts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "register" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("register")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "register" && styles.activeTabText,
            ]}
          >
            Register Voice
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {activeTab === "status" ? <StatusAndAlertsTab /> : <RegisterVoiceTab />}
      </View>
    </View>
  );
}

// --- TAB 1: Status & Alerts ---
function StatusAndAlertsTab() {
  const [listenerStatus, setListenerStatus] = useState<string>("Unknown");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [prediction, setPrediction] = useState<string>("");
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Poll listener status
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Supabase alerts
  useEffect(() => {
    fetchAlerts();

    // Set up realtime listener for new alerts
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
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audio/status`);
      const data = await response.json();
      setListenerStatus(data.status || "Disconnected");
    } catch (error) {
      setListenerStatus("Disconnected");
    }
  };

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from("audio_threat_alerts")
      .select("*")
      .eq("sensor_type", "acoustic")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data && !error) {
      setAlerts(data);
    }
  };

  const startGuardian = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/audio/start`, { method: "POST" });
      fetchStatus();
    } catch (e) {
      Alert.alert("Error", "Failed to start Guardian");
    }
  };

  const stopGuardian = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/audio/stop`, { method: "POST" });
      fetchStatus();
    } catch (e) {
      Alert.alert("Error", "Failed to stop Guardian");
    }
  };

  const testMicStream = async () => {
    try {
      setPrediction("Recording 3s...");
      if (recordingRef.current) {
        try { await recordingRef.current.stopAndUnloadAsync(); } catch (e) {}
      }
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);

      setTimeout(async () => {
        setIsRecording(false);
        setPrediction("Processing...");
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        if (uri) {
          uploadChunk(uri);
        }
      }, 3000);
    } catch (err) {
      console.error("Failed to start recording", err);
      setPrediction("Error recording");
    }
  };

  const uploadChunk = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
        name: "test_audio.wav",
        type: "audio/wav",
      } as any);
      formData.append("device_info", "Parent's iPhone");

      const response = await fetch(`${API_BASE_URL}/api/audio/upload-chunk`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setPrediction(`Prediction: ${data.status || "Success"}`);
    } catch (error) {
      setPrediction("Failed to upload test stream");
    }
  };

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Listener Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Listener Status</Text>
        <Text
          style={[
            styles.statusText,
            listenerStatus === "Connected"
              ? styles.statusGreen
              : styles.statusRed,
          ]}
        >
          {listenerStatus}
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.btnStart]}
            onPress={startGuardian}
          >
            <Text style={styles.buttonText}>Start Guardian</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.btnStop]}
            onPress={stopGuardian}
          >
            <Text style={styles.buttonText}>Stop Guardian</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Test Mic Stream Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Test Mic Stream</Text>
        <TouchableOpacity
          style={[
            styles.button,
            styles.btnTest,
            isRecording && styles.btnDisabled,
          ]}
          onPress={testMicStream}
          disabled={isRecording}
        >
          <Text style={styles.buttonText}>
            {isRecording ? "Recording..." : "Record 3s Test"}
          </Text>
        </TouchableOpacity>
        {prediction ? (
          <Text style={styles.predictionText}>{prediction}</Text>
        ) : null}
      </View>

      {/* Alerts Log */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Alerts Log</Text>
        {alerts.length === 0 ? (
          <Text style={styles.noDataText}>No acoustic alerts found.</Text>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id || alert.created_at} style={styles.alertItem}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertTime}>
                  {new Date(alert.created_at || alert.timestamp).toLocaleString()}
                </Text>
                <Text
                  style={[
                    styles.alertLevel,
                    alert.threat_level === "High"
                      ? styles.levelHigh
                      : styles.levelModerate,
                  ]}
                >
                  {alert.threat_level}
                </Text>
              </View>
              <Text style={styles.alertDevice}>{alert.device_info}</Text>
            </View>
          ))
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// --- TAB 2: Register Voice ---
function RegisterVoiceTab() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = async () => {
    try {
      if (recordingRef.current) {
        try { await recordingRef.current.stopAndUnloadAsync(); } catch (e) {}
      }
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setAudioUri(null);
    } catch (err) {
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      const recording = recordingRef.current;
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setAudioUri(uri);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to stop recording");
    }
  };

  const submitProfile = async () => {
    if (!audioUri) return;
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: Platform.OS === "android" ? audioUri : audioUri.replace("file://", ""),
        name: "parent_voice.wav",
        type: "audio/wav",
      } as any);

      const response = await fetch(
        `${API_BASE_URL}/api/audio/register-parent`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        Alert.alert("Success", "Voice profile saved successfully!");
        setAudioUri(null);
      } else {
        Alert.alert("Error", "Failed to save profile on the server.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while uploading.");
    }
  };

  return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Register Parent Voice</Text>
        <Text style={styles.instructions}>
          Record 5-10 seconds of your normal speaking voice so the Guardian can
          recognize you and avoid false alarms.
        </Text>

        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.pulsingCircle} />
            <Text style={styles.recordingText}>Recording...</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          {!isRecording ? (
            <TouchableOpacity
              style={[styles.button, styles.btnStart]}
              onPress={startRecording}
            >
              <Text style={styles.buttonText}>Start Recording</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.btnStop]}
              onPress={stopRecording}
            >
              <Text style={styles.buttonText}>Stop Recording</Text>
            </TouchableOpacity>
          )}
        </View>

        {audioUri && !isRecording && (
          <View style={styles.submitSection}>
            <Text style={styles.successText}>Recording captured!</Text>
            <TouchableOpacity
              style={[styles.button, styles.btnSubmit]}
              onPress={submitProfile}
            >
              <Text style={styles.buttonText}>Submit Voice Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50, // adjust for safe area / status bar
    paddingBottom: 15,
    backgroundColor: "#FFF",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  logoutText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 3,
    borderColor: "transparent",
  },
  activeTab: {
    borderColor: "#3B82F6",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#3B82F6",
  },
  contentContainer: {
    flex: 1,
    padding: 15,
  },
  tabContent: {
    flex: 1,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
  },
  statusGreen: {
    color: "#10B981",
  },
  statusRed: {
    color: "#EF4444",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  btnStart: {
    backgroundColor: "#10B981",
  },
  btnStop: {
    backgroundColor: "#EF4444",
  },
  btnTest: {
    backgroundColor: "#3B82F6",
  },
  btnSubmit: {
    backgroundColor: "#8B5CF6",
  },
  btnDisabled: {
    backgroundColor: "#9CA3AF",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 15,
  },
  predictionText: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "500",
    color: "#4B5563",
    textAlign: "center",
  },
  noDataText: {
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 5,
  },
  alertItem: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderColor: "#E5E7EB",
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  alertTime: {
    fontSize: 14,
    color: "#4B5563",
  },
  alertLevel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  levelHigh: {
    color: "#EF4444",
  },
  levelModerate: {
    color: "#F59E0B",
  },
  alertDevice: {
    fontSize: 13,
    color: "#6B7280",
  },
  instructions: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
    marginBottom: 20,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  pulsingCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "#EF4444",
    marginRight: 10,
  },
  recordingText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
  },
  submitSection: {
    marginTop: 20,
    alignItems: "center",
  },
  successText: {
    fontSize: 16,
    color: "#10B981",
    marginBottom: 10,
    fontWeight: "600",
  },
});
