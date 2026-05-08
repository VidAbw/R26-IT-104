/**
 * Utility functions for the Legal RAG system
 */

export interface RoadmapStep {
  number: string;
  title: string;
  description: string;
}

/**
 * Parse roadmap steps from an array of strings
 * Expects format: "1. Title: Description"
 */
export function parseRoadmapSteps(roadmap: string[]): RoadmapStep[] {
  if (!roadmap) return [];
  return roadmap.map((step, index) => {
    // Try to match "1. Title: Description"
    const match = step.match(/^(\d+)\.\s*(.+):\s*(.+)$/);
    if (match) {
      return {
        number: match[1],
        title: match[2],
        description: match[3],
      };
    }
    
    // Try to match "Title: Description"
    const colonMatch = step.match(/^(.+):\s*(.+)$/);
    if (colonMatch) {
      return {
        number: (index + 1).toString(),
        title: colonMatch[1],
        description: colonMatch[2],
      };
    }

    // Default: use the whole string as description
    return {
      number: (index + 1).toString(),
      title: "",
      description: step,
    };
  });
}

/**
 * Format abuse category name for display
 */
export function formatAbuseCategory(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Validate legal query input
 */
export function validateLegalQuery(description: string): { valid: boolean; error?: string } {
  const trimmed = description.trim();
  
  if (!trimmed) {
    return { valid: false, error: "Description cannot be empty" };
  }
  
  if (trimmed.length < 10) {
    return { valid: false, error: "Description must be at least 10 characters" };
  }
  
  if (trimmed.length > 5000) {
    return { valid: false, error: "Description cannot exceed 5000 characters" };
  }
  
  return { valid: true };
}
