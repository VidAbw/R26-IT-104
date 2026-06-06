// Type definitions for the Legal RAG system

export interface LegalQuery {
  description: string;
  language: "en" | "si";
}

export interface LegalLaw {
  section: string;
  law_name: string;
  law_type?: "primary" | "supporting";
  title: string;
  title_en?: string;
  title_si?: string;
  simple_explanation: string;
  simple_explanation_en?: string;
  simple_explanation_si?: string;
  reporting_guidance: string;
  reporting_guidance_en?: string;
  reporting_guidance_si?: string;
  relevance_score?: number;
  related_provisions?: LegalLaw[];
}

export interface LegalResult {
  detected_language: string;
  abuse_category: string;
  abuse_category_en?: string;
  abuse_category_si?: string;
  relevant_laws: LegalLaw[];
  decision_roadmap: string[];
  decision_roadmap_en?: string[];
  decision_roadmap_si?: string[];
  reporting_contacts: Array<{
    name: string;
    contact: string;
    description: string;
  }>;
  privacy_note: string;
}

export interface LegalAPIError {
  message: string;
  status?: number;
}
