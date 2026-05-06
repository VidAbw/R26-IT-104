// Type definitions for the Legal RAG system

export interface LegalQuery {
  description: string;
  language: "en" | "si";
}

export interface LegalLaw {
  section: string;
  title: string;
  simple_explanation: string;
  reporting_guidance: string;
}

export interface LegalResult {
  detected_language: string;
  abuse_category: string;
  relevant_laws: LegalLaw[];
  decision_roadmap: string[];
}

export interface LegalAPIError {
  message: string;
  status?: number;
}
