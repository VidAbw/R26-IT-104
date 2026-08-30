import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { LegalQuery, LegalResult } from "./types";

export * from "./types";

const DEFAULT_API_URL = Platform.OS === "web" ? "http://127.0.0.1:8000" : "http://192.168.1.72:8000";
const API_URL_KEY = "child-safety-api-url";

export async function queryLegalRAG(query: LegalQuery): Promise<LegalResult> {
  let baseUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;
  try {
    const savedUrl = await AsyncStorage.getItem(API_URL_KEY);
    if (savedUrl) {
      baseUrl = savedUrl;
    }
  } catch (e) {
    console.error("Error reading API URL from AsyncStorage", e);
  }

  const response = await fetch(`${baseUrl}/api/rag/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    let errorMsg = "Failed to query legal guidance server.";
    try {
      const errorData = await response.json();
      if (errorData?.detail) {
        errorMsg = errorData.detail;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}
