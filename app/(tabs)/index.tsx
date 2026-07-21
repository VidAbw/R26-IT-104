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
  Image as RNImage,
  ToastAndroid,
} from "react-native";
import { Image } from "expo-image";
import { Audio } from "expo-av";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import LegalGuidanceScreen from "./legal-guidance";

// Default Fallback IP
const DEFAULT_API_URL = Platform.OS === "web" ? "http://127.0.0.1:8000" : "http://192.168.1.72:8000";

type TabType = "status" | "register" | "nanny_cam" | "legal_guidance";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("status");
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL);
  const [isEditingIp, setIsEditingIp] = useState(false);
  const [tempIp, setTempIp] = useState(apiBaseUrl);

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
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "nanny_cam" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("nanny_cam")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "nanny_cam" && styles.activeTabText,
            ]}
          >
            Nanny Cam
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "legal_guidance" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("legal_guidance")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "legal_guidance" && styles.activeTabText,
            ]}
          >
            Legal Guidance
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {activeTab === "status" && <StatusAndAlertsTab apiBaseUrl={apiBaseUrl} />}
        {activeTab === "register" && <RegisterVoiceTab apiBaseUrl={apiBaseUrl} />}
        {activeTab === "nanny_cam" && <NannyCamTab apiBaseUrl={apiBaseUrl} />}
        {activeTab === "legal_guidance" && <LegalGuidanceScreen />}
      </View>
    </View>
  );
}

// --- TAB 1: Status & Alerts ---
function StatusAndAlertsTab({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [listenerStatus, setListenerStatus] = useState<string>("Unknown");
  const [profileCount, setProfileCount] = useState<number>(0);
  const [parentName, setParentName] = useState<string>("");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    fetchStatus();
    const statusInterval = setInterval(fetchStatus, 5000);

    // Poll the last ESP32 result every 4 seconds
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

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/audio/status`);
      if (response.ok) {
        const data = await response.json();
        setListenerStatus("Online (Ready for Audio)");
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
          const threat = data.class_id === 1;
          setPrediction(
            `Status: ${data.status}\nConfidence: ${data.probability}  |  Volume: ${data.amplitude_db} dB\nDevice: ${data.device_info ?? "ESP32"}${
              data.mitigation_message ? `\n⚠️ ${data.mitigation_message}` : ""
            }`
          );
        }
      }
    } catch { /* backend offline */ }
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
        const fileObj = new File([blob], "test_audio.wav", { type: "audio/wav" });
        formData.append("file", fileObj);
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
        <Text style={[styles.statusText, listenerStatus.startsWith("Online") ? styles.statusGreen : styles.statusRed]}>
          {listenerStatus}
        </Text>
        {parentName ? (
          <Text style={styles.noDataText}>Registered guardian: <Text style={{fontWeight:"700",color:"#1F2937"}}>{parentName}</Text> ({profileCount} profile{profileCount !== 1 ? "s" : ""})</Text>
        ) : (
          <Text style={styles.noDataText}>No voice profile registered yet. Go to Register Voice tab.</Text>
        )}
        <View style={[styles.buttonRow, {marginTop: 14}]}>
          <TouchableOpacity style={[styles.button, styles.btnStart]} onPress={startGuardian}>
            <Text style={styles.buttonText}>Start Guardian</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.btnStop]} onPress={stopGuardian}>
            <Text style={styles.buttonText}>Stop Guardian</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>ESP32 Device</Text>
        <Text style={styles.noDataText}>
          🎙️ Audio data is received directly from the ESP32 microphone device.{"\n"}
          Ensure the device is powered on and connected to the same Wi-Fi network as this server.
        </Text>
        {prediction ? (
          <View style={[styles.alertItem, { marginTop: 10 }]}>
            <Text style={styles.predictionText}>{prediction}</Text>
          </View>
        ) : (
          <Text style={[styles.noDataText, { marginTop: 6 }]}>
            Waiting for audio from ESP32...
          </Text>
        )}
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
  const [parentName, setParentName] = useState("");
  const [role, setRole] = useState("parent");
  const [deviceType, setDeviceType] = useState("Phone Microphone");
  const [isRecording, setIsRecording] = useState(false); // repurposed as 'armed'
  const [isUploading, setIsUploading] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [promptIndex, setPromptIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(10);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const [armCountdown, setArmCountdown] = useState(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/audio/profiles`);
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles || []);
      }
    } catch { /* backend offline, ignore */ }
  };

  const deleteProfile = async (id: string) => {
    try {
      await fetch(`${apiBaseUrl}/api/audio/profiles/${id}`, { method: "DELETE" });
      fetchProfiles();
    } catch {
      Alert.alert("Error", "Could not delete profile.");
    }
  };

  /** Arms the backend to capture the next ESP32 chunk as a registration profile. */
  const armEsp32Registration = async () => {
    if (!parentName.trim()) {
      Alert.alert("Required", "Please enter a name first.");
      return;
    }
    setIsUploading(true);
    setUploadStatus(null);
    try {
      const formData = new FormData();
      formData.append("person_name", parentName.trim());
      formData.append("role", role);
      const res = await fetch(`${apiBaseUrl}/api/audio/register-next-chunk`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.armed) {
        setArmed(true);
        setArmCountdown(6); // ESP32 sends a chunk every ~3.5s, so 6s is safe
        setUploadStatus("🎙️ Speak clearly near the ESP32 now...");
        // Poll status every second until captured
        const timer = setInterval(async () => {
          setArmCountdown((c) => {
            if (c <= 1) clearInterval(timer);
            return c - 1;
          });
          const statusRes = await fetch(`${apiBaseUrl}/api/audio/register-next-chunk/status`);
          const status = await statusRes.json();
          if (!status.armed) {
            // Backend captured the chunk — poll /profiles to confirm
            clearInterval(timer);
            setArmed(false);
            fetchProfiles();
            setUploadStatus(`✅ Voice profile for ${parentName} saved from ESP32!`);
          }
        }, 1000);
      } else {
        setUploadStatus(`❌ ${data.error || "Failed to arm."}`);
      }
    } catch (err: any) {
      setUploadStatus(`❌ Network error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

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
    if (!parentName.trim()) {
      Alert.alert("Required", "Please enter a name before uploading.");
      return;
    }
    setIsUploading(true);
    setUploadStatus(null);
    try {
      const formData = new FormData();
      if (Platform.OS === "web") {
        const blobResp = await fetch(audioUri);
        const blob = await blobResp.blob();
        const fileObj = new File([blob], "parent_voice.wav", { type: "audio/wav" });
        formData.append("file", fileObj);
      } else {
        formData.append("file", {
          uri: Platform.OS === "android" ? audioUri : audioUri.replace("file://", ""),
          name: "parent_voice.wav",
          type: "audio/wav",
        } as any);
      }
      formData.append("parent_name", parentName.trim());
      formData.append("role", role);

      const response = await fetch(`${apiBaseUrl}/api/audio/register-parent`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setUploadStatus(`✅ Profile saved! MFCC shape: ${data.mfcc_shape?.join("×")}`);
        setAudioUri(null);
        setPromptIndex(-1);
        fetchProfiles();
      } else {
        const errMsg = data.error || JSON.stringify(data);
        setUploadStatus(`❌ ${errMsg}`);
        Alert.alert("Upload Failed", errMsg);
      }
    } catch (err: any) {
      const msg = `Network error: ${err.message}`;
      setUploadStatus(`❌ ${msg}`);
      Alert.alert("Error", msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScrollView style={styles.tabContent}>
      {/* Registered Profiles */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Registered Profiles</Text>
        {profiles.length === 0 ? (
          <Text style={styles.noDataText}>No voice profiles registered yet.</Text>
        ) : (
          profiles.map((p) => (
            <View key={p.id} style={[styles.alertItem, {flexDirection:"row", justifyContent:"space-between", alignItems:"center"}]}>
              <View>
                <Text style={{fontWeight:"700",color:"#1F2937"}}>{p.person_name}</Text>
                <Text style={styles.alertDevice}>Role: {p.role} · {p.is_active ? "✅ Active" : "⛔ Inactive"}</Text>
                <Text style={styles.alertDevice}>{new Date(p.created_at).toLocaleDateString()}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteProfile(p.id)}>
                <Text style={{color:"#EF4444",fontWeight:"600"}}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Identity form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Register New Voice</Text>

        <Text style={styles.inputLabel}>Person Name *</Text>
        <TextInput
          style={styles.textInput}
          value={parentName}
          onChangeText={setParentName}
          placeholder="e.g. Mama, Vidusha, Nanny Sara"
        />

        <Text style={styles.inputLabel}>Role</Text>
        <View style={styles.deviceRow}>
          {["parent","guardian","caregiver"].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.deviceBtn, role === r && styles.deviceBtnActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.deviceBtnText, role === r && styles.deviceBtnTextActive]}>
                {r.charAt(0).toUpperCase()+r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>Recording Device</Text>
        <View style={[styles.deviceBtn, styles.deviceBtnActive, {alignItems:"center", paddingVertical:12}]}>
          <Text style={[styles.deviceBtnText, styles.deviceBtnTextActive]}>🎙️ ESP32 Microphone</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>ESP32 Voice Registration</Text>
        <Text style={styles.instructions}>
          Click the button below, then speak clearly near the ESP32. The next 3-second audio chunk sent by the device will be saved as your voice profile automatically.
        </Text>

        {uploadStatus && (
          <Text style={{
            marginBottom: 14,
            color: uploadStatus.startsWith("✅") ? "#10B981" : uploadStatus.startsWith("🎙️") ? "#F59E0B" : "#EF4444",
            fontWeight: "600",
            textAlign: "center",
            fontSize: 15,
          }}>
            {uploadStatus}{armed && armCountdown > 0 ? `  (${armCountdown}s)` : ""}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.button, armed ? styles.btnStop : styles.btnStart, (isUploading || armed) && styles.btnDisabled]}
          onPress={armEsp32Registration}
          disabled={isUploading || armed}
        >
          <Text style={styles.buttonText}>
            {armed ? `⏳ Listening... (${armCountdown}s)` : "🎙️ Arm ESP32 & Register Voice"}
          </Text>
        </TouchableOpacity>

        {uploadStatus?.startsWith("✅") && (
          <TouchableOpacity style={{marginTop: 14, alignItems:"center"}} onPress={() => setUploadStatus(null)}>
            <Text style={{color:"#6B7280", fontSize:13}}>Register another person</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// --- TAB 3: Nanny Cam Guardian ---
function NannyCamTab({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [cameraStatus, setCameraStatus] = useState<string>("Unknown");
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [frameTick, setFrameTick] = useState(Date.now());

  useEffect(() => {
    let interval: any;
    if (cameraStatus === "Running") {
      // Poll for a new frame every 150ms (approx 6-7 FPS)
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

    return () => { supabase.removeChannel(subscription); };
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
      const res = await fetch(`${apiBaseUrl}/api/iot/start`, { method: "POST" });
      if (res.ok) {
        setCameraStatus("Running");
        setStreamUrl(`${apiBaseUrl}/api/iot/stream`);
      } else {
        Alert.alert("Error", "Failed to start Nanny Cam");
      }
    } catch (e) {
      Alert.alert("Error", "Network error starting Nanny Cam");
    }
  };

  const stopCamera = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/iot/stop`, { method: "POST" });
      if (res.ok) {
        setCameraStatus("Stopped");
        setStreamUrl(null);
      } else {
        Alert.alert("Error", "Failed to stop Nanny Cam");
      }
    } catch (e) {
      Alert.alert("Error", "Network error stopping Nanny Cam");
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
          details: { triggered_by: ["Test Alert"] }
        }),
      });
      if (res.ok) {
        Alert.alert("Success", "Test alert triggered!");
      } else {
        Alert.alert("Error", "Failed to trigger test alert");
      }
    } catch (e) {
      Alert.alert("Error", "Network error triggering alert");
    }
  };


  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nanny Cam Camera Control</Text>
        <Text style={[styles.statusText, cameraStatus === "Running" ? styles.statusGreen : styles.statusRed]}>
          Status: {cameraStatus}
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.btnStart]} onPress={startCamera}>
            <Text style={styles.buttonText}>Start Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.btnStop]} onPress={stopCamera}>
            <Text style={styles.buttonText}>Stop Camera</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Live Stream</Text>
        {streamUrl ? (
          <View style={styles.streamContainer}>
            <Image 
              source={{ uri: `${streamUrl}?t=${frameTick}` }} 
              style={styles.streamImage} 
              contentFit="cover"
              cachePolicy="none"
            />
          </View>
        ) : (
          <View style={[styles.streamContainer, styles.streamOffline]}>
            <Text style={styles.noDataText}>Camera is offline</Text>
          </View>
        )}
      </View>


      <View style={styles.card}>
        <View style={styles.alertHeaderRow}>
          <Text style={styles.cardTitle}>Recent Alerts</Text>
          <TouchableOpacity style={styles.btnTestSmall} onPress={triggerTestAlert}>
            <Text style={styles.buttonTextSmall}>Trigger Test Alert</Text>
          </TouchableOpacity>
        </View>
        
        {alerts.length === 0 ? (
          <Text style={styles.noDataText}>No recent alerts found.</Text>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id || alert.timestamp} style={styles.alertItem}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertTime}>
                  {new Date(alert.timestamp).toLocaleString()}
                </Text>
                <Text style={[styles.alertLevel, styles.levelHigh]}>
                  {(alert.probability * 100).toFixed(0)}% Probability
                </Text>
              </View>
              <Text style={styles.alertDevice}>Type: {alert.type}</Text>
              {alert.details?.triggered_by && (
                <Text style={styles.alertDevice}>Details: {alert.details.triggered_by.join(", ")}</Text>
              )}
            </View>
          ))
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
  streamContainer: { width: "100%", aspectRatio: 4/3, backgroundColor: "#000", borderRadius: 8, overflow: "hidden", justifyContent: "center", alignItems: "center", marginTop: 10 },
  streamImage: { width: "100%", height: "100%" },
  streamOffline: { backgroundColor: "#D1D5DB" },
  btnTestSmall: { backgroundColor: "#3B82F6", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
});
