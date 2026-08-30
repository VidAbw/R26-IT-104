import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator } from "react-native";

declare global {
  interface Window {
    google: any;
    initGoogleMapsCallback: () => void;
  }
}

// ─── Canonical Sri Lankan district set (25 districts) ──────────────────────
const SL_DISTRICTS = new Set([
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
  "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
]);

// Sorted by descending length so "Nuwara Eliya" always beats "Eliya".
const SL_DISTRICTS_SORTED = [...SL_DISTRICTS].sort((a, b) => b.length - a.length);

// Mapping from Sinhala district names/variations to canonical English district names.
const SINHALA_DISTRICT_MAP: Record<string, string> = {
  "අම්පාර": "Ampara",
  "අනුරාධපුර": "Anuradhapura",
  "අනුරාධපුරය": "Anuradhapura",
  "බදුල්ල": "Badulla",
  "මඩකලපුව": "Batticaloa",
  "කොළඹ": "Colombo",
  "ගාල්ල": "Galle",
  "ගම්පහ": "Gampaha",
  "හම්බන්තොට": "Hambantota",
  "යාපනය": "Jaffna",
  "කළුතර": "Kalutara",
  "මහනුවර": "Kandy",
  "කෑගල්ල": "Kegalle",
  "කිලිනොච්චිය": "Kilinochchi",
  "කුරුණෑගල": "Kurunegala",
  "මන්නාරම": "Mannar",
  "මාතලේ": "Matale",
  "මාතර": "Matara",
  "මොනරාගල": "Monaragala",
  "මුලතිවු": "Mullaitivu",
  "මුලතීවු": "Mullaitivu",
  "නුවරඑළිය": "Nuwara Eliya",
  "නුවර එළිය": "Nuwara Eliya",
  "පොළොන්නරුව": "Polonnaruwa",
  "පුත්තලම": "Puttalam",
  "රත්නපුර": "Ratnapura",
  "රත්නපුරය": "Ratnapura",
  "ත්‍රිකුණාමලය": "Trincomalee",
  "ත්‍රිකුණාමල": "Trincomalee",
  "වවුනියාව": "Vavuniya"
};

/**
 * Strips common suffixes (like " District", " දිස්ත්‍රික්කය") and matches against
 * either English canonical names or the Sinhala-to-English translation mapping.
 */
function normaliseAndMatchDistrict(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let cleaned = String(raw).trim();
  
  // Remove "District" suffix (case-insensitive)
  cleaned = cleaned.replace(/\s*district\s*$/i, "").trim();
  
  // Remove Sinhala "දිස්ත්‍රික්කය" / "දිස්ත්‍රික්කයේ" suffix
  cleaned = cleaned.replace(/\s*දිස්ත්‍රික්කය\s*$/g, "").trim();
  cleaned = cleaned.replace(/\s*දිස්ත්‍රික්කයේ\s*$/g, "").trim();
  
  // Case-insensitive check in SL_DISTRICTS (canonical English set)
  const lower = cleaned.toLowerCase();
  for (const d of SL_DISTRICTS) {
    if (d.toLowerCase() === lower) return d;
  }
  
  // Check Sinhala map directly
  if (SINHALA_DISTRICT_MAP[cleaned]) {
    return SINHALA_DISTRICT_MAP[cleaned];
  }
  
  // Check Sinhala key mapping space-insensitively
  const compactedCleaned = cleaned.replace(/\s+/g, "");
  for (const key of Object.keys(SINHALA_DISTRICT_MAP)) {
    if (key.replace(/\s+/g, "") === compactedCleaned) {
      return SINHALA_DISTRICT_MAP[key];
    }
  }

  return null;
}

/**
 * Last-resort fallback: scans the raw formatted address / display_name string
 * for any canonical English or Sinhala district name appearing as a substring.
 */
function districtFromAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const lower = address.toLowerCase();
  
  // Scan English canonical names first (sorted by length descending)
  for (const d of SL_DISTRICTS_SORTED) {
    if (lower.includes(d.toLowerCase())) {
      return d;
    }
  }
  
  // Scan Sinhala district names (sorted by length descending)
  const sortedSinhalaKeys = Object.keys(SINHALA_DISTRICT_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedSinhalaKeys) {
    if (address.includes(key)) {
      return SINHALA_DISTRICT_MAP[key];
    }
  }
  
  return null;
}

/**
 * Extracts the canonical Sri Lanka district from a SINGLE Google Maps
 * address_components array. Used internally by extractDistrictFromAllResults.
 *
 * Checks structured components in this exact order of preference (per spec):
 * 1. administrative_area_level_2
 * 2. district
 * 3. state_district
 * 4. county
 * 5. city_district
 */
function extractDistrictFromComponents(components: any[]): string | null {
  if (!Array.isArray(components)) return null;

  const targetTypes = [
    "administrative_area_level_2",
    "district",
    "state_district",
    "county",
    "city_district"
  ];

  for (const type of targetTypes) {
    const comp = components.find((c: any) =>
      Array.isArray(c.types) && c.types.includes(type)
    );
    if (comp) {
      const matched = normaliseAndMatchDistrict(comp.long_name || comp.short_name);
      if (matched) return matched;
    }
  }

  return null;
}

/**
 * Scans ALL Google Geocoder result objects for the canonical district.
 *
 * Strategy:
 *  1. Try extractDistrictFromComponents on EVERY result's address_components in order.
 *  2. Fall back to scanning the formatted_address substring of every result.
 */
function extractDistrictFromAllResults(results: any[]): string | null {
  if (!Array.isArray(results) || results.length === 0) return null;

  // Pass 1 — structured component scan across all results in order
  for (const result of results) {
    const d = extractDistrictFromComponents(result?.address_components);
    if (d) return d;
  }

  // Pass 2 — substring scan of every formatted_address string in every result
  for (const result of results) {
    const d = districtFromAddress(result?.formatted_address);
    if (d) return d;
  }

  return null;
}

/**
 * Extracts the canonical Sri Lanka district from a Nominatim address object.
 *
 * Checks structured keys in this exact order of preference (per spec):
 * 1. administrative_area_level_2
 * 2. district
 * 3. state_district
 * 4. county
 * 5. city_district
 */
function extractDistrictFromNominatim(address: any, displayName?: string): string | null {
  if (address) {
    const districtFields = [
      "administrative_area_level_2",
      "district",
      "state_district",
      "county",
      "city_district"
    ];
    for (const field of districtFields) {
      if (address[field]) {
        const d = normaliseAndMatchDistrict(address[field]);
        if (d) return d;
      }
    }
  }
  // Fallback to substring scan on full display_name
  return districtFromAddress(displayName) ?? null;
}

/**
 * Logs detailed geocoding debug info to standard console (Spec requirement F).
 */
function logGeocodingDebug(
  source: string,
  lat: number,
  lng: number,
  results: any[] | null,
  addressComponents: any[] | null,
  normalizedDistrict: string | null | undefined
) {
  // Find administrative_area_level_2 component if components exist
  let adminAreaLevel2Comp = null;
  if (Array.isArray(addressComponents)) {
    adminAreaLevel2Comp = addressComponents.find((c: any) =>
      Array.isArray(c.types) && c.types.includes("administrative_area_level_2")
    );
  } else if (Array.isArray(results)) {
    for (const r of results) {
      if (r && Array.isArray(r.address_components)) {
        const found = r.address_components.find((c: any) =>
          Array.isArray(c.types) && c.types.includes("administrative_area_level_2")
        );
        if (found) {
          adminAreaLevel2Comp = found;
          break;
        }
      }
    }
  }

  console.log(`[IncidentMap Debug - ${source}] 📍 Geocoding Debug Information:`, {
    selectedCoordinates: { lat, lng },
    fullGoogleGeocoderResult: results,
    addressComponents: addressComponents ?? (results ? results.map(r => r.address_components) : null),
    administrativeAreaLevel2Component: adminAreaLevel2Comp,
    normalizedDistrict: normalizedDistrict ?? "Unknown"
  });
}


interface IncidentMapProps {
  language: string;
  onLocationSelect: (latitude: number, longitude: number, placeName?: string, district?: string) => void;
  selectedLocation: { latitude: number; longitude: number; placeName?: string } | null;
}

export default function IncidentMap({ language, onLocationSelect, selectedLocation }: IncidentMapProps) {
  const isSinhala = language === "si";
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const isKeyMissing = !apiKey || apiKey.trim() === "";

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tempLocation, setTempLocation] = useState<{ latitude: number; longitude: number; placeName?: string; district?: string } | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);

  // Temporary debug logging to verify key presence and render phase
  console.log("[DEBUG - IncidentMap] Component render. isKeyMissing:", isKeyMissing);
  console.log("[DEBUG - IncidentMap] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY value length:", apiKey ? apiKey.length : 0);
  console.log("[DEBUG - IncidentMap] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY value starts with:", apiKey ? `${apiKey.substring(0, 5)}...` : "<none>");
  console.log("[DEBUG - IncidentMap] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY full value:", apiKey || "<none>");
  console.log("[DEBUG - IncidentMap] State - mapLoaded:", mapLoaded, "loadError:", loadError);

  useEffect(() => {
    console.log("[DEBUG - IncidentMap] useEffect triggered. isKeyMissing:", isKeyMissing, "apiKey present:", !!apiKey);
    
    if (isKeyMissing) {
      console.log("[DEBUG - IncidentMap] API Key is missing. Skipping script loading / initialization.");
      return;
    }

    if (typeof window === "undefined") {
      console.log("[DEBUG - IncidentMap] window is undefined (SSR). Skipping.");
      return;
    }

    // Check if script already loaded
    if (window.google && window.google.maps) {
      console.log("[DEBUG - IncidentMap] Google Maps script already loaded in window. maps initialized:", !!window.google.maps);
      setMapLoaded(true);
      setTimeout(initMap, 100);
      return;
    }

    const callbackName = "initGoogleMapsCallback";
    (window as any)[callbackName] = () => {
      console.log("[DEBUG - IncidentMap] Google Maps callback executed.");
      setMapLoaded(true);
      initMap();
    };

    // Timeout if Google Maps fails to load
    const timeoutId = setTimeout(() => {
      if (!window.google || !window.google.maps) {
        console.warn("[DEBUG - IncidentMap] Timeout reached (10s) and Google Maps is not available.");
        setLoadError(
          isSinhala 
            ? "සිතියම පූරණය කිරීමට නොහැකි විය. කරුණාකර ඔබගේ අන්තර්ජාල සම්බන්ධතාවය පරීක්ෂා කරන්න." 
            : "Failed to load Google Maps. Please check your internet connection."
        );
      }
    }, 10000);

    const existingScript = document.getElementById("google-maps-script");
    if (!existingScript) {
      console.log("[DEBUG - IncidentMap] Appending Google Maps script element to head.");
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.error("[DEBUG - IncidentMap] Google Maps script loading failed at network level.");
        setLoadError(
          isSinhala 
            ? "ගූගල් සිතියම් පූරණය කිරීම අසාර්ථක විය." 
            : "Google Maps script loading failed."
        );
      };
      document.head.appendChild(script);
    } else {
      console.log("[DEBUG - IncidentMap] Google Maps script tag already exists. Waiting for object resolution.");
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          console.log("[DEBUG - IncidentMap] Google Maps successfully resolved via checkInterval.");
          clearInterval(checkInterval);
          setMapLoaded(true);
          initMap();
        }
      }, 500);
      
      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
      };
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [apiKey]);

  // Update marker position when selectedLocation changes externally
  useEffect(() => {
    if (mapLoaded && googleMapRef.current && markerRef.current) {
      if (selectedLocation) {
        const currentMarkerPos = markerRef.current.getPosition();
        const newPos = { lat: selectedLocation.latitude, lng: selectedLocation.longitude };
        
        if (!currentMarkerPos || 
            Math.abs(currentMarkerPos.lat() - newPos.lat) > 0.0001 || 
            Math.abs(currentMarkerPos.lng() - newPos.lng) > 0.0001) {
          markerRef.current.setPosition(newPos);
          googleMapRef.current.setCenter(newPos);
        }
        setTempLocation(selectedLocation);
        if (inputRef.current && selectedLocation.placeName) {
          inputRef.current.value = selectedLocation.placeName;
        }
      } else {
        // Clear/reset state to default Colombo
        const colomboCenter = { lat: 6.9271, lng: 79.8612 };
        markerRef.current.setPosition(colomboCenter);
        googleMapRef.current.setCenter({ lat: 7.8731, lng: 80.7718 });
        googleMapRef.current.setZoom(8);
        setTempLocation({ latitude: colomboCenter.lat, longitude: colomboCenter.lng, placeName: "Colombo, Sri Lanka", district: "Colombo" });
        if (inputRef.current) {
          inputRef.current.value = "Colombo, Sri Lanka";
        }
      }
    }
  }, [selectedLocation, mapLoaded]);

  const initMap = () => {
    console.log("[DEBUG - IncidentMap] initMap called. mapRef.current status:", !!mapRef.current);
    if (googleMapRef.current) {
      console.log("[DEBUG - IncidentMap] initMap aborted: Map already initialized.");
      return;
    }
    if (!mapRef.current || !window.google || !window.google.maps) {
      console.warn("[DEBUG - IncidentMap] initMap aborted: mapRef.current, window.google or window.google.maps missing.");
      return;
    }

    const sriLankaCenter = { lat: 7.8731, lng: 80.7718 }; // Central Sri Lanka
    const colomboCenter = { lat: 6.9271, lng: 79.8612 }; // Colombo

    const map = new window.google.maps.Map(mapRef.current, {
      center: sriLankaCenter,
      zoom: 8,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });
    googleMapRef.current = map;

    const initialPos = selectedLocation 
      ? { lat: selectedLocation.latitude, lng: selectedLocation.longitude }
      : colomboCenter;

    const marker = new window.google.maps.Marker({
      position: initialPos,
      map: map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
      title: isSinhala ? "සිද්ධිය වූ ස්ථානය" : "Incident Location",
    });
    markerRef.current = marker;

    if (!selectedLocation) {
        setTempLocation({ latitude: colomboCenter.lat, longitude: colomboCenter.lng, placeName: "Colombo, Sri Lanka", district: "Colombo" });
        if (inputRef.current) {
          inputRef.current.value = "Colombo, Sri Lanka";
        }
      } else {
        map.setCenter(initialPos);
        map.setZoom(13);
        setTempLocation(selectedLocation);
        if (inputRef.current && selectedLocation.placeName) {
          inputRef.current.value = selectedLocation.placeName;
        }
      }

      if (inputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ["geometry", "name", "formatted_address", "address_components"],
        });
        autocompleteRef.current = autocomplete;

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) return;

          const loc = place.geometry.location;
          map.setCenter(loc);
          map.setZoom(15);
          marker.setPosition(loc);

          // formatted_address is the full structured string ("Talbot Town, Galle 80000, Sri Lanka")
          // — always preferred over place.name for the address-scan fallback.
          const name = place.formatted_address || place.name || "Searched Location";
          const lat = loc.lat();
          const lng = loc.lng();

          // Try structured components first, then fall back to scanning the full
          // formatted_address string (catches "Galle" embedded in the address).
          const district =
            extractDistrictFromComponents(place.address_components) ??
            districtFromAddress(name) ??
            undefined;

          logGeocodingDebug("Autocomplete", lat, lng, null, place.address_components, district);

          setTempLocation({ latitude: lat, longitude: lng, placeName: name, district });
          onLocationSelect(lat, lng, name, district);
          if (inputRef.current) {
            inputRef.current.value = name;
          }
        });
      }

    map.addListener("click", (e: any) => {
      const clickedLoc = e.latLng;
      marker.setPosition(clickedLoc);
      reverseGeocode(clickedLoc.lat(), clickedLoc.lng());
    });

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) {
        reverseGeocode(pos.lat(), pos.lng());
      }
    });
  };

  const reverseGeocode = (lat: number, lng: number) => {
    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
      if (status === "OK" && Array.isArray(results) && results.length > 0) {
        // Use the first result's formatted_address as the human-readable place name
        const address = results[0].formatted_address;

        // Scan ALL results for the district — results[0] is often a POI/premise
        // that is missing administrative_area_level_2; deeper results carry it.
        const district = extractDistrictFromAllResults(results) ?? undefined;

        logGeocodingDebug("ReverseGeocode", lat, lng, results, null, district);

        setTempLocation({ latitude: lat, longitude: lng, placeName: address, district });
        onLocationSelect(lat, lng, address, district);
        if (inputRef.current) {
          inputRef.current.value = address;
        }
      } else {
        console.warn("[IncidentMap] Google Geocoder failed with status:", status, "Falling back to Nominatim OSM API.");
        const osmLang = language === "si" ? "si,en" : "en";
        // Add addressdetails=1 so Nominatim returns the structured address object
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${osmLang}&addressdetails=1`, {
          headers: {
            "Accept": "application/json",
            "User-Agent": "ChildSafetyApp/1.0"
          }
        })
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
          })
          .then((data) => {
            if (data && data.display_name) {
              const address = data.display_name;
              // Extract district using all available Nominatim fields + display_name fallback
              const district = extractDistrictFromNominatim(data.address, address) ?? undefined;
              // ─ Debug: inspect what Nominatim returned ─────────────────────────
              console.log("[IncidentMap] 📍 Nominatim reverseGeocode result", {
                displayName: address,
                addressObject: data.address,
                resolvedDistrict: district ?? "(none)",
              });
              // ─────────────────────────────────────────────────────────────────
              setTempLocation({ latitude: lat, longitude: lng, placeName: address, district });
              onLocationSelect(lat, lng, address, district);
              if (inputRef.current) {
                inputRef.current.value = address;
              }
            } else {
              throw new Error("No display name in Nominatim response");
            }
          })
          .catch((err) => {
            console.error("[IncidentMap] OSM Geocode fallback failed:", err);
            const fallbackName = `Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
            // No district available from fallback — store undefined
            setTempLocation({ latitude: lat, longitude: lng, placeName: fallbackName, district: undefined });
            onLocationSelect(lat, lng, fallbackName, undefined);
            if (inputRef.current) {
              inputRef.current.value = fallbackName;
            }
          });
      }
    });
  };

  const handleManualSearch = () => {
    if (!window.google || !window.google.maps || !inputRef.current) return;
    const query = inputRef.current.value.trim();
    if (!query) return;

    // If query matches the currently selected tempLocation, pass it through with district
    if (tempLocation && query === tempLocation.placeName) {
      onLocationSelect(tempLocation.latitude, tempLocation.longitude, tempLocation.placeName, tempLocation.district);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { address: query },
      (results: any, status: string) => {
        if (status === "OK" && Array.isArray(results) && results.length > 0) {
          const loc = results[0].geometry.location;
          if (googleMapRef.current && markerRef.current) {
            googleMapRef.current.setCenter(loc);
            googleMapRef.current.setZoom(14);
            markerRef.current.setPosition(loc);
          }
          const name = results[0].formatted_address || query;
          // Scan ALL results for district — same rationale as reverseGeocode
          const district = extractDistrictFromAllResults(results) ?? undefined;

          logGeocodingDebug("ManualSearch", loc.lat(), loc.lng(), results, null, district);
          setTempLocation({ latitude: loc.lat(), longitude: loc.lng(), placeName: name, district });
          onLocationSelect(loc.lat(), loc.lng(), name, district);
          if (inputRef.current) {
            inputRef.current.value = name;
          }
        } else {
          console.warn("[IncidentMap] Google Geocoder query failed with status:", status, "Falling back to Nominatim OSM search API.");
          // Add addressdetails=1 so Nominatim returns the structured address object
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=${language === "si" ? "si,en" : "en"}&addressdetails=1`, {
            headers: {
              "Accept": "application/json",
              "User-Agent": "ChildSafetyApp/1.0"
            }
          })
            .then((res) => {
              if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
              return res.json();
            })
            .then((data) => {
              if (data && data[0]) {
                const item = data[0];
                const lat = parseFloat(item.lat);
                const lng = parseFloat(item.lon);
                const name = item.display_name;
                // Extract district using all Nominatim fields + display_name fallback
                const district = extractDistrictFromNominatim(item.address, name) ?? undefined;
                // ─ Debug ─────────────────────────────────────────────────────────
                console.log("[IncidentMap] 🔍 handleManualSearch (Nominatim) result", {
                  displayName: name,
                  addressObject: item.address,
                  resolvedDistrict: district ?? "(none)",
                });
                // ───────────────────────────────────────────────────────────────────

                if (googleMapRef.current && markerRef.current) {
                  const loc = new window.google.maps.LatLng(lat, lng);
                  googleMapRef.current.setCenter(loc);
                  googleMapRef.current.setZoom(14);
                  markerRef.current.setPosition(loc);
                }

                setTempLocation({ latitude: lat, longitude: lng, placeName: name, district });
                onLocationSelect(lat, lng, name, district);
                if (inputRef.current) {
                  inputRef.current.value = name;
                }
              } else {
                throw new Error("No results found in Nominatim response");
              }
            })
            .catch((err) => {
              console.error("[IncidentMap] OSM Geocode query fallback failed:", err);
              alert(
                isSinhala
                  ? "ස්ථානය සොයා ගැනීමට නොහැකි විය. කරුණාකර වෙනත් ස්ථානයක් සොයන්න."
                  : "Location not found. Please try searching for a different area."
              );
            });
        }
      }
    );
  };

  if (isKeyMissing) {
    console.log("[DEBUG - IncidentMap] Rendering clean warning card for missing API key.");
    return (
      <div style={stylesWeb.warningCard}>
        <div style={stylesWeb.warningIconContainer}>⚠️</div>
        <span style={stylesWeb.warningTitle}>
          {isSinhala ? "සිතියම ක්‍රියාත්මක කළ නොහැක" : "Google Maps Configuration Missing"}
        </span>
        <span style={stylesWeb.warningDescription}>
          {isSinhala
            ? "ගූගල් සිතියම් ක්‍රියාත්මක කිරීම සඳහා EXPO_PUBLIC_GOOGLE_MAPS_API_KEY පරිසර විචල්‍යය සැකසිය යුතුය. කරුණාකර එය .env ගොනුවේ වින්‍යාස කරන්න."
            : "The environment variable EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Google Maps cannot load without a valid API key."}
        </span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={stylesWeb.errorContainer}>
        <span style={stylesWeb.errorText}>{loadError}</span>
        <div style={stylesWeb.manualInputRow}>
          <div style={stylesWeb.manualInputCol}>
            <label style={stylesWeb.manualLabel}>
              {isSinhala ? "ස්ථානයේ නම" : "Place Name"}
            </label>
            <input
              type="text"
              placeholder={isSinhala ? "නගරය හෝ පළාත ඇතුළත් කරන්න" : "Enter town or area"}
              value={selectedLocation?.placeName || ""}
              onChange={(e) => onLocationSelect(
                selectedLocation?.latitude || 7.8731,
                selectedLocation?.longitude || 80.7718,
                e.target.value
              )}
              style={stylesWeb.searchInput}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={stylesWeb.searchRow}>
        <input
          ref={inputRef}
          type="text"
          placeholder={isSinhala ? "ස්ථානයක් සොයන්න" : "Search a place"}
          style={stylesWeb.searchInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleManualSearch();
            }
          }}
        />
        <button
          type="button"
          onClick={handleManualSearch}
          style={stylesWeb.searchButton}
        >
          <span style={stylesWeb.buttonIcon}>📍</span>
          {isSinhala ? "ස්ථානය සලකුණු කරන්න" : "Mark Location"}
        </button>
      </div>

      {!mapLoaded ? (
        <div style={stylesWeb.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <span style={stylesWeb.loadingText}>
            {isSinhala ? "සිතියම පූරණය වෙමින්..." : "Loading Map..."}
          </span>
        </div>
      ) : null}

      <div
        ref={mapRef}
        style={{
          ...stylesWeb.mapContainer,
          display: mapLoaded ? "block" : "none",
        }}
      />
    </div>
  );
}

const stylesWeb = {
  searchRow: {
    display: "flex",
    flexDirection: "row" as const,
    gap: "12px",
    marginBottom: "16px",
    width: "100%",
  },
  searchInput: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    fontSize: "15px",
    color: "#1e293b",
    outline: "none",
    fontFamily: "system-ui, -apple-system, sans-serif",
    transition: "border-color 0.2s, background-color 0.2s",
  },
  searchButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "0 20px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06)",
    transition: "background-color 0.2s, transform 0.1s",
    whiteSpace: "nowrap" as const,
  },
  buttonIcon: {
    fontSize: "16px",
  },
  mapContainer: {
    width: "100%",
    height: "400px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f1f5f9",
    overflow: "hidden",
  },
  loadingContainer: {
    width: "100%",
    height: "400px",
    borderRadius: "12px",
    border: "1px dashed #cbd5e1",
    backgroundColor: "#f8fafc",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  },
  loadingText: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "500",
  },
  errorContainer: {
    width: "100%",
    padding: "24px",
    borderRadius: "12px",
    border: "1px solid #fecaca",
    backgroundColor: "#fef2f2",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  errorText: {
    fontSize: "14px",
    color: "#ef4444",
    fontWeight: "600",
  },
  manualInputRow: {
    display: "flex",
    flexDirection: "row" as const,
    gap: "12px",
    flexWrap: "wrap" as const,
    width: "100%",
  },
  manualInputCol: {
    flex: 1,
    minWidth: "150px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  manualLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase" as const,
  },
  warningCard: {
    width: "100%",
    padding: "24px",
    borderRadius: "12px",
    border: "1px dashed #cbd5e1",
    backgroundColor: "#f8fafc",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    boxSizing: "border-box" as const,
    marginVertical: "12px",
  },
  warningIconContainer: {
    width: "48px",
    height: "48px",
    borderRadius: "24px",
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
  },
  warningTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#475569",
    textAlign: "center" as const,
  },
  warningDescription: {
    fontSize: "13px",
    color: "#64748b",
    textAlign: "center" as const,
    lineHeight: "18px",
  },
};
