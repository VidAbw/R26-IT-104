import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface IncidentMapProps {
  language: string;
  onLocationSelect: (latitude: number, longitude: number, placeName?: string, district?: string) => void;
  selectedLocation: { latitude: number; longitude: number; placeName?: string } | null;
}

export default function IncidentMap({ language, onLocationSelect, selectedLocation }: IncidentMapProps) {
  const isSinhala = language === "si";

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name="map-outline" size={24} color="#64748b" />
      </View>
      <Text style={styles.title}>
        {isSinhala ? "පිහිටීම තේරීම (වෙබ් අඩවිය සඳහා)" : "Location Selection (Optimized for Web)"}
      </Text>
      <Text style={styles.description}>
        {isSinhala 
          ? "සිතියම මඟින් ස්ථානය සලකුණු කිරීම වෙබ් අඩවිය හරහා සිදු කිරීමට හැකියාව ඇත."
          : "Interactive map marking is available in the web version."}
      </Text>
      {selectedLocation && (
        <View style={styles.selectedLocationContainer}>
          <Text style={styles.selectedLocationText}>
            {isSinhala ? "තෝරාගත් ස්ථානය:" : "Selected Place:"} {selectedLocation.placeName || "N/A"}
          </Text>
          <Text style={styles.coordsText}>
            Lat: {selectedLocation.latitude.toFixed(6)}, Lng: {selectedLocation.longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    marginVertical: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },
  selectedLocationContainer: {
    marginTop: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#CCFBF1",
    width: "100%",
  },
  selectedLocationText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 2,
  },
  coordsText: {
    fontSize: 12,
    color: "#0F766E",
  },
});
