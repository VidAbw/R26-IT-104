import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  Image as RNImage,
  ToastAndroid,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_API_URL = Platform.OS === "web" ? "http://127.0.0.1:8000" : "http://192.168.1.72:8000";

export const KnownFacesSection = () => {
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL);
  const [uploadName, setUploadName] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingFace, setIsUploadingFace] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [knownFacesList, setKnownFacesList] = useState<string[]>([]);

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
      fetchKnownFacesList();
    }
  }, [apiBaseUrl]);

  const fetchKnownFacesList = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/iot/known-faces`);
      if (res.ok) {
        const data = await res.json();
        setKnownFacesList(data.faces || []);
      }
    } catch (e) {
      console.log("Error fetching known faces");
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadKnownFace = async () => {
    if (!uploadName.trim()) {
      Alert.alert("Required", "Please enter a name for this person.");
      return;
    }
    if (!selectedImage) {
      Alert.alert("Required", "Please select a photo.");
      return;
    }
    setIsUploadingFace(true);
    try {
      const formData = new FormData();
      formData.append("name", uploadName.trim());
      
      if (Platform.OS === "web") {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        const fileObj = new File([blob], "face.jpg", { type: "image/jpeg" });
        formData.append("file", fileObj);
      } else {
        formData.append("file", {
          uri: Platform.OS === "android" ? selectedImage : selectedImage.replace("file://", ""),
          name: "face.jpg",
          type: "image/jpeg",
        } as any);
      }

      const response = await fetch(`${apiBaseUrl}/api/iot/upload-face`, {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      if (response.ok) {
        const msg = `✅ ${data.message || "Face photo uploaded successfully!"}`;
        setToastMessage(msg);
        if (Platform.OS === "android") {
          ToastAndroid.show(data.message || "Photo uploaded successfully!", ToastAndroid.SHORT);
        }
        setTimeout(() => setToastMessage(null), 4000);
        setUploadName("");
        setSelectedImage(null);
        fetchKnownFacesList();
      } else {
        const errMsg = `❌ ${data.detail || "Upload failed"}`;
        setToastMessage(errMsg);
        if (Platform.OS === "android") {
          ToastAndroid.show(data.detail || "Upload failed", ToastAndroid.SHORT);
        }
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      const netMsg = "❌ Network error during upload";
      setToastMessage(netMsg);
      if (Platform.OS === "android") {
        ToastAndroid.show("Network error during upload", ToastAndroid.SHORT);
      }
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsUploadingFace(false);
    }
  };

  const deleteKnownFace = async (name: string) => {
    if (Platform.OS === "web") {
      if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
      try {
        const res = await fetch(`${apiBaseUrl}/api/iot/known-face/${name}`, { method: "DELETE" });
        if (res.ok) {
          fetchKnownFacesList();
          setToastMessage(`✅ Face deleted for ${name}`);
          setTimeout(() => setToastMessage(null), 4000);
        } else {
          alert("Failed to delete face");
        }
      } catch (e) {
        alert("Network error");
      }
      return;
    }

    Alert.alert(
      "Delete Face",
      `Are you sure you want to delete ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
            try {
              const res = await fetch(`${apiBaseUrl}/api/iot/known-face/${name}`, { method: "DELETE" });
              if (res.ok) {
                if (Platform.OS === "android") ToastAndroid.show("Face deleted", ToastAndroid.SHORT);
                fetchKnownFacesList();
                setToastMessage(`✅ Face deleted for ${name}`);
                setTimeout(() => setToastMessage(null), 4000);
              } else {
                Alert.alert("Error", "Failed to delete face");
              }
            } catch (e) {
              Alert.alert("Error", "Network error");
            }
          }
        }
      ]
    );
  };

  const prepareUpdateFace = (name: string) => {
    setUploadName(name);
    setSelectedImage(null);
    setToastMessage(`ℹ️ Updating ${name}. Please scroll up and select a new photo.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Manage Known Faces</Text>
      <Text style={{fontSize: 14, color: "#6B7280", marginBottom: 12}}>
        Add photos of known adults to prevent "Unknown Person" alerts on the Nanny Cam.
      </Text>

      {toastMessage && (
        <View style={{ backgroundColor: toastMessage.startsWith("✅") ? "#D1FAE5" : toastMessage.startsWith("ℹ️") ? "#DBEAFE" : "#FEE2E2", borderColor: toastMessage.startsWith("✅") ? "#10B981" : toastMessage.startsWith("ℹ️") ? "#3B82F6" : "#EF4444", borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 14 }}>
          <Text style={{ color: toastMessage.startsWith("✅") ? "#065F46" : toastMessage.startsWith("ℹ️") ? "#1D4ED8" : "#991B1B", fontWeight: "600", textAlign: "center", fontSize: 14 }}>
            {toastMessage}
          </Text>
        </View>
      )}
      <Text style={{fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6}}>Person Name *</Text>
      <TextInput
        style={{backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16}}
        value={uploadName}
        onChangeText={setUploadName}
        placeholder="e.g. Uncle John"
      />
      
      {selectedImage && (
        <View style={{ alignItems: 'center', marginVertical: 10 }}>
          <RNImage source={{ uri: selectedImage }} style={{ width: 120, height: 120, borderRadius: 60 }} />
        </View>
      )}
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#4B5563' }]} onPress={pickImage}>
          <Text style={styles.buttonText}>{selectedImage ? "Change Photo" : "Select Photo"}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.btnStart, isUploadingFace && { opacity: 0.6 }]} 
          onPress={uploadKnownFace}
          disabled={isUploadingFace}
        >
          <Text style={styles.buttonText}>{isUploadingFace ? "Uploading..." : "Upload Face"}</Text>
        </TouchableOpacity>
      </View>

      {knownFacesList.length > 0 && (
        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 16 }}>
          <Text style={{fontSize: 16, fontWeight: "700", color: "#374151", marginBottom: 12}}>Uploaded Faces</Text>
          {knownFacesList.map(name => (
            <View key={name} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#F9FAFB", padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: "#F3F4F6" }}>
              <Text style={{ fontWeight: "600", color: "#1F2937", fontSize: 15 }}>{name}</Text>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <TouchableOpacity onPress={() => prepareUpdateFace(name)}>
                  <Text style={{ color: "#3B82F6", fontWeight: "600" }}>Update</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteKnownFace(name)}>
                  <Text style={{ color: "#EF4444", fontWeight: "600" }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e7e7e7",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnStart: {
    backgroundColor: "#10B981",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  }
});
