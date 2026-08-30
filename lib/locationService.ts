// lib/locationService.ts
// Handles saving confirmed incident locations to Supabase and fetching district summaries.
// NOTE: place_name is stored for audit purposes but is NEVER exposed in the district summary.

import { supabase } from "./supabase";

// ────────────────────────────────────────────────────────────
// Sri Lanka district list (25 districts)
// Used to extract the district from a geocoded place_name string.
// ────────────────────────────────────────────────────────────
const SRI_LANKA_DISTRICTS = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Batticaloa",
  "Colombo",
  "Galle",
  "Gampaha",
  "Hambantota",
  "Jaffna",
  "Kalutara",
  "Kandy",
  "Kegalle",
  "Kilinochchi",
  "Kurunegala",
  "Mannar",
  "Matale",
  "Matara",
  "Monaragala",
  "Mullaitivu",
  "Nuwara Eliya",
  "Polonnaruwa",
  "Puttalam",
  "Ratnapura",
  "Trincomalee",
  "Vavuniya",
];

// O(1) lookup set — same values, used by isCanonicalDistrict
const SRI_LANKA_DISTRICT_SET = new Set(SRI_LANKA_DISTRICTS);

/**
 * Returns true when name exactly matches one of the 25 canonical Sri Lankan
 * district names. Used to validate geocoding-sourced district values.
 */
export function isCanonicalDistrict(name: string | null | undefined): boolean {
  if (!name) return false;
  return SRI_LANKA_DISTRICT_SET.has(name.trim());
}

/**
 * Extracts a Sri Lanka district name from a geocoded place_name string.
 * Works with both Google Maps formatted_address and Nominatim display_name outputs.
 *
 * Strategy:
 *  1. Check if any known district name appears as a substring of place_name.
 *  2. Return "Unknown" — do NOT use comma-split as fallback, because the first
 *     comma segment is typically a street, landmark, or local area name, not
 *     a district.
 */
export function extractDistrict(placeName: string | undefined | null): string {
  if (!placeName) return "Unknown";

  const lower = placeName.toLowerCase();

  // Sort by length descending so "Nuwara Eliya" matches before "Eliya"
  const sortedDistricts = [...SRI_LANKA_DISTRICTS].sort(
    (a, b) => b.length - a.length
  );

  for (const district of sortedDistricts) {
    if (lower.includes(district.toLowerCase())) {
      return district;
    }
  }

  // No district match found — return Unknown rather than a street/area name
  return "Unknown";
}

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface MarkedLocationInsert {
  district: string;
  latitude: number;
  longitude: number;
  place_name: string | null;
}

export interface DistrictSummaryItem {
  district: string;
  count: number;
}

/**
 * Sentinel values returned by saveMarkedLocation so callers can distinguish
 * between a genuine DB error and an unresolvable district.
 */
export const SAVE_RESULT = {
  /** Row was inserted successfully. Value is the UUID of the new row. */
  ok: (id: string) => ({ kind: "ok" as const, id }),
  /** District could not be resolved — row was NOT inserted. */
  noDistrict: () => ({ kind: "noDistrict" as const }),
  /** Supabase insert failed. */
  dbError: (msg: string) => ({ kind: "dbError" as const, msg }),
} as const;

export type SaveResult = ReturnType<(typeof SAVE_RESULT)[keyof typeof SAVE_RESULT]>;

// ────────────────────────────────────────────────────────────
// Save a confirmed location to marked_locations
// ────────────────────────────────────────────────────────────

/**
 * Persists a confirmed incident location to the `marked_locations` Supabase table.
 *
 * ⚠️  If the provided district is not canonical (or not provided), the row is NOT inserted.
 *     Returns SAVE_RESULT.noDistrict() so the caller can show a user-facing error.
 *
 * @returns SaveResult — ok(id) | noDistrict() | dbError(msg)
 */
export async function saveMarkedLocation(
  latitude: number,
  longitude: number,
  placeName?: string | null,
  district?: string | null
): Promise<SaveResult> {
  // ── Debug: log inputs before validation ──────────────────────────────────
  console.log("[locationService] 🏷  saveMarkedLocation called", {
    latitude,
    longitude,
    placeName: placeName ?? "(none)",
    districtArg: district ?? "(none)",
  });
  // ─────────────────────────────────────────────────────────────────────────

  // Guard: district must be passed and must be a canonical Sri Lanka district
  if (!district || !isCanonicalDistrict(district)) {
    console.warn(
      "[locationService] ❌ District validation failed (not canonical or missing) — insert blocked.",
      { placeName, district }
    );
    return SAVE_RESULT.noDistrict();
  }

  // ── Debug: log final object being inserted into Supabase (Spec Requirement F.6) ──
  console.log("[locationService] ✅ Final object being inserted into Supabase", {
    district,
    latitude,
    longitude,
    place_name: placeName ?? null,
  });
  // ─────────────────────────────────────────────────────────────────────────

  const payload: MarkedLocationInsert = {
    district,
    latitude,
    longitude,
    place_name: placeName ?? null,
  };

  const { data, error } = await supabase
    .from("marked_locations")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    console.error("[locationService] Failed to save marked location:", error.message);
    return SAVE_RESULT.dbError(error.message);
  }

  const id = data?.id ?? "";
  console.log("[locationService] 💾 Saved marked location:", id, "| district:", district);
  return SAVE_RESULT.ok(id);
}


// ────────────────────────────────────────────────────────────
// Fetch district summary (district + count only — no addresses)
// ────────────────────────────────────────────────────────────

/**
 * Fetches all rows from `marked_locations` and aggregates them by district.
 * Returns only { district, count } — place_name / coordinates are NOT included.
 *
 * Sorted descending by count.
 */
export async function fetchDistrictSummary(): Promise<DistrictSummaryItem[]> {
  const { data, error } = await supabase
    .from("marked_locations")
    .select("district");

  if (error) {
    console.error("[locationService] Failed to fetch district summary:", error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Aggregate by district in JS
  const counts: Record<string, number> = {};
  for (const row of data) {
    const d = row.district ?? "Unknown";
    counts[d] = (counts[d] ?? 0) + 1;
  }

  return Object.entries(counts)
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count);
}
