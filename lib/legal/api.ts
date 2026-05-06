import { LegalQuery, LegalResult } from "./types";

const LEGAL_API_BASE_URL = "http://127.0.0.1:8000/api/rag";

/**
 * Query the Legal RAG system for legal guidance
 * @param payload - The query payload containing description and language
 * @returns Promise with legal guidance results
 * @throws LegalAPIError if the request fails
 */
export async function queryLegalRAG(payload: LegalQuery): Promise<LegalResult> {
  console.log("[Legal RAG] Sending query:", {
    language: payload.language,
    descriptionLength: payload.description.length,
  });

  try {
    const response = await fetch(`${LEGAL_API_BASE_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("[Legal RAG] Response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error("[Legal RAG] Error response:", text);
      throw new Error(text || "Failed to fetch legal guidance");
    }

    const data = await response.json();
    console.log("[Legal RAG] Success - received results for abuse category:", data.abuse_category);
    return data;
  } catch (error) {
    console.error("[Legal RAG] Query failed:", error);
    throw error;
  }
}

/**
 * Health check for the Legal RAG API
 * @returns true if API is accessible, false otherwise
 */
export async function checkLegalAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${LEGAL_API_BASE_URL}/health`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    console.warn("[Legal RAG] API health check failed - API may be unavailable");
    return false;
  }
}
