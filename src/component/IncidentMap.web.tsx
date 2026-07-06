import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator } from "react-native";

declare global {
  interface Window {
    google: any;
    initGoogleMapsCallback: () => void;
  }
}

interface IncidentMapProps {
  language: string;
  onLocationSelect: (latitude: number, longitude: number, placeName?: string) => void;
  selectedLocation: { latitude: number; longitude: number; placeName?: string } | null;
}

export default function IncidentMap({ language, onLocationSelect, selectedLocation }: IncidentMapProps) {
  const isSinhala = language === "si";
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const isKeyMissing = !apiKey || apiKey.trim() === "";

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tempLocation, setTempLocation] = useState<{ latitude: number; longitude: number; placeName?: string } | null>(null);
  
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
        setTempLocation({ latitude: colomboCenter.lat, longitude: colomboCenter.lng, placeName: "Colombo, Sri Lanka" });
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
      setTempLocation({ latitude: colomboCenter.lat, longitude: colomboCenter.lng, placeName: "Colombo, Sri Lanka" });
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
        fields: ["geometry", "name", "formatted_address"],
      });
      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;

        const loc = place.geometry.location;
        map.setCenter(loc);
        map.setZoom(15);
        marker.setPosition(loc);

        const name = place.formatted_address || place.name || "Searched Location";
        const lat = loc.lat();
        const lng = loc.lng();
        setTempLocation({ latitude: lat, longitude: lng, placeName: name });
        onLocationSelect(lat, lng, name);
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
      if (status === "OK" && results[0]) {
        const address = results[0].formatted_address;
        setTempLocation({ latitude: lat, longitude: lng, placeName: address });
        onLocationSelect(lat, lng, address);
        if (inputRef.current) {
          inputRef.current.value = address;
        }
      } else {
        console.warn("[IncidentMap] Google Geocoder failed with status:", status, "Falling back to Nominatim OSM API.");
        const osmLang = language === "si" ? "si,en" : "en";
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${osmLang}`, {
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
              setTempLocation({ latitude: lat, longitude: lng, placeName: address });
              onLocationSelect(lat, lng, address);
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
            setTempLocation({ latitude: lat, longitude: lng, placeName: fallbackName });
            onLocationSelect(lat, lng, fallbackName);
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

    // If query matches the currently selected tempLocation name, we just confirm it!
    if (tempLocation && query === tempLocation.placeName) {
      onLocationSelect(tempLocation.latitude, tempLocation.longitude, tempLocation.placeName);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { address: query },
      (results: any, status: string) => {
        if (status === "OK" && results[0]) {
          const loc = results[0].geometry.location;
          if (googleMapRef.current && markerRef.current) {
            googleMapRef.current.setCenter(loc);
            googleMapRef.current.setZoom(14);
            markerRef.current.setPosition(loc);
          }
          const name = results[0].formatted_address || results[0].name || query;
          setTempLocation({ latitude: loc.lat(), longitude: loc.lng(), placeName: name });
          onLocationSelect(loc.lat(), loc.lng(), name);
          if (inputRef.current) {
            inputRef.current.value = name;
          }
        } else {
          console.warn("[IncidentMap] Google Geocoder query failed with status:", status, "Falling back to Nominatim OSM search API.");
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=${language === "si" ? "si,en" : "en"}`, {
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
                
                if (googleMapRef.current && markerRef.current) {
                  const loc = new window.google.maps.LatLng(lat, lng);
                  googleMapRef.current.setCenter(loc);
                  googleMapRef.current.setZoom(14);
                  markerRef.current.setPosition(loc);
                }
                
                setTempLocation({ latitude: lat, longitude: lng, placeName: name });
                onLocationSelect(lat, lng, name);
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
