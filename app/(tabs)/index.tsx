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
  Animated,
} from "react-native";
import { Audio } from "expo-av";
import { supabase } from "../../lib/supabase";

// Default Fallback IP
const DEFAULT_API_URL = Platform.OS === "web" ? "http://127.0.0.1:8000" : "http://192.168.1.72:8000";

type TabType = "status" | "register";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("status");
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL);
  const [isEditingIp, setIsEditingIp] = useState(false);
  const [tempIp, setTempIp] = useState(apiBaseUrl);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const saveIp = () => {
    setApiBaseUrl(tempIp);
    setIsEditingIp(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Guardian Dashboard</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic IP Configuration */}
      <View style={styles.networkConfig}>
        <Text style={styles.networkLabel}>Backend Server IP:</Text>
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
              <Text style={styles.buttonTextSmall}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditingIp(true)}>
            <Text style={styles.ipValue}>{apiBaseUrl} ✎</Text>
          </TouchableOpacity>
        )}
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
        {activeTab === "status" ? (
          <StatusAndAlertsTab apiBaseUrl={apiBaseUrl} />
        ) : (
          <RegisterVoiceTab apiBaseUrl={apiBaseUrl} />
        )}
      </View>
    </View>
  );
}

// --- TAB 1: Status & Alerts ---
function StatusAndAlertsTab({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [listenerStatus, setListenerStatus] = useState<string>("Unknown");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [prediction, setPrediction] = useState<string>("");
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
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

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/audio/status`);
      if (response.ok) {
        // The backend is reachable. ESP32 sends data via POST, so "Online" is accurate.
        setListenerStatus("Online (Ready for Audio)");
      } else {
        setListenerStatus("Error: Backend unreachable");
      }
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

    if (data && !error) setAlerts(data);
  };

  const clearAlerts = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/audio/clear-alerts`, { method: "POST" });
      if (response.ok) {
        Alert.alert("Success", "Test data cleared!");
        setAlerts([]); // Optimistically clear UI
      }
    } catch (e) {
      Alert.alert("Error", "Failed to clear data.");
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

  const testMicStream = async () => {
    try {
      setPrediction("Recording 3s...");
      if (recordingRef.current) {
        try { await recordingRef.current.stopAndUnloadAsync(); } catch (e) {}
      }
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);

      setTimeout(async () => {
        setIsRecording(false);
        setPrediction("Processing...");
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        if (uri) uploadChunk(uri);
      }, 3000);
    } catch (err) {
      setPrediction("Error recording");
    }
  };

  const uploadChunk = async (uri: string) => {
    try {
      const formData = new FormData();
      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append("file", blob, "test_audio.wav");
      } else {
        formData.append("file", {
          uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
          name: "test_audio.wav",
          type: "audio/wav",
        } as any);
      }
      formData.append("device_info", "Web/App Dashboard (Test)");

      const response = await fetch(`${apiBaseUrl}/api/audio/upload-chunk`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setPrediction(`Prediction: ${data.status || "Success"}\nVolume: ${data.amplitude_db || 0} dB`);
    } catch (error) {
      setPrediction("Failed to upload test stream");
    }
  };

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Listener Status</Text>
        <Text style={[styles.statusText, listenerStatus === "Connected" ? styles.statusGreen : styles.statusRed]}>
          {listenerStatus}
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.btnStart]} onPress={startGuardian}>
            <Text style={styles.buttonText}>Start Guardian</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.btnStop]} onPress={stopGuardian}>
            <Text style={styles.buttonText}>Stop Guardian</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Test Mic Stream</Text>
        <TouchableOpacity
          style={[styles.button, styles.btnTest, isRecording && styles.btnDisabled]}
          onPress={testMicStream}
          disabled={isRecording}
        >
          <Text style={styles.buttonText}>
            {isRecording ? "Recording..." : "Record 3s Test"}
          </Text>
        </TouchableOpacity>
        {prediction ? <Text style={styles.predictionText}>{prediction}</Text> : null}
      </View>

      <View style={styles.card}>
        <View style={styles.alertHeaderRow}>
          <Text style={styles.cardTitle}>Alerts Log</Text>
          <TouchableOpacity onPress={clearAlerts}>
            <Text style={styles.clearText}>Clear Data</Text>
          </TouchableOpacity>
        </View>
        
        {alerts.length === 0 ? (
          <Text style={styles.noDataText}>No acoustic alerts found.</Text>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id || alert.created_at} style={styles.alertItem}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertTime}>
                  {new Date(alert.created_at || alert.timestamp).toLocaleString()}
                </Text>
                <Text style={[styles.alertLevel, alert.threat_level === "High" ? styles.levelHigh : styles.levelModerate]}>
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

// --- TAB 2: Register Voice (Guided Prompts) ---
const PROMPT_WORDS = [
  "Hello, my name is",
  "I am setting up the Guardian system",
  "Child Safety",
  "Security Protocol",
  "Authentication verified"
];

function RegisterVoiceTab({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [parentName, setParentName] = useState("Vidusha");
  const [deviceType, setDeviceType] = useState("Phone Microphone");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [promptIndex, setPromptIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(10);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startGuidedRecording = async () => {
    if (!parentName.trim()) {
      Alert.alert("Required", "Please enter your name first.");
      return;
    }
    try {
      if (recordingRef.current) {
        try { await recordingRef.current.stopAndUnloadAsync(); } catch (e) {}
      }
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      
      setIsRecording(true);
      setAudioUri(null);
      setPromptIndex(0);
      setTimeLeft(10);

      // Start the teleprompter timer
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Move to next prompt
            setPromptIndex((currIndex) => {
              if (currIndex >= PROMPT_WORDS.length - 1) {
                // Done recording
                clearInterval(intervalRef.current!);
                finishRecording();
                return currIndex;
              }
              return currIndex + 1;
            });
            return 10; // reset 10 seconds for next word
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const finishRecording = async () => {
    try {
      setIsRecording(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      
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
      if (Platform.OS === "web") {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        const fileObj = new File([blob], "parent_voice.wav", { type: "audio/wav" });
        formData.append("file", fileObj);
      } else {
        formData.append("file", {
          uri: Platform.OS === "android" ? audioUri : audioUri.replace("file://", ""),
          name: "parent_voice.wav",
          type: "audio/wav",
        } as any);
      }
      formData.append("parent_name", parentName);

      const response = await fetch(`${apiBaseUrl}/api/audio/register-parent`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        Alert.alert("Success", `Voice profile for ${parentName} saved successfully!`);
        setAudioUri(null);
        setPromptIndex(-1);
      } else {
        const errText = await response.text();
        console.error("Upload failed with status:", response.status, errText);
        Alert.alert("Error", `Failed to save profile: ${errText}`);
      }
    } catch (error: any) {
      console.error("Upload fetch error:", error);
      Alert.alert("Error", `Upload exception: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dynamic Parent Identity</Text>
        
        <Text style={styles.inputLabel}>Parent Name</Text>
        <TextInput
          style={styles.textInput}
          value={parentName}
          onChangeText={setParentName}
          placeholder="Enter your name (e.g. Vidusha)"
        />

        <Text style={styles.inputLabel}>Audio Source Device (Tag)</Text>
        <View style={styles.deviceRow}>
          <TouchableOpacity 
            style={[styles.deviceBtn, deviceType === "Phone Microphone" && styles.deviceBtnActive]}
            onPress={() => setDeviceType("Phone Microphone")}
          >
            <Text style={[styles.deviceBtnText, deviceType === "Phone Microphone" && styles.deviceBtnTextActive]}>Phone Mic</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.deviceBtn, deviceType === "Headset" && styles.deviceBtnActive]}
            onPress={() => setDeviceType("Headset")}
          >
            <Text style={[styles.deviceBtnText, deviceType === "Headset" && styles.deviceBtnTextActive]}>Headset</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Guided Voice Registration</Text>
        <Text style={styles.instructions}>
          The AI needs a robust sample of your voice. Read the phrases on the screen as they appear.
        </Text>

        {isRecording && promptIndex >= 0 ? (
          <View style={styles.teleprompterContainer}>
            <Text style={styles.promptHelper}>Say the following phrase:</Text>
            <Text style={styles.promptWord}>
              {promptIndex === 0 && PROMPT_WORDS[0].includes("name is") 
                  ? `${PROMPT_WORDS[0]} ${parentName}` 
                  : PROMPT_WORDS[promptIndex]}
            </Text>
            <Text style={styles.timerText}>Next phrase in: {timeLeft}s</Text>
            
            <View style={styles.recordingIndicator}>
              <View style={styles.pulsingCircle} />
              <Text style={styles.recordingText}>Recording...</Text>
            </View>
            
            <TouchableOpacity style={[styles.button, styles.btnStop, {marginTop: 20}]} onPress={finishRecording}>
              <Text style={styles.buttonText}>Stop Early</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {!audioUri ? (
              <TouchableOpacity style={[styles.button, styles.btnStart]} onPress={startGuidedRecording}>
                <Text style={styles.buttonText}>Start Guided Registration</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.submitSection}>
                <Text style={styles.successText}>Voice profile successfully recorded!</Text>
                <TouchableOpacity style={[styles.button, styles.btnSubmit]} onPress={submitProfile}>
                  <Text style={styles.buttonText}>Upload & Save Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{marginTop: 15}} onPress={() => setAudioUri(null)}>
                  <Text style={{color: "#EF4444", fontWeight: "600"}}>Discard & Retake</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#FFF",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  logoutText: { color: "#EF4444", fontWeight: "600", fontSize: 16 },
  networkConfig: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  networkLabel: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  ipValue: { fontSize: 13, color: "#3B82F6", fontWeight: "600" },
  ipEditRow: { flexDirection: "row", alignItems: "center" },
  ipInput: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    minWidth: 150,
  },
  btnSaveIp: {
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  buttonTextSmall: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabButton: { flex: 1, paddingVertical: 15, alignItems: "center", borderBottomWidth: 3, borderColor: "transparent" },
  activeTab: { borderColor: "#3B82F6" },
  tabText: { fontSize: 15, fontWeight: "600", color: "#6B7280" },
  activeTabText: { color: "#3B82F6" },
  contentContainer: { flex: 1, padding: 15 },
  tabContent: { flex: 1 },
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
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937", marginBottom: 10 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#4B5563", marginBottom: 8, marginTop: 10 },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
  },
  deviceRow: { flexDirection: "row", gap: 10 },
  deviceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    alignItems: "center",
  },
  deviceBtnActive: { backgroundColor: "#EFF6FF", borderColor: "#3B82F6" },
  deviceBtnText: { color: "#4B5563", fontWeight: "500" },
  deviceBtnTextActive: { color: "#3B82F6", fontWeight: "700" },
  statusText: { fontSize: 16, fontWeight: "600", marginBottom: 15 },
  statusGreen: { color: "#10B981" },
  statusRed: { color: "#EF4444" },
  buttonRow: { flexDirection: "row", gap: 10 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  btnStart: { backgroundColor: "#10B981" },
  btnStop: { backgroundColor: "#EF4444" },
  btnTest: { backgroundColor: "#3B82F6" },
  btnSubmit: { backgroundColor: "#8B5CF6", paddingHorizontal: 30 },
  btnDisabled: { backgroundColor: "#9CA3AF" },
  buttonText: { color: "#FFF", fontWeight: "600", fontSize: 15 },
  predictionText: { marginTop: 10, fontSize: 15, fontWeight: "500", color: "#4B5563", textAlign: "center" },
  alertHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  clearText: { color: "#EF4444", fontSize: 14, fontWeight: "600" },
  noDataText: { color: "#6B7280", fontStyle: "italic", marginTop: 5 },
  alertItem: { backgroundColor: "#F9FAFB", padding: 12, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderColor: "#E5E7EB" },
  alertHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  alertTime: { fontSize: 14, color: "#4B5563" },
  alertLevel: { fontSize: 14, fontWeight: "bold" },
  levelHigh: { color: "#EF4444" },
  levelModerate: { color: "#F59E0B" },
  alertDevice: { fontSize: 13, color: "#6B7280" },
  instructions: { fontSize: 15, color: "#4B5563", lineHeight: 22, marginBottom: 20 },
  teleprompterContainer: { backgroundColor: "#1F2937", padding: 20, borderRadius: 12, alignItems: "center" },
  promptHelper: { color: "#9CA3AF", fontSize: 14, marginBottom: 10 },
  promptWord: { color: "#10B981", fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  timerText: { color: "#F59E0B", fontSize: 16, fontWeight: "600", marginBottom: 20 },
  recordingIndicator: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  pulsingCircle: { width: 15, height: 15, borderRadius: 7.5, backgroundColor: "#EF4444", marginRight: 10 },
  recordingText: { fontSize: 16, color: "#EF4444", fontWeight: "600" },
  submitSection: { marginTop: 10, alignItems: "center" },
  successText: { fontSize: 16, color: "#10B981", marginBottom: 15, fontWeight: "600" },
});
